// app/login/page.tsx
import GoogleTokenBridge from "@/components/GoogleTokenBridge";
import LoginPageInner from "@/components/LoginPageInner";

export default function Page() {
  return (
    <>
      <GoogleTokenBridge />
      <LoginPageInner />
    </>
  );
}
