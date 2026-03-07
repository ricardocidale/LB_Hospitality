import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPage } from "@/components/graphics/motion/AnimatedPage";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-full max-w-sm mx-4">
        <div className="flex flex-col items-center mb-6">
          <div className="cursor-pointer" onClick={handleAdminLogin}>
            <img
              src={logoImg}
              alt="Hospitality Business Group"
              className="w-20 h-20 object-contain animate-[spin_12s_linear_infinite]"
              data-testid="logo-login"
            />
          </div>
          <p className="text-[13px] text-muted-foreground/70 tracking-wide text-center max-w-[280px] leading-relaxed mt-1">
            Business Simulation for Hospitality Businesses
          </p>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-6 sm:p-8 hover-glow">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in to access the simulation portal</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email or Username</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="m@example.com"
                required
                className="h-10 bg-card"
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-10 bg-card pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              data-testid="button-login"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Login
            </button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-6">
            Contact your administrator if you need access
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 opacity-70">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium">
          Powered by
        </p>
        <div className="flex items-center gap-2">
          <img
            src="/logos/norfolk-ai-wireframe.png"
            alt="Norfolk AI"
            className="w-5 h-5"
          />
          <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
            Norfolk AI
          </span>
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
}
