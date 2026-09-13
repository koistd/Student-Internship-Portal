import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "./config";
import { profileForUser } from "./auth";

const currentUser = () => auth.currentUser;
const currentUid = () => currentUser()?.uid;
const results = (items) => ({ count: items.length, next: null, previous: null, results: items });
const timestampValue = (value) => value?.toDate ? value.toDate().toISOString() : value || new Date().toISOString();

function profileData(data, uid) {
  return {
    id: uid,
    uid,
    username: data.username || data.email?.split("@")[0] || uid,
    email: data.email || "",
    full_name: data.fullName || "",
    role: data.role || "student",
    student_profile: data.studentProfile || null,
    employer_profile: data.employerProfile || null,
  };
}

function internshipData(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    posted_date: timestampValue(data.postedDate),
    deadline: data.deadline || "",
    company_name: data.companyName || "",
    company_location: data.companyLocation || data.location || "",
    is_active: data.isActive !== false,
  };
}

function applicationData(snapshot, internships = new Map()) {
  const data = snapshot.data();
  const internship = internships.get(data.internshipId);
  return {
    id: snapshot.id,
    internship: data.internshipId,
    internship_title: data.internshipTitle || internship?.title || "",
    internship_company: data.internshipCompany || internship?.companyName || "",
    cover_letter: data.coverLetter || "",
    resume: data.resumeUrl || data.resumePath || null,
    status: data.status || "submitted",
    applied_at: timestampValue(data.appliedAt),
    student_name: data.studentName || "",
    student_username: data.studentUsername || "",
  };
}

async function allDocs(collectionName, constraints = []) {
  const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
  return snapshot.docs;
}

async function internshipsForUser() {
  const user = currentUser();
  if (user) {
    const profile = await profileForUser(user);
    if (profile?.role === "employer") {
      return allDocs("internships", [where("postedBy", "==", user.uid)]);
    }
    if (profile?.role === "admin") return allDocs("internships");
  }
  return allDocs("internships", [where("isActive", "==", true)]);
}

async function applicationsForUser() {
  const user = currentUser();
  if (!user) return [];
  const profile = await profileForUser(user);
  if (profile?.role === "student") return allDocs("applications", [where("studentId", "==", user.uid)]);
  if (profile?.role === "admin") return allDocs("applications");
  const internships = await allDocs("internships", [where("postedBy", "==", user.uid)]);
  if (!internships.length) return [];
  const applications = await Promise.all(
    internships.map((internship) => allDocs("applications", [where("internshipId", "==", internship.id)])),
  );
  return applications.flat();
}

function filteredInternships(items, params = {}) {
  const search = (params.search || "").toLowerCase();
  return items
    .filter((item) => !search || [item.title, item.company_name, item.location, item.industry].some((value) => value?.toLowerCase().includes(search)))
    .filter((item) => !params.location || item.location?.toLowerCase().includes(params.location.toLowerCase()))
    .filter((item) => !params.industry || item.industry?.toLowerCase().includes(params.industry.toLowerCase()))
    .filter((item) => !params.duration || item.duration?.toLowerCase().includes(params.duration.toLowerCase()))
    .sort((a, b) => String(a.deadline).localeCompare(String(b.deadline)));
}

async function getPath(path, config = {}) {
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  if (clean === "users/me") return { data: await profileForUser(currentUser()) };
  if (clean === "health") return { data: { status: "ok", database: "firestore" } };

  if (clean === "internships") {
    const items = (await internshipsForUser()).map(internshipData);
    return { data: results(filteredInternships(items, config.params)) };
  }
  if (clean.startsWith("internships/")) {
    const snapshot = await getDoc(doc(db, "internships", clean.split("/")[1]));
    if (!snapshot.exists()) throw { response: { status: 404, data: { detail: "Internship not found." } } };
    return { data: internshipData(snapshot) };
  }
  if (clean === "applications") {
    const internshipDocs = await allDocs("internships");
    const internshipMap = new Map(internshipDocs.map((item) => [item.id, internshipData(item)]));
    return { data: results((await applicationsForUser()).map((item) => applicationData(item, internshipMap))) };
  }
  if (clean === "notifications") {
    const docs = await allDocs("notifications", [where("userId", "==", currentUid())]);
    const data = docs.map((item) => ({ id: item.id, message: item.data().message, type: item.data().type, is_read: item.data().isRead === true, created_at: timestampValue(item.data().createdAt) })).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { data: results(data) };
  }
  if (clean === "saved-internships") {
    const docs = await allDocs("savedInternships", [where("userId", "==", currentUid())]);
    return { data: docs.map((item) => item.data().internshipId) };
  }
  if (clean === "dashboard/student") {
    const applications = (await getPath("applications")).data.results;
    return { data: { stats: { applications_submitted: applications.length, interviews_scheduled: applications.filter((item) => item.status === "interview_scheduled").length, offers_received: applications.filter((item) => item.status === "accepted").length, placement_status: applications.some((item) => item.status === "accepted") ? "Placed" : "Pending" }, recent_applications: applications.slice(0, 5) } };
  }
  if (clean === "dashboard/employer") {
    const listings = (await getPath("internships")).data.results;
    const applications = (await getPath("applications")).data.results;
    return { data: { stats: { active_listings: listings.filter((item) => item.is_active).length, total_applications: applications.length, shortlisted: applications.filter((item) => item.status === "shortlisted").length, hired: applications.filter((item) => item.status === "accepted").length }, recent_applications: applications.slice(0, 5) } };
  }
  if (clean === "admin/users") {
    const docs = await allDocs("users");
    return { data: results(docs.map((item) => profileData(item.data(), item.id))) };
  }
  if (clean === "dashboard/admin") {
    const users = (await getPath("admin/users")).data.results;
    const listings = (await getPath("internships")).data.results;
    return { data: { stats: { total_students: users.filter((item) => item.role === "student").length, total_employers: users.filter((item) => item.role === "employer").length, active_listings: listings.filter((item) => item.is_active).length, pending_approvals: users.filter((item) => item.role === "employer" && !item.employer_profile?.is_approved).length }, recent_users: users.slice(0, 10), pending_employers: users.filter((item) => item.role === "employer" && !item.employer_profile?.is_approved) } };
  }
  if (clean === "reports") {
    const applications = (await getPath("applications")).data.results;
    const listings = (await getPath("internships")).data.results;
    return { data: { total_applications: applications.length, accepted: applications.filter((item) => item.status === "accepted").length, rejected: applications.filter((item) => item.status === "rejected").length, active_listings: listings.filter((item) => item.is_active).length } };
  }
  throw new Error(`Unsupported Firebase GET path: ${path}`);
}

async function postPath(path, payload, config = {}) {
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  if (clean === "applications") {
    const user = currentUser();
    const internshipSnapshot = await getDoc(doc(db, "internships", String(payload.get("internship"))));
    if (!user || !internshipSnapshot.exists()) throw new Error("Invalid application.");
    const internship = internshipData(internshipSnapshot);
    const duplicate = await getDocs(query(collection(db, "applications"), where("studentId", "==", user.uid), where("internshipId", "==", internship.id)));
    if (!duplicate.empty) throw { response: { status: 400, data: { internship: ["You have already applied for this internship."] } } };
    const resume = payload.get("resume");
    const applicationRef = await addDoc(collection(db, "applications"), { studentId: user.uid, studentUsername: user.email?.split("@")[0] || "", studentName: user.displayName || "", internshipId: internship.id, internshipTitle: internship.title, internshipCompany: internship.company_name, coverLetter: payload.get("cover_letter") || "", status: "submitted", appliedAt: serverTimestamp(), resumePath: null, resumeUrl: null });
    if (resume) {
      const fileRef = ref(storage, `resumes/${applicationRef.id}/${resume.name}`);
      await uploadBytes(fileRef, resume, { contentType: resume.type || "application/pdf" });
      await updateDoc(applicationRef, { resumePath: fileRef.fullPath, resumeUrl: await getDownloadURL(fileRef) });
    }
    await addDoc(collection(db, "notifications"), { userId: internship.postedBy, sourceStudentId: user.uid, applicationId: applicationRef.id, internshipId: internship.id, message: `New application received for '${internship.title}'.`, type: "application", isRead: false, createdAt: serverTimestamp() });
    const created = await getDoc(applicationRef);
    return { data: applicationData(created, new Map([[internship.id, internship]])) };
  }
  if (clean === "saved-internships") {
    const user = currentUser();
    const existing = await getDocs(query(collection(db, "savedInternships"), where("userId", "==", user.uid), where("internshipId", "==", String(payload.internshipId))));
    if (existing.empty) await addDoc(collection(db, "savedInternships"), { userId: user.uid, internshipId: String(payload.internshipId), createdAt: serverTimestamp() });
    else await Promise.all(existing.docs.map((item) => deleteDoc(item.ref)));
    return { data: { saved: existing.empty } };
  }
  if (clean === "internships") {
    const user = currentUser();
    const profile = await profileForUser(user);
    if (profile?.role !== "employer" || !profile.employer_profile?.is_approved) throw { response: { status: 403, data: { detail: "Approved employer access required." } } };
    const internshipRef = await addDoc(collection(db, "internships"), { title: payload.title, description: payload.description || "", requirements: payload.requirements || "", location: payload.location, industry: payload.industry || "", duration: payload.duration, stipend: payload.stipend, deadline: payload.deadline, isActive: true, postedBy: user.uid, companyName: profile.employer_profile.company_name || "", companyLocation: payload.location, postedDate: serverTimestamp() });
    return { data: internshipData(await getDoc(internshipRef)) };
  }
  throw new Error(`Unsupported Firebase POST path: ${path}`);
}

async function patchPath(path, payload) {
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  if (clean === "users/me") {
    const user = currentUser();
    const profileRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(profileRef);
    const data = snapshot.data() || {};
    const key = data.role === "student" ? "studentProfile" : "employerProfile";
    await updateDoc(profileRef, { [key]: { ...(data[key] || {}), ...(payload.student_profile || payload.employer_profile || {}) } });
    return { data: await profileForUser(user) };
  }
  if (clean.startsWith("internships/")) {
    const id = clean.split("/")[1];
    const update = {
      ...(payload.title === undefined ? {} : { title: payload.title }),
      ...(payload.description === undefined ? {} : { description: payload.description }),
      ...(payload.requirements === undefined ? {} : { requirements: payload.requirements }),
      ...(payload.location === undefined ? {} : { location: payload.location, companyLocation: payload.location }),
      ...(payload.industry === undefined ? {} : { industry: payload.industry }),
      ...(payload.duration === undefined ? {} : { duration: payload.duration }),
      ...(payload.stipend === undefined ? {} : { stipend: payload.stipend }),
      ...(payload.deadline === undefined ? {} : { deadline: payload.deadline }),
      ...(payload.is_active === undefined ? {} : { isActive: payload.is_active }),
    };
    await updateDoc(doc(db, "internships", id), update);
    return { data: internshipData(await getDoc(doc(db, "internships", id))) };
  }
  if (clean.startsWith("applications/") && clean.endsWith("update_status")) {
    const id = clean.split("/")[1];
    const applicationRef = doc(db, "applications", id);
    await updateDoc(applicationRef, { status: payload.status });
    const updated = await getDoc(applicationRef);
    const data = updated.data();
    await addDoc(collection(db, "notifications"), { userId: data.studentId, applicationId: id, internshipId: data.internshipId, message: `Your application for '${data.internshipTitle}' is now: ${payload.status.replaceAll("_", " ")}`, type: "status_update", isRead: false, createdAt: serverTimestamp() });
    return { data: { id, status: payload.status } };
  }
  if (clean.startsWith("notifications/")) {
    const id = clean.split("/")[1];
    await updateDoc(doc(db, "notifications", id), { isRead: true });
    return { data: { is_read: true } };
  }
  if (clean.startsWith("admin/employers/")) {
    const id = clean.split("/")[2];
    const profileRef = doc(db, "users", id);
    const snapshot = await getDoc(profileRef);
    const data = snapshot.data();
    await updateDoc(profileRef, { employerProfile: { ...(data.employerProfile || {}), is_approved: payload.approved === true } });
    return { data: profileData({ ...data, employerProfile: { ...(data.employerProfile || {}), is_approved: payload.approved === true } }, id) };
  }
  throw new Error(`Unsupported Firebase PATCH path: ${path}`);
}

async function deletePath(path) {
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  if (clean.startsWith("internships/")) {
    await deleteDoc(doc(db, "internships", clean.split("/")[1]));
    return { data: null };
  }
  throw new Error(`Unsupported Firebase DELETE path: ${path}`);
}

const api = {
  get: getPath,
  post: postPath,
  patch: patchPath,
  put: patchPath,
  delete: deletePath,
};

export default api;
