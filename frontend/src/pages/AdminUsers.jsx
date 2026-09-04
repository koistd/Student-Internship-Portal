import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]); const [error, setError] = useState("");
  useEffect(() => { api.get("/admin/users/").then(({ data }) => setUsers(data.results || data)).catch(() => setError("Admin access is required.")); }, []);
  return <div className="flex min-h-screen"><Sidebar role="admin" /><main className="flex-1 bg-gray-50 p-6 md:p-10"><p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Administration</p><h1 className="text-3xl font-bold text-[#1a5276] mb-8">Manage users</h1>{error && <p className="text-red-600 mb-4">{error}</p>}<div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">{users.map((user) => <div key={user.id} className="flex justify-between border-b py-4 last:border-0"><div><p className="font-semibold">{user.full_name || user.username}</p><p className="text-sm text-gray-500">{user.email}</p></div><span className="capitalize text-gray-500">{user.role}</span></div>)}{!users.length && <p className="text-gray-500">No users found.</p>}</div></main></div>;
}
