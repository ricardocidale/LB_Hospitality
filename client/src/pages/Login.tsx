import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
import bgImage from "@/assets/hotel-party.jpg";
import logoImg from "@/assets/logo.png";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Admin login failed");
      }
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
        <img
          src={bgImage}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

        <div className="relative z-10 w-full max-w-[420px] mx-4">
          <div
            className="relative rounded-3xl p-8 sm:p-10"
            style={{
              background: "linear-gradient(135deg, rgba(220,235,245,0.12) 0%, rgba(200,225,240,0.08) 40%, rgba(180,210,230,0.06) 100%)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 8px 40px rgba(0,0,0,0.25), 0 0 80px rgba(159,188,164,0.08)",
            }}
            data-testid="ice-chip-card"
          >
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: "linear-gradient(170deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.03) 100%)",
              }}
            />
            <div
              className="absolute top-0 left-[10%] right-[10%] h-[1px] rounded-full pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              }}
            />

            <div className="relative flex flex-col items-center">
              <div className="cursor-pointer mb-1" onClick={handleAdminLogin}>
                <img
                  src={logoImg}
                  alt="Hospitality Business Group"
                  className="w-20 h-20 object-contain animate-[spin_12s_linear_infinite] drop-shadow-[0_0_20px_rgba(159,188,164,0.5)]"
                  data-testid="logo-login"
                />
              </div>
              <p className="text-[13px] text-white/60 tracking-wide text-center max-w-[280px] leading-relaxed mb-8">
                Business Simulation for Hospitality Businesses
              </p>

              <div className="w-full rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm p-6 sm:p-7">
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
                  <p className="text-sm text-white/50">Sign in to access the simulation portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white/80">Email or Username</Label>
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-primary/60 focus:ring-primary/30"
                      data-testid="input-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-white/80">Password</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/30 pr-10 focus:border-primary/60 focus:ring-primary/30"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-10"
                    data-testid="button-login"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Login
                  </Button>
                </form>

                <p className="text-center text-xs text-white/40 mt-6">
                  Contact your administrator if you need access
                </p>
              </div>

              <div className="mt-8 flex flex-col items-center gap-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/35 font-medium">
                  Powered by
                </p>
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logos/norfolk-ai-white.png"
                    alt="Norfolk AI"
                    className="w-7 h-7 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]"
                  />
                  <span className="text-xs font-semibold tracking-wide text-white/70">
                    Norfolk AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
