import { Suspense } from "react";
import ResetPasswordPage from "@/components/ResetPassword";
import { LoadingSpinner } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        }
      >
        <ResetPasswordPage />
      </Suspense>
    </main>
  );
}
