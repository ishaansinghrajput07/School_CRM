import toast from "react-hot-toast";

const baseOptions = {
  duration: 4000,
  style: {
    borderRadius: "14px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: "1.4",
    border: "1px solid rgba(79, 124, 90, 0.18)",
    boxShadow: "0 10px 30px rgba(22, 27, 24, 0.12)",
  },
};

export const notifySuccess = (message) => toast.success(message, baseOptions);
export const notifyError = (message) => toast.error(message, baseOptions);
export const notifyInfo = (message, options = {}) => toast(message, {
  ...baseOptions,
  ...options,
  icon: options.icon ?? "🔔",
});
export const notifyPromise = (promise, messages) => toast.promise(promise, messages, baseOptions);

export default toast;
