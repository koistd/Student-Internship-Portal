import { useEffect, useState } from "react";
import api from "../utils/api";

export default function ApplicationModal({ internship, onClose }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume]           = useState(null);
  const [status, setStatus]           = useState("idle"); // idle | loading | success | error
  const [message, setMessage]         = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && status !== "loading") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverLetter.trim() || !resume) {
      setStatus("error");
      setMessage("A cover letter and PDF resume are required.");
      return;
    }
    setStatus("loading");

    const formData = new FormData();
    formData.append("internship", internship.id);
    formData.append("cover_letter", coverLetter);
    if (resume) formData.append("resume", resume);

    try {
      await api.post("/applications/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus("success");
      setMessage("Application submitted successfully!");
    } catch (err) {
      setStatus("error");
      const details = err.response?.data;
      setMessage(details?.detail || Object.values(details || {}).flat().join(" ") || "Submission failed. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && status !== "loading" && onClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" role="dialog" aria-modal="true" aria-labelledby="application-modal-title">
        <div className="flex justify-between items-center mb-4">
          <h2 id="application-modal-title" className="text-lg font-semibold">Apply — {internship.title}</h2>
          <button type="button" onClick={onClose} aria-label="Close application form" className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {status === "success" ? (
          <div className="text-center py-6">
            <p className="text-green-600 font-medium text-lg">✓ {message}</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cover Letter</label>
              <textarea
                required
                rows={5}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Why are you a good fit for this role?"
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Resume (PDF)</label>
              <input
                type="file"
                required
                accept=".pdf"
                onChange={(e) => setResume(e.target.files[0])}
                className="w-full text-sm"
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm">{message}</p>
            )}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {status === "loading" ? "Submitting…" : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
