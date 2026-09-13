import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import KpiCard from "../components/KpiCard";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { DEMO_EMPLOYER_APPLICATIONS, DEMO_EMPLOYER_STATS } from "../data/demoData";

const EMPTY_STATS = { active_listings: 0, total_applications: 0, shortlisted: 0, hired: 0 };

const STATUS_BADGE = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  interview_scheduled: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(DEMO_EMPLOYER_STATS);
  const [apps, setApps] = useState(DEMO_EMPLOYER_APPLICATIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/dashboard/employer/")
      .then((res) => {
        setStats(res.data.stats || DEMO_EMPLOYER_STATS);
        setApps(res.data.recent_applications || DEMO_EMPLOYER_APPLICATIONS);
      })
      .catch(() => {
        setStats(DEMO_EMPLOYER_STATS);
        setApps(DEMO_EMPLOYER_APPLICATIONS);
        setError("Demo data loaded locally. Connect Firebase to sync live employer data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Active Listings", value: stats.active_listings, color: "blue" },
    { label: "Total Applications", value: stats.total_applications, color: "yellow" },
    { label: "Shortlisted", value: stats.shortlisted, color: "purple" },
    { label: "Hired", value: stats.hired, color: "green" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="employer" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Employer portal</p>
              <h1 className="text-3xl font-bold text-slate-800">Employer Dashboard</h1>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm border border-slate-200">
              Welcome back, {user?.full_name || user?.username || "Riya Kapoor"}
            </div>
          </div>

          {error && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Recent Applications</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Pipeline</span>
            </div>
            {loading && <p className="text-gray-500 py-6">Loading applications...</p>}
            {!loading && apps.length === 0 && <p className="text-gray-500 py-6">No applications received yet.</p>}
            {!loading && apps.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-600">
                    <tr>
                      <th className="p-3">Student</th>
                      <th className="p-3">Role Applied</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a) => (
                      <tr key={a.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{a.student_name}</td>
                        <td className="p-3 text-slate-700">{a.internship_title}</td>
                        <td className="p-3 text-slate-600">{new Date(a.applied_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {a.status.replaceAll("_", " ")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
