import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

export default function EmployerListings() {
  const [listings, setListings] = useState([]);
  const [message, setMessage] = useState("");
  const load = () => api.get("/internships/").then(({ data }) => setListings(data.results || data)).catch(() => setMessage("Unable to load listings."));
  useEffect(load, []);
  const remove = async (id) => { if (!window.confirm("Delete this listing?")) return; try { await api.delete(`/internships/${id}/`); setListings((items) => items.filter((item) => item.id !== id)); } catch { setMessage("Only your own listings can be deleted."); } };
  const toggle = async (item) => { try { const { data } = await api.patch(`/internships/${item.id}/`, { is_active: !item.is_active }); setListings((items) => items.map((current) => current.id === item.id ? data : current)); } catch { setMessage("Unable to update listing status."); } };
  return <div className="flex min-h-screen"><Sidebar role="employer" /><main className="flex-1 bg-gray-50 p-6 md:p-10"><div className="flex justify-between items-center mb-8"><div><p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Employer workspace</p><h1 className="text-3xl font-bold text-[#1a5276]">Manage Listings</h1></div><Link to="/employer/post" className="rounded-lg bg-[#e67e22] px-4 py-2 text-white font-semibold">Post internship</Link></div>{message && <p className="text-red-600 mb-4">{message}</p>}<div className="bg-white rounded-xl shadow-sm border border-gray-100 table-scroll"><table className="w-full text-sm"><thead className="bg-[#d6eaf8] text-[#1a5276]"><tr className="text-left"><th className="p-4">Title</th><th className="p-4">Location</th><th className="p-4">Deadline</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr></thead><tbody>{listings.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="p-4 font-semibold">{item.title}</td><td className="p-4">{item.location}</td><td className="p-4">{item.deadline}</td><td className="p-4"><button onClick={() => toggle(item)} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{item.is_active ? "Active" : "Inactive"}</button></td><td className="p-4 flex gap-3"><Link to={`/employer/post?edit=${item.id}`} className="text-[#2e86c1] font-semibold">Edit</Link><button onClick={() => remove(item.id)} className="text-red-600 font-semibold">Delete</button></td></tr>)}</tbody></table>{!listings.length && <p className="p-10 text-center text-gray-500">No listings yet.</p>}</div></main></div>;
}
