import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import KpiCard from "../components/KpiCard";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";

const EMPTY_STATS = { active_listings: 0, total_applications: 0, shortlisted: 0, hired: 0 };

const STATUS_BADGE = {
  submitted:   "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  shortlisted: "bg-blue-100 text-blue-800",
  rejected:    "bg-red-100 text-red-800",
  interview_scheduled: "bg-purple-100 text-purple-800",
  accepted:    "bg-green-100 text-green-800",
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [apps, setApps]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api.get("/dashboard/employer/")
      .then((res) => { setStats(res.data.stats); setApps(res.data.recent_applications || []); })
      .catch(() => setError("Unable to load your dashboard. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Active Listings",    value: stats.active_listings,    color: "blue"   },
    { label: "Total Applications", value: stats.total_applications, color: "yellow" },
    { label: "Shortlisted",        value: stats.shortlisted,        color: "purple" },
    { label: "Hired",              value: stats.hired,              color: "green"  },
  ];

  return (
    <div className="flex">
      <Sidebar role="employer" />
      <main className="flex-1 p-8 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-1">Employer Dashboard</h1>
        <p className="text-sm text-gray-500 mb-6">Welcome back, {user?.full_name || user?.username}</p>

        {error && <p className="text-red-700 bg-red-50 rounded-lg p-3 mb-5 text-sm">{error}</p>}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
        </div>

        <div className="bg-white rounded shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
          {loading && <p className="text-gray-500 py-6">Loading applications...</p>}
          {!loading && !error && !apps.length && <p className="text-gray-500 py-6">No applications received yet.</p>}
          {!loading && !error && apps.length > 0 && <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-500">
                <th className="pb-2">Student</th>
                <th className="pb-2">Role Applied</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-2 font-medium">{a.student_name}</td>
                  <td className="py-2">{a.internship_title}</td>
                  <td className="py-2">{new Date(a.applied_at).toLocaleDateString()}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[a.status] ?? "bg-gray-100 text-gray-700"}`}>
                      {a.status.replaceAll("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>}
        </div>
      </main>
    </div>
  );
}
