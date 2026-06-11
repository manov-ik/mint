import { Suspense } from "react";
import SignUpClient from "./SignUpClient";

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpClient />
    </Suspense>
  );
}
