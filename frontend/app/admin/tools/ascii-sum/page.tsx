import { AsciiSumClient } from "@/components/admin/AsciiSumClient";

// ASCII sum tool: a single text input with a live total of its character codes. The
// auth guard and shell are applied by the admin layout, so this page only renders the
// content.
export default function AsciiSumToolPage() {
  return <AsciiSumClient />;
}
