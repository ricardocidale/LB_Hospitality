import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, TrendingUp, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-[#9FBCA4] blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-[#9FBCA4] blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-[#9FBCA4] blur-2xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          <div className="flex items-center gap-4 mb-12">
            <img src={logo} alt="L+B Hospitality" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
                L+B <span style={{ color: '#9FBCA4' }}>Hospitality</span>
              </h1>
              <p className="text-[#9FBCA4]/80 text-sm uppercase tracking-widest">Investor Analytics</p>
            </div>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-serif text-white mb-6 leading-tight">
            Boutique Hotel <br />
            <span className="text-[#9FBCA4]">Investment Intelligence</span>
          </h2>
          
          <p className="text-white/70 text-lg mb-12 max-w-md">
            Access comprehensive financial modeling, portfolio analytics, and investment insights for L+B Hospitality properties.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#9FBCA4]/20 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-white font-medium">Portfolio Overview</p>
                <p className="text-white/60 text-sm">Track all properties in one place</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#9FBCA4]/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-white font-medium">10-Year Pro Forma</p>
                <p className="text-white/60 text-sm">GAAP-compliant financial projections</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#9FBCA4]/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#9FBCA4]" />
              </div>
              <div>
                <p className="text-white font-medium">Secure Access</p>
                <p className="text-white/60 text-sm">Bank-level security for your data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#FFF9F5] p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img src={logo} alt="L+B Hospitality" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Nunito', sans-serif" }}>
                L+B <span style={{ color: '#9FBCA4' }}>Hospitality</span>
              </h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Analytics</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-serif text-[#257D41] mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your investor portal</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email or Username</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="h-12 bg-white border-gray-200 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="h-12 bg-white border-gray-200 focus:border-[#9FBCA4] focus:ring-[#9FBCA4]"
                data-testid="input-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#257D41] hover:bg-[#1a5f30] text-white font-medium text-base transition-all duration-200 shadow-lg shadow-[#257D41]/20" 
              disabled={isLoading} 
              data-testid="button-login"
            >
              {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
          </form>
          
          <p className="text-center text-xs text-muted-foreground mt-8">
            Contact your administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
}
