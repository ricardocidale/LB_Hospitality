import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlassButton } from "@/components/ui/glass-button";
import logo from "@/assets/logo.png";
import hotelParty from "@/assets/hotel-party.jpg";

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
      const response = await fetch("/api/auth/admin-login", {
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
      {/* Boutique Hotel Party Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${hotelParty})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2,
        }}
      />
      
      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#1e90ff]/10 blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#4169e1]/8 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0a1a2e]/50 blur-[80px]" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e90ff]/22 via-[#4169e1]/16 to-[#0052cc]/20 backdrop-blur-2xl border border-[#87ceeb]/25 shadow-2xl shadow-[#003366]/50">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#5bb8f5]/18 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#3a9ad9]/12 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#2196f3]/10 blur-3xl" />
          </div>
          <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(135,206,235,0.18)] rounded-2xl" />
          
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#87ceeb]/35 to-transparent" />
          
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col items-center mb-8">
              <img 
                src={logo} 
                alt="L+B Hospitality" 
                className="w-16 h-16 object-contain mb-4 cursor-pointer opacity-90 hover:opacity-100 transition-opacity" 
                onClick={handleAdminLogin}
              />
              <h1 className="text-2xl font-display text-[#FFF9F5] mb-1">
                L+B <span className="text-[#9FBCA4]">Hospitality</span>
              </h1>
              <p className="text-xs text-white/40 uppercase tracking-[0.2em]">Business Simulation</p>
            </div>
            
            <div className="mb-8 text-center">
              <h2 className="text-xl font-display text-[#FFF9F5] mb-2">Welcome Back</h2>
              <p className="text-sm text-white/50 label-text">Sign in to access the simulation portal</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/70">Email or Username</Label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-12 bg-white/5 border-white/10 text-[#FFF9F5] placeholder:text-white/30 focus:border-[#87ceeb]/50 focus:ring-[#87ceeb]/20 transition-colors"
                  data-testid="input-email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/70">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="h-12 bg-white/5 border-white/10 text-[#FFF9F5] placeholder:text-white/30 focus:border-[#87ceeb]/50 focus:ring-[#87ceeb]/20 pr-12 transition-colors"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                data-testid="button-login"
                className="group relative w-full h-14 rounded-[2rem] overflow-hidden transition-all duration-500 ease-out hover:scale-[1.02] active:scale-[0.97] active:h-[3.2rem] disabled:opacity-60 disabled:pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#b8d4be] via-[#9FBCA4] to-[#6a9a78] rounded-[2rem]" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/15 rounded-[2rem]" />
                <div className="absolute inset-[1px] rounded-[calc(2rem-1px)] bg-gradient-to-b from-[#aacdb3] via-[#9FBCA4] to-[#7aaa8a]" />
                <div className="absolute top-[2px] left-[10%] right-[10%] h-[45%] rounded-[2rem] bg-gradient-to-b from-white/50 via-white/20 to-transparent" />
                <div className="absolute bottom-[3px] left-[15%] right-[15%] h-[20%] rounded-[2rem] bg-gradient-to-t from-white/10 to-transparent" />
                <div className="absolute inset-0 rounded-[2rem] shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(0,0,0,0.15),0_4px_20px_rgba(159,188,164,0.4),0_8px_32px_rgba(37,125,65,0.2)]" />
                <div className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_6px_30px_rgba(159,188,164,0.6),0_12px_40px_rgba(37,125,65,0.3)]" />
                <span className="relative flex items-center justify-center gap-2 text-white font-semibold text-base tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Sign In
                </span>
              </button>
            </form>
            
            <p className="text-center text-xs text-white/30 mt-8">
              Contact your administrator if you need access
            </p>
          </div>
        </div>
        
        <p className="text-center text-xs text-white/20 mt-6">
          Business simulation portal for L+B Hospitality Group
        </p>
      </div>
    </div>
  );
}
