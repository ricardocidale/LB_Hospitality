import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";

function NotFoundContent() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="flex mb-4 gap-2">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <Link href="/">
          <Button className="mt-6" data-testid="button-go-home">
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function NotFound() {
  const { user } = useAuth();

  if (user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <NotFoundContent />
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <NotFoundContent />
    </div>
  );
}
