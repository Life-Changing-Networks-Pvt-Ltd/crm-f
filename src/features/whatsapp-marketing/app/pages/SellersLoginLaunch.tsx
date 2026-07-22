// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@whatsapp/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@whatsapp/components/ui/card";

const AUTH_STORAGE_KEY = "whatsapp_auth_user";

function getTokenFromQuery(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token")?.trim() || "";
}

export default function SellersLoginLaunch() {
  const token = useMemo(() => getTokenFromQuery(), []);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const launch = async () => {
      if (!token) {
        setError("Launch token is missing. Open WhatsApp Marketing from the seller dashboard.");
        return;
      }

      try {
        const res = await fetch("/api/auth/sellerslaunch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok || !data?.success || !data?.user) {
          throw new Error(
            data?.error || data?.message || "Failed to launch WhatsApp marketing dashboard"
          );
        }

        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data.user));
        window.location.replace("/whatsapp-marketing");
      } catch (launchError: any) {
        if (!active) return;
        setError(
          launchError?.message ||
            "Failed to launch WhatsApp marketing dashboard"
        );
      }
    };

    launch();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <Card className="w-full max-w-lg border-0 shadow-xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <MessageSquare className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Launching WhatsApp Marketing
            </CardTitle>
            <CardDescription className="mt-1 text-slate-500">
              Signing you in with your seller account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
              <div className="flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/login">Go to Login</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-600">
                Preparing your vendor workspace and redirecting to the dashboard.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
