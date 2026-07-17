import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { roleHomePath } from "@/lib/auth/roles";

export default async function HomePage() {
  const user = await getSessionUser();

  if (user) {
    redirect(roleHomePath(user.role));
  }

  redirect("/login");
}
