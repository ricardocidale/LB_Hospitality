;
import { CardContent, IconEye, IconEyeOff, IconLoader } from "@/components/icons/brand-icons";
import { useToast } from "@/hooks/use-toast";
import bgImage from "@/assets/hotel-party.jpg";
import SpinningLogo3D from "@/components/SpinningLogo3D";

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
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-3xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <CardContent className="grid p-0 md:grid-cols-2">
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 drop-shadow-[0_0_12px_rgba(159,188,164,0.4)]">
                      <SpinningLogo3D size={72} onClick={handleAdminLogin} />
                    </div>
                    <h1 className="text-2xl font-bold font-display" data-testid="text-welcome">Welcome back</h1>
                    <p className="text-balance text-muted-foreground">
                      Sign in to access the simulation portal
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email or Username</Label>
                    <Input
                      id="email"
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      data-testid="input-email"
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="pr-10"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                    data-testid="button-login"
                  >
                    {isLoading ? <IconLoader className="w-4 h-4 animate-spin mr-2" /> : null}
                    Login
                  </Button>
                  <div className="text-center text-sm text-muted-foreground">
                    Contact your administrator if you need access
                  </div>
                </div>
              </form>
              <div className="relative hidden bg-muted md:block">
                <img
                  src={bgImage}
                  alt="Boutique hotel event space"
                  className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 font-medium">
              Powered by
            </span>
            <img
              src="/logos/norfolk-ai-blue.png"
              alt="Norfolk AI"
              className="w-5 h-5 opacity-60"
            />
            <span className="text-xs font-semibold tracking-wide text-muted-foreground/60">
              Norfolk AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
