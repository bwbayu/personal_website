"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/AuthContext";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";

// Nested layout for the admin area: provides the auth context to every /admin route.
// Every page except the login screen is wrapped in the access guard (probe-on-login)
// and the sidebar shell. The admin sits outside the (public) route group, so the
// public marketing Navbar/Footer do not render here - only the admin shell.
export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  return (
    <AuthProvider>
      {isLogin ? (
        children
      ) : (
        <AdminGuard>
          <AdminShell>{children}</AdminShell>
        </AdminGuard>
      )}
    </AuthProvider>
  );
}
