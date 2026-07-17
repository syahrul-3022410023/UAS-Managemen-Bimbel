import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      description="Masukkan email akun untuk menerima link reset password."
      footer={
        <Link className="font-medium text-brand" href="/login">
          Kembali ke login
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
