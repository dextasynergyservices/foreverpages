import React, { Suspense } from "react";
import RegisterPage from "@/components/signup";

export default function Page() {
  return (
    <main>
      <Suspense fallback={<div />}>
        <RegisterPage />
      </Suspense>
    </main>
  );
}
