import React, { Suspense } from "react";
import RegisterPage from "@/components/signup";
import { AuthFormSkeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <main>
      <Suspense fallback={<AuthFormSkeleton />}>
        <RegisterPage />
      </Suspense>
    </main>
  );
}
