import { Fragment, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, IndianRupee, Award, Users, ShieldCheck, ShieldAlert, Settings2 } from "lucide-react";
import { attendanceApi, studentsApi, feesApi, resultsApi, classesApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";

const FEE_STATUS_TONE = {
  paid: "bg-teal-100 text-teal-700",
  partial: "bg-amber-100 text-amber-700",
  pending: "bg-red-100 text-red-700",
};

// Aggregates a student's (possibly many) fee rows - Tuition, Transport,
// Library, etc. - into one paid/total/outstanding summary for the class table.
function summarizeFees(feeRows) {
  const total = feeRows.reduce((sum, f) => sum + f.amount + (f.fine || 0), 0);
  const paid = feeRows.reduce((sum, f) => sum + f.amountPaid, 0);
  const status = feeRows.length === 0 ? null : paid >= total ? "paid" : paid > 0 ? "partial" : "pending";
  return { total, paid, outstanding: Math.max(total - paid, 0), status };
}

export default function TeacherClassOverview() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [feesByStudent, setFeesByStudent] = useState({});
  const [resultsByStudent, setResultsByStudent] = useState({});
  const [eligibilityByStudent, setEligibilityByStudent] = useState({});
  const [requiredPercent, setRequiredPercent] = useState(75);
  const [policyDraft, setPolicyDraft] = useState(75);
  const [policySaving, setPolicySaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    attendanceApi.myClasses().then(({ data }) => setClasses(data.classes));
  }, []);

  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }
    setLoading(true);
    setExpanded(null);
    Promise.all([
      studentsApi.list({ class: selectedClass, limit: 200 }),
      feesApi.list({ class: selectedClass }),
      resultsApi.forClass(selectedClass),
      attendanceApi.eligibility(selectedClass),
    ])
      .then(([studentsRes, feesRes, resultsRes, eligibilityRes]) => {
        setStudents(studentsRes.data.students);

        const feeMap = {};
        feesRes.data.fees.forEach((f) => {
          const sid = f.student?._id || f.student;
          if (!feeMap[sid]) feeMap[sid] = [];
          feeMap[sid].push(f);
        });
        setFeesByStudent(feeMap);

        const resultMap = {};
        (resultsRes.data.results || []).forEach((r) => {
          resultMap[r.student._id] = r;
        });
        setResultsByStudent(resultMap);

        const eligMap = {};
        eligibilityRes.data.roster.forEach((row) => {
          eligMap[row.student._id] = row;
        });
        setEligibilityByStudent(eligMap);
        setRequiredPercent(eligibilityRes.data.requiredPercent);
        setPolicyDraft(eligibilityRes.data.requiredPercent);
      })
      .finally(() => setLoading(false));
  }, [selectedClass]);

  const savePolicy = async () => {
    setPolicySaving(true);
    try {
      await classesApi.updateAttendancePolicy(selectedClass, Number(policyDraft));
      const { data } = await attendanceApi.eligibility(selectedClass);
      const eligMap = {};
      data.roster.forEach((row) => {
        eligMap[row.student._id] = row;
      });
      setEligibilityByStudent(eligMap);
      setRequiredPercent(data.requiredPercent);
    } finally {
      setPolicySaving(false);
    }
  };

  const toggleExpand = async (studentId) => {
    if (expanded === studentId) {
      setExpanded(null);
      return;
    }
    setExpanded(studentId);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await resultsApi.forStudent(studentId);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Classes"
        description="Fees, results and roster for every class you're assigned to - as class teacher or subject teacher"
      />

      {classes.length === 0 ? (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          You're not assigned to any class yet — ask an admin to make you class teacher of a class, or assign you a subject in one.
        </p>
      ) : (
        <>
          <div className="card mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="label">Class</label>
              <select className="input min-w-[200px]" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            {students.length > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-navy-400">
                <Users size={15} /> {students.length} students
              </div>
            )}
          </div>

          {selectedClass && (
            <div className="card mb-4 flex flex-wrap items-end gap-3">
              <Settings2 size={16} className="mb-2.5 text-navy-400" />
              <div>
                <label className="label">Exam attendance requirement</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="input w-24"
                    value={policyDraft}
                    onChange={(e) => setPolicyDraft(e.target.value)}
                  />
                  <span className="text-sm text-navy-500">%</span>
                  <button onClick={savePolicy} disabled={policySaving || Number(policyDraft) === requiredPercent} className="btn-secondary">
                    {policySaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
              <p className="max-w-xs text-xs text-navy-400">
                Students below this attendance % are flagged as not exam-eligible. You can set this for your own class - admin can too.
              </p>
            </div>
          )}

          {loading && <p className="text-sm text-navy-400">Loading class details...</p>}

          {!loading && selectedClass && students.length > 0 && (
            <div className="card !p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-100 text-left text-xs font-semibold uppercase tracking-wide text-navy-400">
                    <th className="px-5 py-3">Roll No.</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Fees</th>
                    <th className="px-5 py-3">Attendance</th>
                    <th className="px-5 py-3">CGPA</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const feeSummary = summarizeFees(feesByStudent[s._id] || []);
                    const result = resultsByStudent[s._id];
                    const isOpen = expanded === s._id;
                    return (
                      <Fragment key={s._id}>
                        <tr key={s._id} className="border-b border-navy-50 last:border-0">
                          <td className="px-5 py-3 text-navy-500">{s.rollNumber || "-"}</td>
                          <td className="px-5 py-3 font-medium text-navy-900">{s.firstName} {s.lastName}</td>
                          <td className="px-5 py-3">
                            {feeSummary.status ? (
                              <div className="flex items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${FEE_STATUS_TONE[feeSummary.status]}`}>
                                  {feeSummary.status}
                                </span>
                                <span className="flex items-center text-xs text-navy-400">
                                  <IndianRupee size={11} />{feeSummary.paid} / {feeSummary.total}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-navy-300">No fee records</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {eligibilityByStudent[s._id] ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                                eligibilityByStudent[s._id].eligible ? "text-teal-600" : "text-red-500"
                              }`}>
                                {eligibilityByStudent[s._id].eligible ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                                {eligibilityByStudent[s._id].percentage}%
                              </span>
                            ) : (
                              <span className="text-xs text-navy-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            {result ? (
                              <span className="flex items-center gap-1 font-semibold text-navy-800">
                                <Award size={13} className="text-violet-500" /> {result.cgpa || "—"}
                              </span>
                            ) : (
                              <span className="text-xs text-navy-300">No results</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => toggleExpand(s._id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-navy-700"
                            >
                              {isOpen ? "Hide" : "Details"} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={`${s._id}-detail`} className="border-b border-navy-50 bg-navy-50/40">
                            <td colSpan={6} className="px-5 py-4">
                              {detailLoading && <p className="text-xs text-navy-400">Loading...</p>}
                              {!detailLoading && detail && (
                                <div className="grid gap-6 sm:grid-cols-2">
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Fee breakdown</p>
                                    {(feesByStudent[s._id] || []).length === 0 && <p className="text-xs text-navy-300">No fee records yet.</p>}
                                    <div className="space-y-1.5">
                                      {(feesByStudent[s._id] || []).map((f) => (
                                        <div key={f._id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs">
                                          <span className="text-navy-600">{f.feeType}</span>
                                          <span className="flex items-center gap-2">
                                            <span className="text-navy-400">₹{f.amountPaid} / ₹{f.amount + (f.fine || 0)}</span>
                                            <span className={`rounded-full px-2 py-0.5 font-semibold capitalize ${FEE_STATUS_TONE[f.status]}`}>{f.status}</span>
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">Results by semester</p>
                                    {detail.semesters.length === 0 && <p className="text-xs text-navy-300">No results recorded yet.</p>}
                                    <div className="space-y-2">
                                      {detail.semesters.map((sem) => (
                                        <div key={sem.semester} className="rounded-lg bg-white px-3 py-2 text-xs">
                                          <div className="mb-1 flex items-center justify-between font-semibold text-navy-700">
                                            <span>Semester {sem.semester}</span>
                                            <span>SGPA {sem.sgpa}</span>
                                          </div>
                                          {sem.subjects.map((sub) => (
                                            <div key={sub.subject?._id || sub.subject} className="flex items-center justify-between py-0.5 text-navy-500">
                                              <span>{sub.subject?.name || "Subject"}</span>
                                              <span>{sub.total}/{sub.maxTotal} · {sub.grade}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && selectedClass && students.length === 0 && (
            <p className="mt-4 text-center text-sm text-navy-400">No students in this class yet.</p>
          )}

          {!selectedClass && (
            <p className="mt-4 text-center text-sm text-navy-400">Select a class to see the full roster, fee status and results.</p>
          )}
        </>
      )}
    </div>
  );
}
