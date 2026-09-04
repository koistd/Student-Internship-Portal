import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";

const formatDate = (value) => new Date(value).toLocaleString([], {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = () => {
    setLoading(true);
    setError("");
    api.get("/notifications/")
      .then(({ data }) => setNotifications(data.results || data))
      .catch(() => setError("Unable to load notifications. Please try again."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await api.patch(`/notifications/${notification.id}/`, { is_read: true });
      setNotifications((items) => items.map((item) => (
        item.id === notification.id ? { ...item, is_read: true } : item
      )));
    } catch {
      setError("Unable to update this notification.");
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user?.role} />
      <main className="flex-1 bg-gray-50 p-6 md:p-10">
        <p className="text-orange-600 text-sm font-bold uppercase tracking-wider">Your updates</p>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1a5276]">Notifications</h1>
            <p className="text-gray-500 mt-2">Stay up to date with your placement activity.</p>
          </div>
          {!loading && <span className="text-sm text-gray-500">{notifications.filter((item) => !item.is_read).length} unread</span>}
        </div>

        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-700 mb-5">
            <span>{error}</span>
            <button type="button" onClick={loadNotifications} className="font-semibold underline">Try again</button>
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading && <p className="p-8 text-gray-500">Loading notifications...</p>}
          {!loading && !error && !notifications.length && <p className="p-10 text-center text-gray-500">No notifications yet.</p>}
          {!loading && notifications.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <li key={notification.id} className={`p-5 flex gap-4 items-start ${notification.is_read ? "" : "bg-blue-50/50"}`}>
                  <span className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${notification.is_read ? "bg-gray-300" : "bg-[#e67e22]"}`} aria-label={notification.is_read ? "Read" : "Unread"} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[#2c3e50]">{notification.message}</p>
                    <time className="block text-xs text-gray-400 mt-2" dateTime={notification.created_at}>{formatDate(notification.created_at)}</time>
                  </div>
                  {!notification.is_read && <button type="button" onClick={() => markRead(notification)} className="text-xs font-semibold text-[#2e86c1] whitespace-nowrap">Mark read</button>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
