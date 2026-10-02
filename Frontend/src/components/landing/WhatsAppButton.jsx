// Update this to the school's actual WhatsApp number, in international
// format with no "+", spaces, or leading zeros - e.g. India: 91XXXXXXXXXX.
const WHATSAPP_NUMBER = "919876543210";
const DEFAULT_MESSAGE = "Hi! I'd like to know more about admissions at St. Thomas Convent.";

export default function WhatsAppButton() {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="btn-glow fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40" aria-hidden />
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" className="relative" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.03.28-3.42-.72-2.9-1.2-4.75-4.14-4.9-4.33-.14-.2-1.17-1.56-1.17-2.97 0-1.41.74-2.1 1-2.39.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.2-.15.32-.3.5-.14.17-.31.38-.44.51-.15.14-.3.3-.13.6.17.3.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.37 1.46.3.14.48.12.65-.07.18-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05 .98.3.15.5.22.57.35.08.13.08.75-.16 1.43Z" />
      </svg>
    </a>
  );
}