import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { Loader2, ArrowLeft, User as UserIcon, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
});

function ContactPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between overflow-x-hidden page-transition">
      <div>
        <Navbar />
        <ContactContent />
      </div>
      <Footer />
    </main>
  );
}

function ContactContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in all the required fields.");
      return;
    }

    setSending(true);
    // Mock API call to simulate sending message
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Message sent successfully!", {
        description: "Thank you for reaching out. We will get back to you shortly.",
        duration: 3500,
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-2xl px-6 py-16 sm:py-24">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex justify-center items-center">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.02] blur-[100px]" />
      </div>

      <div className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors duration-200 group mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          Back to Collection
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white/90 sm:text-4xl">
          Contact Us
        </h1>
        <p className="text-sm text-white/45">We are here to assist. Drop us a line below.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f0f18] to-[#090910] shadow-[0_4px_30px_rgba(0,0,0,0.4)] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <UserIcon className="h-3 w-3 text-violet-400" />
                Your Name
              </label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={sending}
                className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-11 px-4 text-sm"
              />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-violet-400" />
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sending}
                className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 h-11 px-4 text-sm"
              />
            </div>

            {/* Message Textarea */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-violet-400" />
                Message
              </label>
              <Textarea
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                rows={5}
                className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-xl placeholder:text-white/20 px-4 py-3 text-sm resize-none"
              />
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider h-11 px-8 rounded-xl text-white transition-all duration-300 relative overflow-hidden cursor-pointer shadow-[0_4px_20px_rgba(124,58,237,0.25)] flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
              }}
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  Sending Message
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
