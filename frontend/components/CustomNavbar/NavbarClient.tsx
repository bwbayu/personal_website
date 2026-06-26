"use client";

import Link from "next/link";
import {
  Navbar,
  NavbarBrand,
  NavbarCollapse,
  NavbarLink,
  NavbarToggle,
} from "flowbite-react";

export function NavbarClient() {
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
          <NavbarLink as={Link} href="/blog" className="text-lg">
            Blog
          </NavbarLink>
          <NavbarLink as={Link} href="/daily" className="text-lg">
            Daily Log
          </NavbarLink>
        </NavbarCollapse>
      </Navbar>
    </div>
  );
}
