"use client";

import { Footer, FooterCopyright } from "flowbite-react";
import Link from "next/link";
import "devicon/devicon.min.css";
import { MediaSocialType } from "@/app/types/resume";
import { isSafeUrl } from "@/lib/url";

interface FooterClientProps {
  mediaSocials: MediaSocialType[];
}

export function FooterClient({ mediaSocials }: FooterClientProps) {
  return (
    <div className="bottom-0 w-full">
      <Footer container>
        <div className="w-full sm:flex sm:items-center sm:justify-between">
          <FooterCopyright href="/" by="Bayu Wicaksono" year={new Date().getFullYear()} />
          <div className="mt-4 flex space-x-6 sm:mt-0 sm:justify-center">
            {mediaSocials.filter((social) => isSafeUrl(social.url)).map((social) => (
              <Link
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group text-2xl text-gray-500"
              >
                <i className={`${social.iconClass} transition-transform group-hover:scale-110`}></i>
              </Link>
            ))}
          </div>
        </div>
      </Footer>
    </div>
  );
}
