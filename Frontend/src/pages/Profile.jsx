import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, IdCard as IdCardIcon, Award, Save, KeyRound, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { authApi, studentsApi } from "../api/endpoints";
import PageHeader from "../components/ui/PageHeader";
import Avatar from "../components/ui/Avatar";
import AvatarPicker from "../components/ui/AvatarPicker";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  const [phone, setPhone] = useState(user?.phone || "");
  const [savingBasic, setSavingBasic] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [student, setStudent] = useState(null);
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [savingStudent, setSavingStudent] = useState(false);

  useEffect(() => {
    if (user?.role !== "student") return;
    studentsApi.me().then(({ data }) => {
      setStudent(data.student);
      setFatherName(data.student.parent?.fatherName || "");
      setMotherName(data.student.parent?.motherName || "");
      setAddress(data.student.address || "");
      setEmergencyName(data.student.emergencyContact?.name || "");
      setEmergencyRelation(data.student.emergencyContact?.relation || "");
      setEmergencyPhone(data.student.emergencyContact?.phone || "");
    });
  }, [user]);

  const saveAvatar = async (avatar) => {
    const { data } = await authApi.updateMe({ avatar });
    updateUser({ avatar: data.user.avatar });
    toast.success("Avatar updated");
  };

  const saveBasic = async () => {
    setSavingBasic(true);
    try {
      const { data } = await authApi.updateMe({ phone });
      updateUser({ phone: data.user.phone });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSavingBasic(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation don't match");
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const saveStudentInfo = async () => {
    setSavingStudent(true);
    try {
      const { data } = await studentsApi.updateMe({
        address,
        parent: { fatherName, motherName },
        emergencyContact: { name: emergencyName, relation: emergencyRelation, phone: emergencyPhone },
      });
      setStudent(data.student);
      setFatherName(data.student.parent?.fatherName || "");
      setMotherName(data.student.parent?.motherName || "");
      toast.success("Details updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update details");
    } finally {
      setSavingStudent(false);
    }
  };

  return (
    <div>
      <PageHeader title="My Profile" description="Your account details and how you appear across the portal" />

      {/* Avatar + identity card, deliberately anchored top-right of the page content */}
      <div className="mb-6 flex flex-col-reverse items-start gap-6 sm:flex-row sm:justify-between">
        <div className="flex-1 space-y-4">
          <div className="card">
            <p className="mb-3 font-display text-sm font-bold text-navy-900">Account details</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" value={user?.name || ""} disabled />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={user?.email || ""} disabled />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input capitalize" value={user?.role || ""} disabled />
              </div>
            </div>
            <button onClick={saveBasic} disabled={savingBasic} className="btn-primary mt-4">
              <Save size={16} /> {savingBasic ? "Saving..." : "Save changes"}
            </button>
          </div>

          <div className="card">
            <p className="mb-1 font-display text-sm font-bold text-navy-900">Change password</p>
            <p className="mb-4 text-xs text-navy-400">Choose a strong password you don't use elsewhere. Forgot your current one? Log out and use "Forgot password" on the login screen instead.</p>
            <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Current password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  className="input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="label">New password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  minLength={6}
                  className="input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  minLength={6}
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="sm:col-span-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowPasswords((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-400 hover:text-navy-600"
                >
                  {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />} {showPasswords ? "Hide" : "Show"} passwords
                </button>
                <button type="submit" disabled={savingPassword} className="btn-primary disabled:opacity-50">
                  <KeyRound size={16} /> {savingPassword ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </div>

          {user?.role === "student" && student && (
            <div className="card">
              <p className="mb-3 font-display text-sm font-bold text-navy-900">Family & emergency contact</p>
              <p className="mb-4 text-xs text-navy-400">
                Father's and mother's names shown on your ID card. Please make sure they're spelled exactly as on official documents.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Father's name</label>
                  <input className="input" value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Father's name" />
                </div>
                <div>
                  <label className="label">Mother's name</label>
                  <input className="input" value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Mother's name" />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Home address</label>
                  <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <label className="label">Emergency contact name</label>
                  <input className="input" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Relation</label>
                  <input className="input" value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
                </div>
                <div>
                  <label className="label">Emergency phone</label>
                  <input className="input" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </div>
              </div>
              <button onClick={saveStudentInfo} disabled={savingStudent} className="btn-primary mt-4">
                <Save size={16} /> {savingStudent ? "Saving..." : "Save details"}
              </button>

              <div className="mt-5 flex flex-wrap gap-3 border-t border-navy-100 pt-4">
                <button onClick={() => navigate("/student/id-card")} className="btn-secondary">
                  <IdCardIcon size={16} /> View my ID card
                </button>
                <button onClick={() => navigate("/student/results")} className="btn-secondary">
                  <Award size={16} /> View my results
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top-right avatar panel */}
        <div className="card flex w-full flex-col items-center gap-3 sm:w-56">
          <div className="relative">
            <Avatar src={user?.avatar} name={user?.name} size="lg" />
            <button
              onClick={() => setPickerOpen(true)}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-navy-500 text-white shadow-card hover:bg-navy-600"
              aria-label="Change avatar"
            >
              <Camera size={14} />
            </button>
          </div>
          <p className="text-center font-display font-bold text-navy-900">{user?.name}</p>
          <p className="text-center text-xs capitalize text-navy-400">{user?.designation || user?.role}</p>
          <button onClick={() => setPickerOpen(true)} className="btn-secondary w-full text-xs">
            Change avatar
          </button>
        </div>
      </div>

      <AvatarPicker
        open={pickerOpen}
        currentAvatar={user?.avatar}
        name={user?.name}
        onClose={() => setPickerOpen(false)}
        onSave={saveAvatar}
      />
    </div>
  );
}
