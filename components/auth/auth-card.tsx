import Link from "next/link";
import { AuthIllustration } from "./auth-illustration";

type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <main className="auth-main flex min-h-screen items-center justify-center bg-[#F3F6FA] p-4 md:p-6 lg:p-8">
      {/* Container Card - Designed to fill the desktop screen elegantly (h-[85vh]) but keep clean margins */}
      <section className="auth-card relative flex flex-col md:flex-row w-full max-w-6xl items-stretch rounded-3xl md:rounded-[2.2rem] border border-slate-100 bg-white p-2.5 md:p-3.5 shadow-[0_24px_60px_rgba(20,50,90,0.07)] md:h-[86vh] md:max-h-[720px] md:min-h-[580px]">
        
        {/* Left Side: Custom Illustration Panel - Banner on mobile, full panel on desktop */}
        <div className="w-full md:w-[48%] shrink-0 h-[300px] md:h-full flex">
          <AuthIllustration />
        </div>

        {/* Right Side: Authentication Form - Takes 52% width on desktop, 100% on mobile */}
        <div className="auth-form-container w-full md:w-[52%] flex flex-col justify-start md:justify-center px-4 py-8 sm:px-8 md:px-12 lg:px-16 overflow-y-auto">
          <div className="w-full">
            {/* Header branding on mobile only */}
            <div className="mb-6 md:hidden">
              <Link href="/" className="text-xs font-bold uppercase tracking-wider text-brand">
                Manajemen Bimbel
              </Link>
            </div>

            {/* Form Title & Subtitle */}
            <div className="mb-7">
              <h1 className="auth-form-title app-title-secondary md:app-title-primary leading-tight text-ink">
                {title}
              </h1>
              <p className="auth-form-desc mt-2.5 app-caption leading-relaxed text-slate-500">
                {description}
              </p>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-4">
              {children}
            </div>

            {/* Terms of Service / Privacy Policy notice */}
            <div className="mt-6 text-center app-caption-small text-slate-400">
              Dengan melanjutkan, Anda menyetujui{" "}
              <Link href="#" className="underline transition hover:text-brand">
                Ketentuan Layanan
              </Link>{" "}
              dan{" "}
              <Link href="#" className="underline transition hover:text-brand">
                Kebijakan Privasi
              </Link>{" "}
              kami.
            </div>

            {/* Footer Links */}
            {footer ? (
              <div className="mt-6 text-center text-sm font-semibold text-slate-500 border-t border-slate-100 pt-4">
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
