import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { studentsApi } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import IdCardVisual from "../../components/ui/IdCardVisual";
import IdCardCompact from "../../components/ui/IdCardCompact";

export default function StudentIdCard() {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("card"); // "card" (short) | "profile" (full)

  useEffect(() => {
    if (!user?.student?._id) return;
    studentsApi
      .idCard(user.student._id)
      .then(({ data }) => setStudent(data.student))
      .catch((err) => setError(err.response?.data?.message || "Could not load your ID card"));
  }, [user]);

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your ID card and full academic record"
        action={
          student && (
            <div className="flex items-center gap-2 print:hidden">
              <div className="flex rounded-lg border border-navy-200 p-0.5">
                <button
                  onClick={() => setView("card")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === "card" ? "bg-navy-500 text-white" : "text-navy-500"}`}
                >
                  ID Card
                </button>
                <button
                  onClick={() => setView("profile")}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === "profile" ? "bg-navy-500 text-white" : "text-navy-500"}`}
                >
                  Full Profile
                </button>
              </div>
              <button onClick={() => window.print()} className="btn-primary"><Printer size={16} /> Print</button>
            </div>
          )
        }
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {student && view === "card" && <IdCardCompact student={student} />}
      {student && view === "profile" && <IdCardVisual student={student} />}
    </div>
  );
}
