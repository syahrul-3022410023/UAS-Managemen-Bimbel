import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Buat password baru"
      description="Gunakan password baru minimal 8 karakter."
    >
      <ResetPasswordForm />
    </AuthCard>
  );
}
