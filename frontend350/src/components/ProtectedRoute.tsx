"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useTheme } from "@/context/ThemeProvider";
import clsx from "clsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/Signin");
    }
  }, [isAuthenticated, loading, router]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div
        className={clsx(
          "min-h-screen flex items-center justify-center",
          theme === "dark" ? "bg-gray-900" : "bg-gray-100"
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <div
            className={clsx(
              "animate-spin rounded-full h-12 w-12 border-b-2",
              theme === "dark" ? "border-blue-400" : "border-blue-600"
            )}
          />
          <p
            className={clsx(
              "text-lg",
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            )}
          >
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
