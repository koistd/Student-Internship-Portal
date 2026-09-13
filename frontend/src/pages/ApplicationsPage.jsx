import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import { DEMO_STUDENT_APPLICATIONS } from "../data/demoData";

const labels = { submitted: "Submitted", under_review: "Under Review", shortlisted: "Shortlisted", interview_scheduled: "Interview Scheduled", accepted: "Accepted", rejected: "Rejected" };
const colors = { submitted: "bg-blue-100 text-blue-800", under_review: "bg-yellow-100 text-yellow-800", shortlisted: "bg-indigo-100 text-indigo-800", interview_scheduled: "bg-orange-100 text-orange-800", accepted: "bg-green-100 text-green-800", rejected: "bg-red-100 text-red-800" };

export default function ApplicationsPage() {
  const [applications, setApplications] = useState(DEMO_STUDENT_APPLICATIONS);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/applications/")
      .then(({ data }) => setApplications(data.results || data || DEMO_STUDENT_APPLICATIONS))
      .catch(() => {
        setApplications(DEMO_STUDENT_APPLICATIONS);
        setError("Demo student applications loaded locally. Connect Firebase to load live data.");
      });
  }, []);

  const shown = filter === "all" ? applications : applications.filter((item) => item.status === filter);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-between gap-4 mb-8 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Your journey</p>
              <h1 className="text-3xl font-bold text-slate-800">My Applications</h1>
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="border border-slate-200 rounded-xl px-4 py-2 bg-white text-slate-700 shadow-sm">
              <option value="all">All statuses</option>
              {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {error && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr className="text-left">
                  <th className="p-4">Company</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Applied date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{item.internship_company}</td>
                    <td className="p-4 text-slate-700">{item.internship_title}</td>
                    <td className="p-4 text-slate-600">{new Date(item.applied_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[item.status]}`}>{labels[item.status] || item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!shown.length && <p className="p-10 text-center text-gray-500">No applications match this filter.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

