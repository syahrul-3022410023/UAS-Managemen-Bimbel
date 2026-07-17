import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { getSessionUser } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(roleHomePath(user.role));
  }

  return (
    <AuthCard
      title="Masuk ke akun"
      description="Silakan masuk menggunakan akun Anda yang telah terdaftar."
    >
      <LoginForm />
    </AuthCard>
  );
}
