import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

const labels = { submitted: "Submitted", under_review: "Under Review", shortlisted: "Shortlisted", interview_scheduled: "Interview Scheduled", accepted: "Accepted", rejected: "Rejected" };
const colors = { submitted: "bg-blue-100 text-blue-800", under_review: "bg-yellow-100 text-yellow-800", shortlisted: "bg-indigo-100 text-indigo-800", interview_scheduled: "bg-orange-100 text-orange-800", accepted: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" };

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  useEffect(() => { api.get("/applications/").then(({ data }) => setApplications(data.results || data)).catch(() => setError("Unable to load applications.")); }, []);
  const shown = filter === "all" ? applications : applications.filter((item) => item.status === filter);
  return <div className="flex min-h-screen"><Sidebar /><main className="flex-1 bg-gray-50 p-6 md:p-10"><div className="flex flex-wrap justify-between gap-4 mb-8"><div><p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Your journey</p><h1 className="text-3xl font-bold text-[#1a5276]">My Applications</h1></div><select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-gray-200 rounded-lg px-4 py-2 bg-white"><option value="all">All statuses</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{error && <p className="text-red-600 mb-4">{error}</p>}<div className="bg-white rounded-xl shadow-sm border border-gray-100 table-scroll"><table className="w-full text-sm"><thead className="bg-[#d6eaf8] text-[#1a5276]"><tr className="text-left"><th className="p-4">Company</th><th className="p-4">Position</th><th className="p-4">Applied date</th><th className="p-4">Status</th></tr></thead><tbody>{shown.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-semibold">{item.internship_company}</td><td className="p-4">{item.internship_title}</td><td className="p-4">{new Date(item.applied_at).toLocaleDateString()}</td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[item.status]}`}>{labels[item.status] || item.status}</span></td></tr>)}</tbody></table>{!shown.length && <p className="p-10 text-center text-gray-500">No applications match this filter.</p>}</div></main></div>;
}
