import AuthPanel from "@/components/auth/AuthPanel";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="grid gap-6 px-3 pb-6 md:px-6 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[1fr_minmax(0,42%)]">
      <div className="flex items-center justify-center px-3 py-12">
        <LoginForm next={typeof next === "string" ? next : undefined} />
      </div>
      <AuthPanel title="Welcome back to the market." footer="Members see their bookings and passes. Admins manage spots and every vendor’s booking." />
    </div>
  );
}
