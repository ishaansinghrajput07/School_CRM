import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import { DashboardSkeleton } from "./components/ui/Skeleton";
// Landing is the first thing most visitors see - keep it in the main bundle
// for the fastest possible first paint. Everything else loads on demand,
// naturally splitting into one chunk per role (admin/student/teacher/parent)
// since nobody visits more than one role's routes in a session.
import Landing from "./pages/Landing";
const Profile = lazy(() => import("./pages/Profile"));

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Apply = lazy(() => import("./pages/Apply"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const Students = lazy(() => import("./pages/admin/Students"));
const AdminAttendance = lazy(() => import("./pages/admin/Attendance"));
const Fees = lazy(() => import("./pages/admin/Fees"));
const Invoices = lazy(() => import("./pages/admin/Invoices"));
const Salaries = lazy(() => import("./pages/admin/Salaries"));
const Accounting = lazy(() => import("./pages/admin/Accounting"));
const AdminTickets = lazy(() => import("./pages/admin/Tickets"));
const Tracking = lazy(() => import("./pages/admin/Tracking"));
const Notices = lazy(() => import("./pages/admin/Notices"));
const IdCard = lazy(() => import("./pages/admin/IdCard"));
const Subjects = lazy(() => import("./pages/admin/Subjects"));
const Academics = lazy(() => import("./pages/admin/Academics"));
const AdminCalendar = lazy(() => import("./pages/admin/Calendar"));
const AdminExams = lazy(() => import("./pages/admin/Exams"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminGallery = lazy(() => import("./pages/admin/Gallery"));
const AdminSyllabus = lazy(() => import("./pages/admin/Syllabus"));
const AdminToppers = lazy(() => import("./pages/admin/Toppers"));
const AdminFeedback = lazy(() => import("./pages/admin/Feedback"));
const AdminContactInquiries = lazy(() => import("./pages/admin/ContactInquiries"));
const AdminEvents = lazy(() => import("./pages/admin/Events"));
const AdminAdmissions = lazy(() => import("./pages/admin/Admissions"));

const StudentDashboard = lazy(() => import("./pages/student/Dashboard"));
const StudentAttendance = lazy(() => import("./pages/student/Attendance"));
const StudentFees = lazy(() => import("./pages/student/Fees"));
const StudentTickets = lazy(() => import("./pages/student/Tickets"));
const StudentTracking = lazy(() => import("./pages/student/Tracking"));
const StudentNotices = lazy(() => import("./pages/student/Notices"));
const StudentEvents = lazy(() => import("./pages/student/Events"));
const StudentIdCard = lazy(() => import("./pages/student/IdCard"));
const StudentAssignments = lazy(() => import("./pages/student/Assignments"));
const StudentProjects = lazy(() => import("./pages/student/Projects"));
const StudentResults = lazy(() => import("./pages/student/Results"));
const StudentCalendar = lazy(() => import("./pages/student/Calendar"));
const StudentExams = lazy(() => import("./pages/student/Exams"));

const TeacherDashboard = lazy(() => import("./pages/teacher/Dashboard"));
const TeacherMyClasses = lazy(() => import("./pages/teacher/MyClasses"));
const TeacherSalary = lazy(() => import("./pages/teacher/salary"));
const TeacherTickets = lazy(() => import("./pages/teacher/Tickets"));
const TeacherAssignments = lazy(() => import("./pages/teacher/Assignments"));
const TeacherProjects = lazy(() => import("./pages/teacher/Projects"));
const TeacherMarks = lazy(() => import("./pages/teacher/Marks"));
const TeacherAttendance = lazy(() => import("./pages/teacher/Attendance"));
const TeacherCalendar = lazy(() => import("./pages/teacher/Calendar"));
const TeacherNotices = lazy(() => import("./pages/teacher/Notices"));
const TeacherEvents = lazy(() => import("./pages/teacher/Events"));
const TeacherExams = lazy(() => import("./pages/teacher/Exams"));

const ParentDashboard = lazy(() => import("./pages/parent/Dashboard"));
const ParentEvents = lazy(() => import("./pages/parent/Events"));

function PageLoader() {
  return (
    <div className="p-6">
      <DashboardSkeleton />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              className: "!rounded-xl !border !border-[#E7E2D8] !bg-white !text-[#1A1D18] !shadow-lg",
              style: {
                fontSize: "14px",
                fontWeight: 600,
                padding: "12px 14px",
              },
            }}
          />
          <Suspense fallback={<PageLoader />}>
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AppLayout title="Admin" />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:id/id-card" element={<IdCard />} />
              <Route path="attendance" element={<AdminAttendance />} />
              <Route path="fees" element={<Fees />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="salaries" element={<Salaries />} />
              <Route path="accounting" element={<Accounting />} />
              <Route path="tickets" element={<AdminTickets />} />
              <Route path="tracking" element={<Tracking />} />
              <Route path="notices" element={<Notices />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="academics" element={<Academics />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="exams" element={<AdminExams />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="gallery" element={<AdminGallery />} />
              <Route path="syllabus" element={<AdminSyllabus />} />
              <Route path="toppers" element={<AdminToppers />} />
              <Route path="feedback" element={<AdminFeedback />} />
              <Route path="contact-messages" element={<AdminContactInquiries />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="admissions" element={<AdminAdmissions />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/student"
              element={
                <ProtectedRoute role="student">
                  <AppLayout title="Student Portal" />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="projects" element={<StudentProjects />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="calendar" element={<StudentCalendar />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="fees" element={<StudentFees />} />
              <Route path="tickets" element={<StudentTickets />} />
              <Route path="tracking" element={<StudentTracking />} />
              <Route path="notices" element={<StudentNotices />} />
              <Route path="events" element={<StudentEvents />} />
              <Route path="exams" element={<StudentExams />} />
              <Route path="id-card" element={<StudentIdCard />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/teacher"
              element={
                <ProtectedRoute role="teacher">
                  <AppLayout title="Teacher Portal" />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="my-classes" element={<TeacherMyClasses />} />
              <Route path="salary" element={<TeacherSalary />} />
              <Route path="tickets" element={<TeacherTickets />} />
              <Route path="tickets/:id" element={<TeacherTickets />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route path="projects" element={<TeacherProjects />} />
              <Route path="marks" element={<TeacherMarks />} />
              <Route path="attendance" element={<TeacherAttendance />} />
              <Route path="calendar" element={<TeacherCalendar />} />
              <Route path="exams" element={<TeacherExams />} />
              <Route path="notices" element={<TeacherNotices />} />
              <Route path="events" element={<TeacherEvents />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route
              path="/parent"
              element={
                <ProtectedRoute role="parent">
                  <AppLayout title="Parent Portal" />
                </ProtectedRoute>
              }
            >
              <Route index element={<ParentDashboard />} />
              <Route path="events" element={<ParentEvents />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}