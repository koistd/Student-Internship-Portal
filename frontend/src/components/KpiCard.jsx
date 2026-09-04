export default function KpiCard({ label, value, color = "blue" }) {
  const colors = {
    blue: "bg-blue-50 border-blue-400 text-blue-700",
    green: "bg-green-50 border-green-400 text-green-700",
    yellow: "bg-yellow-50 border-yellow-400 text-yellow-700",
    purple: "bg-purple-50 border-purple-400 text-purple-700",
  };
  const icon = label.toLowerCase().includes("application") ? "▣" : label.toLowerCase().includes("interview") ? "◷" : label.toLowerCase().includes("offer") || label.toLowerCase().includes("hired") ? "✓" : "↗";
  return (
    <div className={`kpi-card ${colors[color]}`}>
      <div className="kpi-icon">{icon}</div>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value ?? "—"}</p>
    </div>
  );
}
