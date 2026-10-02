import { useEffect, useState } from "react";
import { Check, X, Trash2, Loader2, GraduationCap, Phone, Mail, MapPin, School, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { admissionsApi } from "../../api/endpoints";
import { getSocket } from "../../api/socket";
import PageHeader from "../../components/ui/PageHeader";
import { Shimmer } from "../../components/ui/Skeleton";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminAdmissions() {
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [admissionNo, setAdmissionNo] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = (status) => {
    setItems(null);
    admissionsApi
      .list({ status })
      .then(({ data }) => setItems(data.applications))
      .catch(() => {
        setItems([]);
        toast.error("Couldn't load applications");
      });
  };

  useEffect(() => load(tab), [tab]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (payload) => {
      toast(`New application: ${payload.applicantName}`, { icon: "🎓" });
      if (tab === "pending") load("pending");
    };
    socket.on("admission:new", onNew);
    return () => socket.off("admission:new", onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const approve = async (id) => {
    if (!admissionNo.trim()) {
      toast.error("Enter an admission number to assign before approving");
      return;
    }
    setBusyId(id);
    try {
      await admissionsApi.update(id, { status: "approved", assignedAdmissionNumber: admissionNo.trim() });
      toast.success("Approved — family can now sign up with this admission number");
      setOpenId(null);
      setAdmissionNo("");
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id) => {
    setBusyId(id);
    try {
      await admissionsApi.update(id, { status: "rejected", adminNotes: rejectReason.trim() || undefined });
      toast.success("Application rejected");
      setOpenId(null);
      setRejectReason("");
      load(tab);
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const reconsider = async (id) => {
    setBusyId(id);
    try {
      await admissionsApi.update(id, { status: "pending" });
      toast.success("Moved back to pending");
      setItems((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this application permanently?")) return;
    setBusyId(id);
    try {
      await admissionsApi.remove(id);
      toast.success("Deleted");
      setItems((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader title="Admissions" description="Review applications submitted through the public 'Apply for Admission' form." />

      <div className="mb-5 flex gap-1 rounded-xl bg-navy-50 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "bg-white text-navy-900 shadow-sm" : "text-navy-400 hover:text-navy-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {items === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-navy-100 bg-white p-5">
              <Shimmer className="h-4 w-1/3" />
              <Shimmer className="mt-3 h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-navy-200 bg-white py-16 text-center">
          <GraduationCap size={32} className="text-navy-300" />
          <p className="mt-3 font-medium text-navy-600">Nothing here</p>
          <p className="mt-1 text-sm text-navy-400">
            {tab === "pending" ? "New applications will show up here in real time." : `No ${tab} applications yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a._id} className="rounded-2xl border border-navy-100 bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-navy-900">{a.applicantName}</p>
                    <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium capitalize text-navy-500">{a.gender}</span>
                    {a.status === "approved" && a.assignedAdmissionNumber && (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">#{a.assignedAdmissionNumber}</span>
                    )}
                    {a.enrolledStudent ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                        <UserCheck size={11} /> Account created
                      </span>
                    ) : (
                      a.status === "approved" && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Awaiting signup</span>
                      )
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-400">
                    <span className="flex items-center gap-1"><School size={12} /> Applying for {a.applyingForClass?.name || "—"}</span>
                    <span>DOB: {new Date(a.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {a.previousSchool && <span>Previously: {a.previousSchool}</span>}
                  </div>
                </div>
                <span className="text-xs text-navy-300">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-navy-50 pt-3 text-sm text-navy-600">
                <span className="flex items-center gap-1.5"><Phone size={13} className="text-navy-300" /> {a.parentName} · {a.parentMobile}</span>
                {a.parentEmail && <span className="flex items-center gap-1.5"><Mail size={13} className="text-navy-300" /> {a.parentEmail}</span>}
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-navy-300" /> {a.address}</span>
              </div>
              {a.notes && <p className="mt-2 text-sm italic text-navy-500">"{a.notes}"</p>}
              {a.adminNotes && tab === "rejected" && <p className="mt-2 text-xs text-red-500">Reason: {a.adminNotes}</p>}

              <div className="mt-4 border-t border-navy-50 pt-3">
                {tab === "pending" && (
                  <>
                    {openId === a._id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={admissionNo}
                            onChange={(e) => setAdmissionNo(e.target.value)}
                            placeholder="Assign admission number to approve"
                            className="input flex-1"
                          />
                          <button onClick={() => approve(a._id)} disabled={busyId === a._id} className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                            {busyId === a._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Confirm approve
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (optional)" className="input flex-1" />
                          <button onClick={() => reject(a._id)} disabled={busyId === a._id} className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50">
                            <X size={13} /> Confirm reject
                          </button>
                        </div>
                        <button onClick={() => setOpenId(null)} className="text-xs font-medium text-navy-400 hover:text-navy-600">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setOpenId(a._id)} className="rounded-lg bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-900">
                        Review application
                      </button>
                    )}
                  </>
                )}
                {tab !== "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => reconsider(a._id)} disabled={busyId === a._id} className="rounded-lg bg-navy-50 px-3 py-1.5 text-xs font-semibold text-navy-600 hover:bg-navy-100 disabled:opacity-50">
                      Move back to pending
                    </button>
                    <button onClick={() => remove(a._id)} disabled={busyId === a._id} className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
