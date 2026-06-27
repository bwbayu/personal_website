// Admin "Tools" are non-CRUD utility pages (e.g. the ASCII sum encryption box). They
// live outside config.ts / registry / navGroups on purpose: the registry guard requires
// every navGroups slug to be a CRUD domain, so tools keep their own list with a full
// route path instead of resolving through bySlug / `/admin/<slug>`.
export type ToolLink = {
  slug: string;
  label: string;
  path: string;
};

export const toolLinks: ToolLink[] = [
  { slug: "ascii-sum", label: "ASCII sum", path: "/admin/tools/ascii-sum" },
  { slug: "enigma", label: "Enigma", path: "/admin/tools/enigma" },
];
