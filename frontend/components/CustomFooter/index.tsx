import { fetchMediaSocials } from "@/app/api/mediaSocials";
import { FooterClient } from "./FooterClient";

const CustomFooter = async () => {
  const mediaSocials = await fetchMediaSocials();
  return <FooterClient mediaSocials={mediaSocials} />;
};

export default CustomFooter;
