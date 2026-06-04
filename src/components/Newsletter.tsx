import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      // Check if already subscribed
      const q = query(collection(db, "newsletter_subscribers"), where("email", "==", cleanEmail));
      const existing = await getDocs(q);
      if (!existing.empty) {
        toast.info("You're already subscribed!", {
          description: "We'll keep you posted on new drops and deals.",
        });
        setEmail("");
        return;
      }

      await addDoc(collection(db, "newsletter_subscribers"), {
        email: cleanEmail,
        subscribedAt: serverTimestamp(),
      });

      toast.success("You're on the list!", {
        description: "We'll notify you about new drops and exclusive deals.",
      });
      setEmail("");
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-12 md:p-16 text-center">
        <div className="absolute inset-0 bg-gradient-brand opacity-10 blur-3xl" />
        <div className="relative">
          <h2 className="font-display text-4xl md:text-5xl font-bold">Join the Setup Lab.</h2>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto">
            Get early access to new product releases, setup design inspiration, and exclusive
            community discounts.
          </p>
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              placeholder="e.g., you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              disabled={submitting}
              className="flex-1 rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors animate-none"
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-brand px-6 py-3 font-medium text-white glow-brand transition-transform hover:scale-[1.03] disabled:opacity-50"
            >
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
