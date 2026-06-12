import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { loadAnalytics } from "@/lib/load-analytics";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    loadAnalytics();
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[9999] cookie-banner-animate">
      <div className="bg-white/[0.03] bg-gradient-to-b from-[#0f0f18]/95 to-[#090910]/95 border border-white/[0.06] backdrop-blur-md rounded-2xl p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <p className="text-xs text-white/70 leading-relaxed mb-4">
          We use cookies to improve your experience and understand site usage. By clicking Accept, you agree to our use of analytics cookies. See our{" "}
          <Link
            to="/privacy-policy"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleReject}
            className="px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(124,58,237,0.2)] cursor-pointer"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
