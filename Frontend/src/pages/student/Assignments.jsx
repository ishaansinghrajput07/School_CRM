import { useEffect, useState } from "react";
import { Paperclip, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { assignmentsApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [uploading, setUploading] = useState(null);

  const load = () => assignmentsApi.list().then(({ data }) => setAssignments(data.assignments));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (id, file) => {
    if (!file) return;
    setUploading(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await assignmentsApi.submit(id, fd);
      toast.success("Submitted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Assignments" description="Everything due, and everything you've already turned in" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assignments.map((a) => {
          const sub = a.mySubmission;
          const overdue = new Date() > new Date(a.deadline) && (!sub || sub.status === "pending");
          return (
            <div key={a._id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-navy-400">{a.subject?.name}</p>
                  <h3 className="mt-0.5 font-display font-semibold text-navy-900">{a.title}</h3>
                </div>
                <Badge status={overdue ? "late" : sub?.status || "pending"} />
              </div>

              {a.description && <p className="mt-2 text-sm text-navy-500">{a.description}</p>}
              <p className="mt-2 text-xs text-navy-400">Due {new Date(a.deadline).toLocaleString()}</p>

              {a.attachmentUrl && (
                <a href={resolveFileUrl(a.attachmentUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 hover:text-teal-700">
                  <Paperclip size={12} /> Assignment brief
                </a>
              )}

              {sub?.status === "approved" || sub?.status === "rejected" ? (
                <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-600">
                  {sub.marks !== undefined && sub.marks !== null ? `${sub.marks}/${a.maxMarks} · ` : ""}
                  {sub.remarks || "Graded"}
                </p>
              ) : (
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy-200 py-2.5 text-xs font-semibold text-navy-500 hover:border-teal-400 hover:text-teal-600">
                  <Upload size={14} />
                  {uploading === a._id ? "Uploading..." : sub?.fileUrl ? "Re-submit (PDF/ZIP)" : "Submit (PDF/ZIP)"}
                  <input
                    type="file"
                    accept=".pdf,.zip"
                    className="hidden"
                    onChange={(e) => handleSubmit(a._id, e.target.files[0])}
                  />
                </label>
              )}

              {sub?.fileUrl && (
                <a href={resolveFileUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-navy-400 hover:text-navy-600">
                  View my submission
                </a>
              )}
            </div>
          );
        })}
        {assignments.length === 0 && <p className="text-sm text-navy-400">No assignments yet.</p>}
      </div>
    </div>
  );
}
