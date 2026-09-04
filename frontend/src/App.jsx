import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./utils/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage        from "./pages/LoginPage";
import RegisterPage     from "./pages/RegisterPage";
import StudentDashboard from "./pages/StudentDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import InternshipListing from "./pages/InternshipListing";
import ApplicationsPage from "./pages/ApplicationsPage";
import EmployerListings from "./pages/EmployerListings";
import PostInternship from "./pages/PostInternship";
import ProfilePage from "./pages/ProfilePage";
import EmployerApplications from "./pages/EmployerApplications";
import AdminDashboard from "./pages/AdminDashboard";
import ReportsPage from "./pages/ReportsPage";
import AdminUsers from "./pages/AdminUsers";
import Home from "./pages/Home";
import NotificationsPage from "./pages/NotificationsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/student/dashboard" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/internships" element={
            <ProtectedRoute role="student"><InternshipListing /></ProtectedRoute>
          } />
          <Route path="/student/applications" element={<ProtectedRoute role="student"><ApplicationsPage /></ProtectedRoute>} />
          <Route path="/employer/dashboard" element={
            <ProtectedRoute role="employer"><EmployerDashboard /></ProtectedRoute>
          } />
          <Route path="/employer/listings" element={<ProtectedRoute role="employer"><EmployerListings /></ProtectedRoute>} />
          <Route path="/employer/post" element={<ProtectedRoute role="employer"><PostInternship /></ProtectedRoute>} />
          <Route path="/employer/applications" element={<ProtectedRoute role="employer"><EmployerApplications /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute role="admin"><ReportsPage /></ProtectedRoute>} />

          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
