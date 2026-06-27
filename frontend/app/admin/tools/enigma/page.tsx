import { EnigmaClient } from "@/components/admin/EnigmaClient";

// Enigma I tool: a configurable rotor machine with live input -> output. The auth guard
// and shell are applied by the admin layout, so this page only renders the content.
export default function EnigmaToolPage() {
  return <EnigmaClient />;
}
