import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register/", form);
      login(data.user, data.access, data.refresh);
      navigate(form.role === "employer" ? "/employer/dashboard" : "/student/dashboard");
    } catch (err) {
      const details = err.response?.data;
      setError(details?.detail || Object.values(details || {}).flat().join(" ") || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-5">
      <div className="auth-card bg-white rounded-lg w-full max-w-md p-8">
        <div className="auth-brand"><span className="brand-mark">i</span><div><h1>Join Intern<span>Link</span></h1><p>Start your placement journey</p></div></div>
        <p className="auth-intro">Create an account to find your next opportunity</p>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input required name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full name" className="w-full border rounded px-3 py-2 text-sm" />
          <input required name="username" value={form.username} onChange={handleChange} placeholder="Username" className="w-full border rounded px-3 py-2 text-sm" />
          <input required type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email" className="w-full border rounded px-3 py-2 text-sm" />
          <input required minLength="8" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Password (at least 8 characters)" className="w-full border rounded px-3 py-2 text-sm" />
          <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2 text-sm">
            <option value="student">Student</option>
            <option value="employer">Employer</option>
          </select>
          <button type="submit" disabled={loading} className="w-full py-2 bg-[#e67e22] text-white rounded hover:bg-[#ca6f1e] disabled:opacity-50 text-sm font-medium">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-5">
          Already registered? <Link to="/login" className="text-[#e67e22] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
