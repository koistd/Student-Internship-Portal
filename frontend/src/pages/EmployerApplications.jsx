import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

const statuses = [["under_review", "Under Review"], ["shortlisted", "Shortlisted"], ["interview_scheduled", "Interview Scheduled"], ["accepted", "Accepted"], ["rejected", "Rejected"]];
export default function EmployerApplications() {
  const [items, setItems] = useState([]); const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);
  useEffect(() => { api.get("/applications/").then(({ data }) => setItems(data.results || data)).catch(() => setError("Unable to load applications.")); }, []);
  const update = async (id, status) => { try { const { data } = await api.patch(`/applications/${id}/update_status/`, { status }); setItems((all) => all.map((item) => item.id === id ? { ...item, status: data.status } : item)); } catch (err) { setError(err.response?.data?.status?.[0] || "That status transition is not allowed."); } };
  const downloadResume = async (item) => {
    setDownloading(item.id);
    setError("");
    try {
      const response = await fetch(item.resume);
      if (!response.ok) throw new Error("Resume download failed.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `${item.student_username || "candidate"}-resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Unable to download this resume.");
    } finally {
      setDownloading(null);
    }
  };
  return <div className="flex min-h-screen"><Sidebar role="employer" /><main className="flex-1 bg-gray-50 p-6 md:p-10"><p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Hiring pipeline</p><h1 className="text-3xl font-bold text-[#1a5276] mb-8">Applications Received</h1>{error && <p className="text-red-600 mb-4">{error}</p>}<div className="bg-white rounded-xl border border-gray-100 shadow-sm table-scroll"><table className="w-full text-sm"><thead className="bg-[#d6eaf8] text-[#1a5276]"><tr className="text-left"><th className="p-4">Candidate</th><th className="p-4">Position</th><th className="p-4">Applied</th><th className="p-4">Update status</th><th className="p-4">Resume</th></tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-semibold">{item.student_name}</td><td className="p-4">{item.internship_title}</td><td className="p-4">{new Date(item.applied_at).toLocaleDateString()}</td><td className="p-4"><select value={item.status} onChange={(event) => update(item.id, event.target.value)} className="border rounded-lg px-2 py-1"><option value={item.status}>{item.status.replaceAll("_", " ")}</option>{statuses.filter(([value]) => value !== item.status).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td className="p-4">{item.resume ? <button type="button" className="text-[#2e86c1] font-semibold disabled:opacity-50" onClick={() => downloadResume(item)} disabled={downloading === item.id}>{downloading === item.id ? "Downloading..." : "Download resume"}</button> : "Not provided"}</td></tr>)}</tbody></table>{!items.length && <p className="p-10 text-center text-gray-500">No applications received.</p>}</div></main></div>;
}
