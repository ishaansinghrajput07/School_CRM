import { useMemo, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

const QUOTES = [
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Your only limit is your mind.", author: "Unknown" },
  { text: "A little progress each day adds up to big results.", author: "Unknown" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
];

function dayIndex() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - start;
  return Math.floor(diff / 86400000);
}

export default function MotivationalQuote({ className = "" }) {
  const [seed, setSeed] = useState(dayIndex());
  const quote = useMemo(() => QUOTES[seed % QUOTES.length], [seed]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-teal-50 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-navy-500 to-violet-600 text-white shadow-sm">
          <Sparkles size={16} />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-medium italic text-navy-800">"{quote.text}"</p>
          <p className="mt-1 text-xs font-semibold text-navy-400">— {quote.author}</p>
        </div>
        <button
          onClick={() => setSeed((s) => s + 1 + Math.floor(Math.random() * QUOTES.length))}
          title="Another quote"
          className="shrink-0 rounded-full p-1.5 text-navy-300 transition-colors hover:bg-white hover:text-teal-600"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    </div>
  );
}
