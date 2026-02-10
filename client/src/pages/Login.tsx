import { useState, Suspense } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { GlassButton } from "@/components/ui/glass-button";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";
import hotelParty from "@/assets/hotel-party.jpg";
import { Login3DScene } from "@/components/Login3DScene";

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
        body: JSON.stringify({ password }),
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${hotelParty})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* 3D Scene Background */}
      <Login3DScene />
      
      {/* Ambient Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-[#38BDF8]/10 blur-[120px]" 
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-[#7DD3FC]/8 blur-[100px]" 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#0a1e2e]/50 blur-[80px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#E0F2FE]/22 via-[#BAE6FD]/18 to-[#7DD3FC]/15 backdrop-blur-2xl border border-[#38BDF8]/25 shadow-[0_0_40px_rgba(56,189,248,0.35),0_0_80px_rgba(56,189,248,0.18),0_8px_32px_rgba(0,0,0,0.3)]">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-[#38BDF8]/22 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#7DD3FC]/16 blur-2xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#38BDF8]/12 blur-3xl" />
          </div>
          <div className="absolute inset-0 shadow-[inset_0_1px_1px_rgba(56,189,248,0.18)] rounded-2xl" />
          
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent" />
          
          <div className="relative p-8 sm:p-10">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col items-center mb-8"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
                className="relative mb-4 cursor-pointer"
                onClick={handleAdminLogin}
              >
                <motion.div
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(159,188,164,0.2), 0 0 40px rgba(159,188,164,0.1)",
                      "0 0 30px rgba(159,188,164,0.4), 0 0 60px rgba(159,188,164,0.2)",
                      "0 0 20px rgba(159,188,164,0.2), 0 0 40px rgba(159,188,164,0.1)"
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-[-8px] rounded-full"
                />
                <motion.img
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  src={logo}
                  alt="Hospitality Business"
                  className="relative w-16 h-16 object-contain hover:opacity-100 transition-all"
                  style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.5)) drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
                />
              </motion.div>
              <h1 className="text-2xl font-display text-[#FFF9F5] mb-1">
                Hospitality <span className="text-[#9FBCA4]">Business</span>
              </h1>
              <p className="text-xs text-white/40 uppercase tracking-[0.2em]">Business Simulation</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
              className="mb-8 text-center"
            >
              <h2 className="text-xl font-display text-[#FFF9F5] mb-2">Welcome Back</h2>
              <p className="text-sm text-white/50 label-text">Sign in to access the simulation portal</p>
            </motion.div>
            
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.85 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/70">Email or Username</Label>
                <Input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="h-12 bg-white/5 border-white/10 text-[#FFF9F5] placeholder:text-white/30 focus:border-[#38BDF8]/50 focus:ring-[#38BDF8]/20 transition-colors"
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
                    className="h-12 bg-white/5 border-white/10 text-[#FFF9F5] placeholder:text-white/30 focus:border-[#38BDF8]/50 focus:ring-[#38BDF8]/20 pr-12 transition-colors"
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
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.0, type: "spring", stiffness: 200 }}
                className="flex justify-center mt-6"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  data-testid="button-login"
                  className="group relative w-28 h-28 rounded-full overflow-hidden transition-all duration-500 ease-out hover:scale-105 active:scale-95 disabled:opacity-60 disabled:pointer-events-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-[#b8d4be] via-[#9FBCA4] to-[#6a9a78] rounded-full" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/15 rounded-full" />
                  <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-[#aacdb3] via-[#9FBCA4] to-[#7aaa8a]" />
                  <div className="absolute top-[2px] left-[15%] right-[15%] h-[45%] rounded-full bg-gradient-to-b from-white/50 via-white/20 to-transparent" />
                  <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.35),inset_0_-2px_6px_rgba(0,0,0,0.15),0_4px_20px_rgba(159,188,164,0.4),0_8px_32px_rgba(37,125,65,0.2)]" />
                  <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_6px_30px_rgba(159,188,164,0.6),0_12px_40px_rgba(37,125,65,0.3)]" />
                  <span className="relative flex items-center justify-center gap-2 text-white font-semibold text-sm tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </span>
                </button>
              </motion.div>
            </motion.form>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.2 }}
              className="text-center text-xs text-white/30 mt-8"
            >
              Contact your administrator if you need access
            </motion.p>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.3 }}
          className="text-center mt-6 space-y-1"
        >
          <p className="text-xs text-white/20">Business simulation portal for Hospitality Business Group</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#9FBCA4] shadow-[0_0_6px_rgba(159,188,164,0.6)] animate-pulse" style={{ animationDuration: '3s' }} />
            <p className="text-[10px] tracking-wider text-white/25">
              powered by <span className="font-semibold text-white/40">Norfolk AI</span>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
