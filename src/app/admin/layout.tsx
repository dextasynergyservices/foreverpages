import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import AdminLayoutClient from "./AdminLayoutClient";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?redirect=/admin");
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    redirect("/user-dashboard");
  }

  return (
    <AdminLayoutClient userName={user.name || "Admin"} userRole={user.role}>
      {children}
    </AdminLayoutClient>
  );
}
