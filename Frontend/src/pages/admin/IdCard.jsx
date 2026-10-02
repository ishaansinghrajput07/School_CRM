import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { studentsApi } from "../../api/endpoints";
import PageHeader from "../../components/ui/PageHeader";
import IdCardVisual from "../../components/ui/IdCardVisual";
import IdCardCompact from "../../components/ui/IdCardCompact";

export default function IdCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("card"); // "card" (short) | "profile" (full)

  useEffect(() => {
    studentsApi
      .idCard(id)
      .then(({ data }) => setStudent(data.student))
      .catch((err) => setError(err.response?.data?.message || "Could not load ID card"));
  }, [id]);

  return (
    <div>
      <PageHeader
        title="Student Profile"
        description="ID card and full academic record for this student"
        action={
          <div className="flex items-center gap-2 print:hidden">
            <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} /> Back</button>
            {student && (
              <>
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
              </>
            )}
          </div>
        }
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {student && view === "card" && <IdCardCompact student={student} />}
      {student && view === "profile" && <IdCardVisual student={student} />}
    </div>
  );
}
