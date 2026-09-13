import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import { DEMO_LISTINGS } from "../data/demoData";

export default function EmployerListings() {
  const [listings, setListings] = useState(DEMO_LISTINGS);
  const [message, setMessage] = useState("");

  const load = () => {
    api.get("/internships/")
      .then(({ data }) => setListings(data.results || data || DEMO_LISTINGS))
      .catch(() => {
        setListings(DEMO_LISTINGS);
        setMessage("Demo listings are shown locally. Connect Firebase to load live internship data.");
      });
  };

  useEffect(load, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this listing?")) return;
    try {
      await api.delete(`/internships/${id}/`);
      setListings((items) => items.filter((item) => item.id !== id));
    } catch {
      setListings((items) => items.filter((item) => item.id !== id));
      setMessage("Demo listing removed locally.");
    }
  };

  const toggle = async (item) => {
    try {
      const { data } = await api.patch(`/internships/${item.id}/`, { is_active: !item.is_active });
      setListings((items) => items.map((current) => current.id === item.id ? data : current));
    } catch {
      setListings((items) =>
        items.map((current) =>
          current.id === item.id ? { ...current, is_active: !current.is_active } : current,
        ),
      );
      setMessage("Demo listing status updated locally.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar role="employer" />
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Employer workspace</p>
              <h1 className="text-3xl font-bold text-slate-800">Manage Listings</h1>
            </div>
            <Link to="/employer/post" className="rounded-xl bg-[#e67e22] px-4 py-2.5 text-white font-semibold shadow-sm hover:bg-[#cf6b1d]">
              Post internship
            </Link>
          </div>

          {message && <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{message}</p>}

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr className="text-left">
                  <th className="p-4">Title</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Deadline</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((item) => (
                  <tr key={item.id} className="border-t border-slate-200">
                    <td className="p-4 font-semibold text-slate-800">{item.title}</td>
                    <td className="p-4 text-slate-600">{item.location}</td>
                    <td className="p-4 text-slate-600">{item.deadline}</td>
                    <td className="p-4">
                      <button
                        onClick={() => toggle(item)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="p-4 flex gap-3">
                      <Link to={`/employer/post?edit=${item.id}`} className="font-semibold text-blue-600">Edit</Link>
                      <button onClick={() => remove(item.id)} className="font-semibold text-red-600">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!listings.length && <p className="p-10 text-center text-gray-500">No listings yet.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
