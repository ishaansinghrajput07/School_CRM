import api from "./axios";

// Thin, explicit wrappers per resource - keeps components free of raw URL strings.
export const otpApi = {
  send: (mobile, purpose) => api.post("/otp/send", { mobile, purpose }),
  verify: (mobile, purpose, code) => api.post("/otp/verify", { mobile, purpose, code }),
};

export const authApi = {
  login: (data) => api.post("/auth/login", data),
  signup: (data) => api.post("/auth/signup", data),
  me: () => api.get("/auth/me"),
  updateMe: (data) => api.put("/auth/me", data),
  changePassword: (data) => api.put("/auth/change-password", data),
  forgotPassword: (data) => api.post("/auth/forgot-password", data),
  resetPassword: (token, data) => api.put(`/auth/reset-password/${token}`, data),
};

export const publicApi = {
  classes: () => api.get("/classes/public"),
};

export const dashboardApi = {
  admin: () => api.get("/dashboard/admin"),
  student: (studentId) => api.get(`/dashboard/student/${studentId}`),
};

export const studentsApi = {
  list: (params) => api.get("/students", { params }),
  get: (id) => api.get(`/students/${id}`),
  me: () => api.get("/students/me"),
  updateMe: (data) => api.put("/students/me", data),
  create: (data) => api.post("/students", data),
  update: (id, data) => api.put(`/students/${id}`, data),
  remove: (id) => api.delete(`/students/${id}`),
  idCard: (id) => api.get(`/students/${id}/id-card`),
  createParentAccount: (id, data) => api.post(`/students/${id}/parent-account`, data),
  promote: (id) => api.post(`/students/${id}/promote`),
};

export const staffApi = {
  list: () => api.get("/staff"),
  create: (data) => api.post("/staff", data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  teachers: () => api.get("/staff/teachers"),
  createTeacher: (data) => api.post("/staff/teachers", data),
};

export const classesApi = {
  list: () => api.get("/classes"),
  create: (data) => api.post("/classes", data),
  update: (id, data) => api.put(`/classes/${id}`, data),
  updateAttendancePolicy: (id, minAttendancePercent) => api.put(`/classes/${id}/attendance-policy`, { minAttendancePercent }),
  remove: (id) => api.delete(`/classes/${id}`),
  assignStudents: (id, data) => api.post(`/classes/${id}/assign-students`, data),
};

export const attendanceApi = {
  mark: (data) => api.post("/attendance/mark", data),
  list: (params) => api.get("/attendance", { params }),
  summary: (studentId) => api.get(`/attendance/summary/${studentId}`),
  myClasses: () => api.get("/attendance/my-classes"),
  eligibility: (classId) => api.get(`/attendance/eligibility/${classId}`),
};

export const feeStructuresApi = {
  public: (classId) => api.get("/fee-structures/public", { params: classId ? { class: classId } : {} }),
  list: (classId) => api.get("/fee-structures", { params: classId ? { class: classId } : {} }),
  create: (data) => api.post("/fee-structures", data),
  update: (id, data) => api.put(`/fee-structures/${id}`, data),
  remove: (id) => api.delete(`/fee-structures/${id}`),
};

export const syllabusApi = {
  public: (classId) => api.get("/syllabus/public", { params: classId ? { class: classId } : {} }),
  list: (classId) => api.get("/syllabus", { params: classId ? { class: classId } : {} }),
  save: (formData) => api.post("/syllabus", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/syllabus/${id}`),
};

export const galleryApi = {
  public: (category) => api.get("/gallery/public", { params: category ? { category } : {} }),
  list: (category) => api.get("/gallery", { params: category ? { category } : {} }),
  upload: (formData) => api.post("/gallery", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/gallery/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/gallery/${id}`),
};

export const toppersApi = {
  public: () => api.get("/toppers/public"),
  list: () => api.get("/toppers"),
  create: (formData) => api.post("/toppers", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/toppers/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/toppers/${id}`),
};

export const feesApi = {
  list: (params) => api.get("/fees", { params }),
  create: (data) => api.post("/fees", data),
  update: (id, data) => api.put(`/fees/${id}`, data),
  pay: (id, data) => api.post(`/fees/${id}/pay`, data),
  remove: (id) => api.delete(`/fees/${id}`),
};

export const invoicesApi = {
  list: (params) => api.get("/invoices", { params }),
  get: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post("/invoices", data),
  updateStatus: (id, status) => api.put(`/invoices/${id}/status`, { status }),
};

export const salariesApi = {
  list: (params) => api.get("/salaries", { params }),
  mine: () => api.get("/salaries/me"),
  create: (data) => api.post("/salaries", data),
  update: (id, data) => api.put(`/salaries/${id}`, data),
  markPaid: (id) => api.put(`/salaries/${id}/pay`),
};

export const accountingApi = {
  list: (params) => api.get("/accounting", { params }),
  create: (data) => api.post("/accounting", data),
  remove: (id) => api.delete(`/accounting/${id}`),
  summary: () => api.get("/accounting/summary/overview"),
};

export const ticketsApi = {
  list: (params) => api.get("/tickets", { params }),
  get: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post("/tickets", data),
  reply: (id, message) => api.post(`/tickets/${id}/reply`, { message }),
  updateStatus: (id, data) => api.put(`/tickets/${id}/status`, data),
  staffList: () => api.get("/tickets/staff/list"),
};

export const trackingApi = {
  list: (params) => api.get("/tracking", { params }),
  create: (data) => api.post("/tracking", data),
  updateStatus: (id, data) => api.put(`/tracking/${id}/status`, data),
};

export const examsApi = {
  list: (params) => api.get("/exams", { params }),
  create: (data) => api.post("/exams", data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  remove: (id) => api.delete(`/exams/${id}`),
};

export const settingsApi = {
  get: () => api.get("/settings"),
  update: (data) => api.put("/settings", data),
};

export const noticesApi = {
  public: () => api.get("/notices/public"),
  list: (params) => api.get("/notices", { params }),
  create: (data) => api.post("/notices", data),
  update: (id, data) => api.put(`/notices/${id}`, data),
  uploadImage: (id, formData) => api.put(`/notices/${id}/image`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/notices/${id}`),
};

export const subjectsApi = {
  list: (params) => api.get("/subjects", { params }),
  create: (data) => api.post("/subjects", data),
  update: (id, data) => api.put(`/subjects/${id}`, data),
  remove: (id) => api.delete(`/subjects/${id}`),
};

export const assignmentsApi = {
  list: () => api.get("/assignments"),
  get: (id) => api.get(`/assignments/${id}`),
  create: (formData) => api.post("/assignments", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/assignments/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  remove: (id) => api.delete(`/assignments/${id}`),
  submit: (id, formData) => api.post(`/assignments/${id}/submit`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  grade: (id, studentId, data) => api.put(`/assignments/${id}/grade/${studentId}`, data),
};

export const projectsApi = {
  list: () => api.get("/projects"),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  remove: (id) => api.delete(`/projects/${id}`),
  submit: (id, formData) => api.post(`/projects/${id}/submit`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  review: (id, studentId, data) => api.put(`/projects/${id}/review/${studentId}`, data),
};

export const marksApi = {
  roster: (subject, semester) => api.get("/marks", { params: { subject, semester } }),
  saveBulk: (data) => api.post("/marks/bulk", data),
  myRoster: (semester) => api.get("/marks/me", { params: { semester } }),
  saveMine: (data) => api.post("/marks/me", data),
};

export const externalResultsApi = {
  mine: () => api.get("/external-results/me"),
  forStudent: (studentId) => api.get(`/external-results/student/${studentId}`),
  create: (data) => api.post("/external-results", data),
  update: (id, data) => api.put(`/external-results/${id}`, data),
  remove: (id) => api.delete(`/external-results/${id}`),
};

export const resultsApi = {
  mine: () => api.get("/results/me"),
  forStudent: (studentId) => api.get(`/results/${studentId}`),
  forClass: (classId) => api.get(`/results/class/${classId}`),
};

export const parentApi = {
  children: () => api.get("/parent/children"),
  overview: (studentId) => api.get(`/parent/children/${studentId}/overview`),
};

export const calendarApi = {
  events: () => api.get("/calendar"),
};

export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

export const feedbackApi = {
  // Public - no login required
  submit: (data) => api.post("/feedback", data),
  publicList: () => api.get("/feedback/public"),
  // Admin moderation
  list: (params) => api.get("/feedback", { params }),
  update: (id, data) => api.patch(`/feedback/${id}`, data),
  remove: (id) => api.delete(`/feedback/${id}`),
};

export const eventsApi = {
  publicList: () => api.get("/events/public"),
  list: (params) => api.get("/events", { params }),
  register: (id) => api.post(`/events/${id}/register`),
  cancel: (id) => api.delete(`/events/${id}/register`),
  // Admin
  create: (data) => api.post("/events", data),
  update: (id, data) => api.put(`/events/${id}`, data),
  remove: (id) => api.delete(`/events/${id}`),
  registrants: (id) => api.get(`/events/${id}/registrants`),
};

export const admissionsApi = {
  // Public - no login required
  submit: (data) => api.post("/admissions", data),
  // Admin
  list: (params) => api.get("/admissions", { params }),
  update: (id, data) => api.patch(`/admissions/${id}`, data),
  remove: (id) => api.delete(`/admissions/${id}`),
};