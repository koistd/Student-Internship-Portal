import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

const profileFromSnapshot = (snapshot, firebaseUser) => {
  const data = snapshot.exists() ? snapshot.data() : {};
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    username: data.username || firebaseUser.email?.split("@")[0] || firebaseUser.uid,
    email: firebaseUser.email || data.email || "",
    full_name: data.fullName || firebaseUser.displayName || "",
    role: data.role || "student",
    student_profile: data.studentProfile || null,
    employer_profile: data.employerProfile || null,
  };
};

export async function profileForUser(firebaseUser) {
  if (!firebaseUser) return null;
  const snapshot = await getDoc(doc(db, "users", firebaseUser.uid));
  return profileFromSnapshot(snapshot, firebaseUser);
}

export async function registerUser({ username, email, password, full_name, role }) {
  await setPersistence(auth, browserLocalPersistence);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: full_name });
  const profile = {
    uid: credential.user.uid,
    username,
    email,
    fullName: full_name,
    role,
    studentProfile: role === "student" ? { university: "", course: "", year_of_study: null, skills: "", resume_url: "" } : null,
    employerProfile: role === "employer" ? { company_name: "", designation: "", phone: "", is_approved: false } : null,
    createdAt: serverTimestamp(),
  };
  await setDoc(doc(db, "users", credential.user.uid), profile);
  return profileFromSnapshot({ exists: () => true, data: () => profile }, credential.user);
}

export async function loginUser(email, password) {
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return profileForUser(credential.user);
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export function logoutUser() {
  return signOut(auth);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
