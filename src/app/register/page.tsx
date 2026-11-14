import AuthPanel from "@/components/auth/AuthPanel";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="grid gap-6 px-3 pb-6 md:px-6 lg:min-h-[calc(100dvh-5rem)] lg:grid-cols-[minmax(0,42%)_1fr]">
      <AuthPanel title="Set up your vendor account." footer="Pick your role in the form. Most market vendors sign up as members.">
        <div className="flex flex-col gap-3.5">
          <div className="rounded-[28px] bg-lantern px-7 py-6 text-onlight">
            <p className="display text-3xl">Member</p>
            <p>Book up to 3 spots a night and manage your own bookings.</p>
          </div>
          <div className="rounded-[28px] bg-night/35 px-7 py-6">
            <p className="display text-3xl">Admin</p>
            <p>Add and edit spots, and manage every vendor’s booking.</p>
          </div>
        </div>
      </AuthPanel>
      <div className="flex items-center justify-center px-3 py-12">
        <RegisterForm />
      </div>
    </div>
  );
}
