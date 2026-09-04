import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth(); const [profile, setProfile] = useState(user); const [saved, setSaved] = useState(false); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { api.get("/users/me/").then(({ data }) => setProfile(data)).catch(() => setError("Unable to load your profile.")).finally(() => setLoading(false)); }, []);
  const role = profile?.role; const details = role === "student" ? profile?.student_profile : profile?.employer_profile;
  const update = (event) => { const name = event.target.name; setProfile({ ...profile, [role === "student" ? "student_profile" : "employer_profile"]: { ...details, [name]: event.target.value } }); };
  const save = async (event) => { event.preventDefault(); setError(""); setSaved(false); setSaving(true); try { const { data } = await api.patch("/users/me/", { [role === "student" ? "student_profile" : "employer_profile"]: details }); setProfile(data); setSaved(true); } catch { setError("Unable to save profile."); } finally { setSaving(false); } };
  const fields = role === "student" ? [["university","University"],["course","Course"],["year_of_study","Year of study"],["skills","Skills"]] : [["company_name","Company name"],["designation","Designation"],["phone","Phone"]];
  return <div className="flex min-h-screen"><Sidebar role={role} /><main className="flex-1 bg-gray-50 p-6 md:p-10"><h1 className="text-3xl font-bold text-[#1a5276] mb-2">Profile</h1><p className="text-gray-500 mb-8">Keep your details current for better opportunities.</p>{error && <p className="text-red-600 mb-4">{error}</p>}{saved && <p className="text-green-700 mb-4">Profile saved.</p>}{loading ? <p className="text-gray-500">Loading profile...</p> : <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl grid gap-5">{fields.map(([name, label]) => <label key={name} className="text-sm font-semibold">{label}<input name={name} value={details?.[name] || ""} onChange={update} className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 font-normal" /></label>)}<button disabled={saving} className="rounded-lg bg-[#1a5276] px-5 py-3 text-white font-semibold disabled:opacity-50">{saving ? "Saving..." : "Save profile"}</button></form>}</main></div>;
}
