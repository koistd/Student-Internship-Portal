import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import InternshipCard from "../components/InternshipCard";
import ApplicationModal from "../components/ApplicationModal";
import api from "../utils/api";

export default function InternshipListing() {
  const [internships, setInternships] = useState([]);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState(null);
  const [filters, setFilters] = useState({ location: "", industry: "", duration: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = { search, ...filters };
    setLoading(true);
    setError("");
    api.get("/internships/", { params })
      .then((res) => setInternships(res.data.results || res.data))
      .catch(() => setError("Unable to load internships. Please try again."))
      .finally(() => setLoading(false));
  }, [search, filters]);

  const filtered = internships;

  return (
    <div className="flex">
      <Sidebar role="student" />
      <main className="flex-1 p-8 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Browse Internships</h1>
            <p className="text-sm text-gray-500">{filtered.length} opportunities available</p>
          </div>
          <input
            type="text"
            placeholder="Search by title, company, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          {[["location", "Location"], ["industry", "Industry"], ["duration", "Duration"]].map(([name, label]) => <input key={name} placeholder={label} value={filters[name]} onChange={(e) => setFilters({ ...filters, [name]: e.target.value })} className="border rounded px-3 py-2 text-sm" />)}
        </div>
        {error && <div className="flex justify-between gap-3 text-red-700 bg-red-50 rounded-lg p-3 mb-4 text-sm"><span>{error}</span><button type="button" className="font-semibold underline" onClick={() => setFilters({ ...filters })}>Try again</button></div>}

        {loading && <p className="text-gray-500 text-center mt-16">Loading internships...</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-gray-400 text-center mt-16">No internships found.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((internship) => (
            <InternshipCard key={internship.id} internship={internship} onApply={setSelected} />
          ))}
        </div>
      </main>

      {selected && (
        <ApplicationModal internship={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
