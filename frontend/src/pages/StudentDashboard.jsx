import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import KpiCard from "../components/KpiCard";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import { DEMO_STUDENT_APPLICATIONS, DEMO_STUDENT_STATS } from "../data/demoData";

const STATUS_BADGE = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  interview_scheduled: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState(DEMO_STUDENT_APPLICATIONS);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(DEMO_STUDENT_STATS);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/dashboard/student/")
      .then((res) => {
        setApplications(res.data.recent_applications || DEMO_STUDENT_APPLICATIONS);
        setStats(res.data.stats || DEMO_STUDENT_STATS);
      })
      .catch(() => {
        setApplications(DEMO_STUDENT_APPLICATIONS);
        setStats(DEMO_STUDENT_STATS);
        setError("Demo data loaded locally. Connect Firebase to sync live data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Applications Submitted", value: stats.applications_submitted ?? 0, color: "blue" },
    { label: "Interviews Scheduled", value: stats.interviews_scheduled ?? 0, color: "yellow" },
    { label: "Offers Received", value: stats.offers_received ?? 0, color: "green" },
    { label: "Placement Status", value: stats.placement_status ?? "Pending", color: "purple" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="student" />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Student portal</p>
              <h1 className="text-3xl font-bold text-slate-800">Student Dashboard</h1>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 shadow-sm border border-slate-200">
              Welcome back, {user?.full_name || user?.username || "Aarav Sharma"}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
          </div>

          {error && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Recent Applications</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Live preview</span>
            </div>
            {loading && <p className="text-gray-500">Loading…</p>}
            {!loading && applications.length === 0 && <p className="text-gray-500 py-6">You have not applied to any internships yet.</p>}
            {!loading && applications.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-left text-slate-600">
                    <tr>
                      <th className="p-3">Company</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Applied On</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.id} className="border-t border-slate-200 hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-800">{app.internship_company}</td>
                        <td className="p-3 text-slate-700">{app.internship_title}</td>
                        <td className="p-3 text-slate-600">{new Date(app.applied_at).toLocaleDateString()}</td>
                        <td className="p-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                            {app.status.replaceAll("_", " ")}
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
