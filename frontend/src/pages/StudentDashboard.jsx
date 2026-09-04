import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import KpiCard from "../components/KpiCard";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";

const STATUS_BADGE = {
  submitted:   "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-blue-100 text-blue-800",
  rejected:    "bg-red-100 text-red-800",
  interview_scheduled: "bg-purple-100 text-purple-800",
  accepted:    "bg-green-100 text-green-800",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({});
  const [error, setError]               = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/dashboard/student/")
      .then((res) => {
        setApplications(res.data.recent_applications || []);
        setStats(res.data.stats || {});
      })
      .catch(() => setError("Unable to load your dashboard. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Applications Submitted", value: stats.applications_submitted ?? 0, color: "blue" },
    { label: "Interviews Scheduled", value: stats.interviews_scheduled ?? 0, color: "yellow" },
    { label: "Offers Received", value: stats.offers_received ?? 0, color: "green" },
    { label: "Placement Status", value: stats.placement_status ?? "Pending", color: "purple" },
  ];

  return (
    <div className="flex">
      <Sidebar role="student" />
      <main className="flex-1 p-8 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-1">Student Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Welcome back, {user?.full_name || user?.username}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
          {loading && <p className="text-gray-500">Loading…</p>}
          {!loading && !error && applications.length === 0 && <p className="text-gray-500 py-6">You have not applied to any internships yet.</p>}
          {!loading && !error && applications.length > 0 && <div className="table-scroll"><table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2">Company</th>
                <th className="pb-2">Role</th>
                <th className="pb-2">Applied On</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 font-medium">{app.internship_company}</td>
                  <td className="py-2">{app.internship_title}</td>
                  <td className="py-2">{new Date(app.applied_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[app.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {app.status.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>}
        </div>
      </main>
    </div>
  );
}
