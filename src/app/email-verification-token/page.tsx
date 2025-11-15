import React, { Suspense } from "react";
import ConfirmEmailPage from "@/components/ConfirmEmail";

export default function Page() {
  return (
    <main>
      <Suspense fallback={<div />}>
        <ConfirmEmailPage />
      </Suspense>
    </main>
  );
}
