import { CustomNavbar } from "@/components/CustomNavbar";
import CustomFooter from "@/components/CustomFooter";

// Chrome for the public marketing site: wraps every public route in the shared
// navbar/footer. Kept as a fragment so navbar/page/footer remain direct flex
// children of <body> (same DOM as before the route-group split). The admin area
// lives outside this group and supplies its own shell.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <CustomNavbar />
      {children}
      <CustomFooter />
    </>
  );
}
