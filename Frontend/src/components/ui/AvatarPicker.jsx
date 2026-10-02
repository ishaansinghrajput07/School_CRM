import { useRef, useState } from "react";
import { X, Upload, Check } from "lucide-react";
import toast from "react-hot-toast";
import { AVATAR_PRESETS } from "../../utils/avatars";
import Avatar from "./Avatar";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2MB - keeps the base64 payload well under the API's JSON body limit

export default function AvatarPicker({ open, currentAvatar, name, onClose, onSave }) {
  const [selected, setSelected] = useState(currentAvatar || "");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  if (!open) return null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image is too large - please pick one under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSelected(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg font-bold text-navy-900">Choose your avatar</h3>
            <p className="text-sm text-navy-400">Pick a cartoon avatar or upload your own photo</p>
          </div>
          <button onClick={onClose} className="text-navy-400 hover:text-navy-700">
            <X size={20} />
          </button>
        </div>

        <div className="mb-5 flex justify-center">
          <Avatar src={selected} name={name} size="lg" />
        </div>

        <p className="label">Cartoon avatars</p>
        <div className="mb-5 grid grid-cols-3 gap-3">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a.url)}
              className={`relative rounded-xl border-2 p-1.5 transition-colors ${
                selected === a.url ? "border-teal-500 bg-teal-50" : "border-transparent hover:border-navy-100"
              }`}
              title={a.label}
            >
              <img src={a.url} alt={a.label} className="aspect-square w-full rounded-lg object-cover" />
              {selected === a.url && (
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="label">Or upload a photo</p>
        <button onClick={() => fileRef.current?.click()} className="btn-secondary mb-5 w-full">
          <Upload size={16} /> Upload from device
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving || !selected} className="btn-primary flex-1">
            {saving ? "Saving..." : "Save avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}
