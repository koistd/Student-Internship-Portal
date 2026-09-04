export default function InternshipCard({ internship, onApply }) {
  const { title, company_name, company, location, duration, stipend, deadline } = internship;

  return (
    <div className="internship-card">
      <div className="company-avatar">{(company_name || company || "?").slice(0, 1).toUpperCase()}</div>
      <div>
        <h3 className="font-semibold text-base text-[#1a5276]">{title}</h3>
        <p className="text-sm text-gray-500">{company_name || company || "Company"}</p>
      </div>

      <div className="grid grid-cols-2 gap-1 text-sm text-gray-600">
        <span>⌖ {location}</span>
        <span>◷ {duration}</span>
        <span>◈ {stipend}</span>
        <span>▣ {new Date(deadline).toLocaleDateString()}</span>
      </div>

      <button
        onClick={() => onApply(internship)}
        className="mt-auto w-full py-2 bg-[#e67e22] text-white text-sm rounded-lg hover:bg-[#cf6d16] transition-colors"
      >
        Apply Now
      </button>
    </div>
  );
}
