import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "handle-email-unsubscribe",
          { method: "GET", headers: { "x-unsubscribe-token": token } }
        );
        if (error) throw error;
        if (data?.alreadyUnsubscribed) setStatus("already");
        else if (data?.valid) setStatus("valid");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("loading");
    try {
      const { data, error } = await supabase.functions.invoke(
        "handle-email-unsubscribe",
        { body: { token } }
      );
      if (error) throw error;
      if (data?.success) setStatus("success");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        )}

        {status === "valid" && (
          <>
            <MailX className="h-16 w-16 text-primary mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribe</h1>
            <p className="text-muted-foreground">
              Are you sure you want to unsubscribe from PulseOS emails?
            </p>
            <Button onClick={handleConfirm} variant="destructive" size="lg">
              Confirm Unsubscribe
            </Button>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-emerald-500 dark:text-emerald-400 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Unsubscribed</h1>
            <p className="text-muted-foreground">
              You've been successfully unsubscribed from PulseOS emails.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Already Unsubscribed</h1>
            <p className="text-muted-foreground">
              You've already unsubscribed from these emails.
            </p>
          </>
        )}

        {(status === "invalid" || status === "error") && (
          <>
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">
              {status === "invalid" ? "Invalid Link" : "Something went wrong"}
            </h1>
            <p className="text-muted-foreground">
              {status === "invalid"
                ? "This unsubscribe link is invalid or has expired."
                : "We couldn't process your request. Please try again later."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
