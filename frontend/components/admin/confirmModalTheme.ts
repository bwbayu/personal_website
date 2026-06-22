import { type CustomFlowbiteTheme } from "flowbite-react";

// Force the Flowbite modal onto the layered-dark palette in both OS color schemes
// (the admin is dark-always; Flowbite defaults to a light panel with a dark: variant).
// Shared by the delete confirm (list view) and the rebuild confirm.
export const confirmModalTheme: CustomFlowbiteTheme["modal"] = {
  content: {
    inner:
      "relative flex max-h-[90dvh] flex-col rounded-lg border border-gray-700 bg-gray-800 shadow",
  },
  header: {
    base: "flex items-start justify-between rounded-t border-b border-gray-700 p-5",
    title: "text-xl font-medium text-white",
    close: {
      base: "ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-white",
      icon: "h-5 w-5",
    },
  },
  footer: {
    base: "flex items-center space-x-2 rounded-b border-gray-700 p-6",
  },
};
