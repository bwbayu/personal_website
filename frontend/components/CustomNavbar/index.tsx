import { fetchMediaSocials } from "@/app/api/mediaSocials";
import { NavbarClient } from "./NavbarClient";

export async function CustomNavbar() {
  const mediaSocials = await fetchMediaSocials();
  return <NavbarClient mediaSocials={mediaSocials} />;
}
