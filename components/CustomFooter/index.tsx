import {
  Footer,
  FooterCopyright,
  FooterIcon,
} from "flowbite-react";
import { BsInstagram, BsTwitter } from "react-icons/bs";

const CustomFooter = () => {
  return (
    <div className="w-full bottom-0">
      <Footer container>
        <div className="w-full sm:flex sm:items-center sm:justify-between">
          <FooterCopyright href="/" by="Bayu Wicaksono" year={2025} />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            <FooterIcon href="https://www.instagram.com/bwbayu/?hl=en" icon={BsInstagram} />
            <FooterIcon href="https://x.com/Bwbayuuu" icon={BsTwitter} />
          </div>
        </div>
      </Footer>
    </div>
  )
}

export default CustomFooter