import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { login, signup, forgotPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (mode !== "forgot" && !password) {
      setError("Please enter your password.");
      return;
    }

    if (mode === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!", {
          description: "Logged in successfully.",
          duration: 3000,
        });
        onOpenChange(false);
        resetForm();
      } else if (mode === "signup") {
        await signup(email, password, name);
        toast.success("Account created successfully!", {
          description: "Welcome to VURLO.",
          duration: 3000,
        });
        onOpenChange(false);
        resetForm();
      } else if (mode === "forgot") {
        await forgotPassword(email);
        toast.success("Reset email sent!", {
          description: "Please check your inbox.",
          duration: 3000,
        });
        setSuccess("Password reset email sent! Check your inbox.");
        setEmail("");
      }
    } catch (err: unknown) {
      console.error("[AuthModal Submit Error]:", err);
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("Email already in use.");
      } else if (error.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (error.code === "auth/user-not-found") {
        setError("No user found with this email address.");
      } else if (error.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else if (error.code === "auth/unauthorized-domain") {
        setError(
          "This domain is not authorized in the Firebase Console (check authorized domains).",
        );
      } else if (error.code === "auth/operation-not-allowed") {
        setError("Email/Password or password resets are not enabled in the Firebase Console.");
      } else {
        setError(error.message || "An authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setMode("login");
  };

  const getHeaderDetails = () => {
    switch (mode) {
      case "signup":
        return {
          tag: "Create Account",
          title: "Join VURLO",
          description: "Register below to unlock premium essentials",
        };
      case "forgot":
        return {
          tag: "Password Recovery",
          title: "Reset Password",
          description: "Enter your email to receive a password reset link",
        };
      case "login":
      default:
        return {
          tag: "Welcome Back",
          title: "Login to VURLO",
          description: "Enter your details to access your account",
        };
    }
  };

  const { tag, title, description } = getHeaderDetails();

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[420px] bg-black/95 border border-white/[0.08] text-white rounded-2xl shadow-[0_0_50px_rgba(138,46,255,0.15)] backdrop-blur-2xl">
        <DialogHeader className="space-y-3 items-center text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/60">
              {tag}
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white/90">
            {title}
          </DialogTitle>
          <DialogDescription className="text-white/50 text-sm">{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4.5 mt-2">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-3.5">
            {mode === "signup" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-lg placeholder:text-white/20 h-10 px-3.5"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-lg placeholder:text-white/20 h-10 px-3.5"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                    Password
                  </label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError("");
                      }}
                      className="text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-lg placeholder:text-white/20 h-10 px-3.5"
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="bg-white/[0.03] border-white/[0.08] focus:border-violet-500/50 text-white rounded-lg placeholder:text-white/20 h-10 px-3.5"
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-semibold h-11 mt-6 rounded-lg text-white transition-all duration-300 relative overflow-hidden cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
              boxShadow: "0 4px 20px rgba(124, 58, 237, 0.35)",
            }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mx-auto text-white" />
            ) : (
              <span>
                {mode === "login" ? "Login" : mode === "signup" ? "Sign Up" : "Send Reset Link"}
              </span>
            )}
          </Button>

          <div className="text-center pt-2">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
                disabled={loading}
                className="text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              >
                Back to Login
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "signup" : "login");
                  setError("");
                }}
                disabled={loading}
                className="text-xs text-white/40 hover:text-white/80 transition-colors cursor-pointer"
              >
                {mode === "login"
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Login"}
              </button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
