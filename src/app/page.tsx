import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (session.isLoggedIn) {
    if (session.role === "student") redirect("/student/dashboard");
    else if (session.role === "lecturer") redirect("/lecturer/dashboard");
    else if (session.role === "admin") redirect("/admin/dashboard");
  }
  redirect("/login");
}
