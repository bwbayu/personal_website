/* eslint-disable tailwindcss/no-custom-classname */
import Link from "next/link";
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";
import "devicon/devicon.min.css";
import Image from "next/image";

export function CustomNavbar() {
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
          <NavbarLink
            as={Link}
            href="https://github.com/bwbayu"
            className="text-lg"
          >
            <i className="devicon-github-original"></i>
          </NavbarLink>
          <NavbarLink
            as={Link}
            href="https://www.linkedin.com/in/bayu-wicaksono-6a4b722a2"
            className="text-lg"
          >
            <i className="devicon-linkedin-plain"></i>
          </NavbarLink>
          <NavbarLink
            as={Link}
            href="https://huggingface.co/bwbayu"
            className="text-lg"
          >
            <Image
              src="/huggingface.png"
              alt="HuggingFace Icon"
              width={40}
              height={40}
            />
          </NavbarLink>
        </NavbarCollapse>
      </Navbar>
    </div>
  );
}
