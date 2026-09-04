import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

export default function ReportsPage() {
  const [report, setReport] = useState({}); const [error, setError] = useState("");
  useEffect(() => { api.get("/reports/").then(({ data }) => setReport(data)).catch(() => setError("Unable to load reports.")); }, []);
  const exportReport = () => { const csv = ["Metric,Value", ...Object.entries(report).map(([key, value]) => `${key},${value}`)].join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); link.download = "placement-report.csv"; link.click(); URL.revokeObjectURL(link.href); };
  return <div className="flex min-h-screen"><Sidebar role="admin" /><main className="flex-1 bg-gray-50 p-6 md:p-10"><div className="flex flex-wrap items-end justify-between gap-4 mb-8"><div><p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Insights</p><h1 className="text-3xl font-bold text-[#1a5276]">Reports</h1></div><button onClick={exportReport} className="rounded-lg bg-[#e67e22] px-4 py-2 text-white font-semibold">Export CSV</button></div>{error && <p className="text-red-600 mb-4">{error}</p>}<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Object.entries(report).map(([key, value]) => <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"><p className="text-sm text-gray-500 capitalize">{key.replaceAll("_", " ")}</p><p className="text-3xl font-bold text-[#1a5276] mt-2">{value}</p></div>)}</div></main></div>;
}
