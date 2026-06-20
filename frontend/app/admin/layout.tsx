"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/AuthContext";

// Nested layout for the admin area: provides the auth context to every /admin
// route. The public Navbar/Footer from the root layout still render around it.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
