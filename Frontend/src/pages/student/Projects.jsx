import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import { projectsApi } from "../../api/endpoints";
import { resolveFileUrl } from "../../api/resolveFileUrl";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";

export default function StudentProjects() {
  const [projects, setProjects] = useState([]);
  const [uploading, setUploading] = useState(null);

  const load = () => projectsApi.list().then(({ data }) => setProjects(data.projects));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (id, file) => {
    if (!file) return;
    setUploading(id);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await projectsApi.submit(id, fd);
      toast.success("Project uploaded");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Projects" description="Track your project milestones and upload progress" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const sub = p.mySubmission;
          return (
            <div key={p._id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-navy-400">{p.subject?.name}</p>
                  <h3 className="mt-0.5 font-display font-semibold text-navy-900">{p.title}</h3>
                </div>
                <Badge status={sub?.status || "pending"} />
              </div>

              {p.description && <p className="mt-2 text-sm text-navy-500">{p.description}</p>}
              <p className="mt-2 text-xs text-navy-400">Due {new Date(p.deadline).toLocaleString()}</p>

              {sub?.status === "approved" || sub?.status === "rejected" ? (
                <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-600">
                  {sub.marks !== undefined && sub.marks !== null ? `${sub.marks}/${p.maxMarks} · ` : ""}
                  {sub.feedback || "Reviewed"}
                </p>
              ) : (
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-navy-200 py-2.5 text-xs font-semibold text-navy-500 hover:border-violet-400 hover:text-violet-600">
                  <Upload size={14} />
                  {uploading === p._id ? "Uploading..." : sub?.fileUrl ? "Update upload (PDF/ZIP)" : "Upload (PDF/ZIP)"}
                  <input
                    type="file"
                    accept=".pdf,.zip"
                    className="hidden"
                    onChange={(e) => handleSubmit(p._id, e.target.files[0])}
                  />
                </label>
              )}

              {sub?.fileUrl && (
                <a href={resolveFileUrl(sub.fileUrl)} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-navy-400 hover:text-navy-600">
                  View my upload
                </a>
              )}
            </div>
          );
        })}
        {projects.length === 0 && <p className="text-sm text-navy-400">No projects yet.</p>}
      </div>
    </div>
  );
}
