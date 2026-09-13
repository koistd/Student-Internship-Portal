import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "../utils/AuthContext";
import { loginUser } from "../firebase/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) { setError("Both fields are required."); return; }
    setLoading(true);
    try {
      const data = await loginUser(form.email, form.password);
      login(data);
      if (data.role === "employer") navigate("/employer/dashboard");
      else if (data.role === "admin") navigate("/admin");
      else                             navigate("/student/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center p-5">
      <div className="auth-card bg-white rounded-lg w-full max-w-md p-8">
        <div className="auth-brand"><span className="brand-mark">i</span><div><h1>Intern<span>Link</span></h1><p>Internship & placement portal</p></div></div>
        <p className="auth-intro">Sign in to continue to your workspace</p>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-50 p-2 rounded">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="password-field">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange}
              placeholder="••••••••"
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Hide" : "Show"}</button>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2 bg-[#1a5276] text-white rounded hover:bg-[#154360] disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-5">
          No account? <Link to="/register" className="text-[#e67e22] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
