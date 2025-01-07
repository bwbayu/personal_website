import flowbite from "flowbite-react/tailwind";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    flowbite.content(),
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-out': 'fadeInOut 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out forwards',
        'fade-in-left': 'fadeInLeft 0.5s ease-in-out forwards',
        'fade-in-left-top': 'fadeInLeftTop 0.6s ease-in-out forwards',
        'fade-in-right-top': 'fadeInRightTop 0.6s ease-in-out forwards',
      },
      keyframes: {
        fadeInOut: {
          '0%': { opacity: 0, transform: 'translateY(0px)' },
          '50%': { opacity: 1, transform: 'translateY(-20px)' },
          '100%': { opacity: 0, transform: 'translateY(-40px)' },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(-20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: 0, transform: 'translateX(-20px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        fadeInLeftTop: {
          '0%': { opacity: 0, transform: 'translate(-20px, -20px)' },
          '100%': { opacity: 1, transform: 'translate(0, 0)' },
        },
        fadeInRightTop: {
          '0%': { opacity: 0, transform: 'translate(20px, -20px)' },
          '100%': { opacity: 1, transform: 'translate(0, 0)' },
        },
      },
    },
  },

  plugins: [flowbite.plugin(), require('tailwindcss-animate')],
};
export default config;
