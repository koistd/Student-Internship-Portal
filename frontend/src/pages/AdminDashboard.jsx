import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import KpiCard from "../components/KpiCard";
import api from "../utils/api";
import { DEMO_ADMIN_DATA } from "../data/demoData";

export default function AdminDashboard() {
  const [data, setData] = useState(DEMO_ADMIN_DATA);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/dashboard/admin/")
      .then(({ data: result }) => setData(result || DEMO_ADMIN_DATA))
      .catch(() => {
        setData(DEMO_ADMIN_DATA);
        setError("Demo admin data loaded locally. Connect Firebase to load live platform analytics.");
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = data.stats || {};

  const approve = async (id, approved) => {
    try {
      await api.patch(`/admin/employers/${id}/approve/`, { approved });
      setData({
        ...data,
        pending_employers: data.pending_employers.filter((user) => user.id !== id),
        stats: { ...stats, pending_approvals: Math.max(0, (stats.pending_approvals || 0) - 1) },
      });
    } catch {
      setData({
        ...data,
        pending_employers: data.pending_employers.filter((user) => user.id !== id),
        stats: { ...stats, pending_approvals: Math.max(0, (stats.pending_approvals || 0) - 1) },
      });
      setError("Demo approval applied locally.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="admin" />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Administration</p>
          <h1 className="text-3xl font-bold text-slate-800 mb-8">Portal overview</h1>

          {error && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}

          {loading ? (
            <p className="text-gray-500">Loading administration data...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard label="Total students" value={stats.total_students || 0} color="blue" />
                <KpiCard label="Total employers" value={stats.total_employers || 0} color="yellow" />
                <KpiCard label="Active listings" value={stats.active_listings || 0} color="green" />
                <KpiCard label="Pending approvals" value={stats.pending_approvals || 0} color="purple" />
              </div>

              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Pending employer approvals</h2>
                {data.pending_employers.map((user) => (
                  <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 py-3 last:border-0">
                    <span className="font-medium text-slate-700">{user.full_name || user.username}</span>
                    <button onClick={() => approve(user.id, true)} className="rounded-lg bg-[#27ae60] px-3 py-2 text-white text-sm font-semibold shadow-sm">Approve</button>
                  </div>
                ))}
                {!data.pending_employers.length && <p className="text-gray-500">No pending approvals.</p>}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-bold text-slate-800">Recently joined users</h2>
                {data.recent_users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between border-b border-slate-200 py-3 last:border-0">
                    <span className="font-medium text-slate-700">{user.full_name || user.username}</span>
                    <span className="capitalize text-sm text-slate-500">{user.role}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
