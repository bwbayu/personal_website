"use client";

import Link from "next/link";
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import "devicon/devicon.min.css";
import { MediaSocialType } from "@/app/types/resume";
import { isSafeUrl } from "@/lib/url";

interface NavbarClientProps {
  mediaSocials: MediaSocialType[];
}

export function NavbarClient({ mediaSocials }: NavbarClientProps) {
  return (
    <div className="w-full">
      <Navbar fluid rounded className="bg-gray-800 dark:bg-gray-800">
        <NavbarBrand as={Link} href="/">
          <span className="self-center whitespace-nowrap p-2 text-xl font-semibold text-white hover:text-blue-500 dark:text-white dark:hover:text-blue-500">
            bwbayu
          </span>
        </NavbarBrand>
        <NavbarToggle />
        <NavbarCollapse>
          <NavbarLink as={Link} href="/resume" className="text-lg">
            Resume
          </NavbarLink>
          <NavbarLink as={Link} href="/project" className="text-lg">
            Project
          </NavbarLink>
          {mediaSocials.filter((social) => isSafeUrl(social.url)).map((social) => (
            <NavbarLink
              key={social.name}
              as={Link}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg"
            >
              <div className="group relative flex flex-col items-center">
                <i className={`${social.iconClass} text-lg transition-transform group-hover:scale-110`}></i>
              </div>
            </NavbarLink>
          ))}
        </NavbarCollapse>
      </Navbar>
    </div>
  );
}
