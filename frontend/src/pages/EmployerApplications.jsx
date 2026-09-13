import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import { DEMO_EMPLOYER_APPLICATIONS } from "../data/demoData";

const statuses = [["under_review", "Under Review"], ["shortlisted", "Shortlisted"], ["interview_scheduled", "Interview Scheduled"], ["accepted", "Accepted"], ["rejected", "Rejected"]];

export default function EmployerApplications() {
  const [items, setItems] = useState(DEMO_EMPLOYER_APPLICATIONS);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    api.get("/applications/")
      .then(({ data }) => setItems(data.results || data || DEMO_EMPLOYER_APPLICATIONS))
      .catch(() => {
        setItems(DEMO_EMPLOYER_APPLICATIONS);
        setError("Demo employer applications loaded locally. Connect Firebase to load live candidates.");
      });
  }, []);

  const update = async (id, status) => {
    try {
      const { data } = await api.patch(`/applications/${id}/update_status/`, { status });
      setItems((all) => all.map((item) => item.id === id ? { ...item, status: data.status } : item));
    } catch (err) {
      const nextStatus = status;
      setItems((all) => all.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
      setError(err.response?.data?.status?.[0] || "Demo status updated locally.");
    }
  };

  const downloadResume = async (item) => {
    setDownloading(item.id);
    setError("");
    try {
      const response = await fetch(item.resume || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
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

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="employer" />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Hiring pipeline</p>
          <h1 className="text-3xl font-bold text-slate-800 mb-8">Applications Received</h1>

          {error && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</p>}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr className="text-left">
                  <th className="p-4">Candidate</th>
                  <th className="p-4">Position</th>
                  <th className="p-4">Applied</th>
                  <th className="p-4">Update status</th>
                  <th className="p-4">Resume</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-4 font-semibold text-slate-800">{item.student_name}</td>
                    <td className="p-4 text-slate-700">{item.internship_title}</td>
                    <td className="p-4 text-slate-600">{new Date(item.applied_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <select value={item.status} onChange={(event) => update(item.id, event.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700">
                        <option value={item.status}>{item.status.replaceAll("_", " ")}</option>
                        {statuses.filter(([value]) => value !== item.status).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </td>
                    <td className="p-4">
                      <button type="button" className="font-semibold text-blue-600 disabled:opacity-50" onClick={() => downloadResume(item)} disabled={downloading === item.id}>
                        {downloading === item.id ? "Downloading..." : "Download resume"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!items.length && <p className="p-10 text-center text-gray-500">No applications received.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}

