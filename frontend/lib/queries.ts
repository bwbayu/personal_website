"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchAbout } from "@/app/api/about";
import { fetchSkills } from "@/app/api/skills";
import { fetchCategories } from "@/app/api/categories";
import { fetchProjects } from "@/app/api/projects";
import { fetchResume } from "@/app/api/resume";
import { fetchMediaSocials } from "@/app/api/mediaSocials";

// Central query keys + typed hooks for the public reads. Keys are stable per
// endpoint so the same endpoint requested from two places (media-socials in the
// navbar + footer; skills on home + projects) dedups to a single network request
// and shares one cache entry. The fetchers in app/api/* keep their `no-store` fetch
// and act as the query functions — TanStack Query is the cache layer, not the
// browser HTTP cache.
//
// Each hook's return type is annotated explicitly: the inferred UseQueryResult
// references an internal (un-nameable) react-query type, so without an annotation
// `data` degrades to `any` at the import site (TS2742). The data type is derived
// from the fetcher so the annotation can never drift from the actual payload.
export const queryKeys = {
  about: ["about"],
  skills: ["skills"],
  categories: ["categories"],
  projects: ["projects"],
  resume: ["resume"],
  mediaSocials: ["media-socials"],
} as const;

type Data<F extends () => Promise<unknown>> = Awaited<ReturnType<F>>;

export const useAbout = (): UseQueryResult<Data<typeof fetchAbout>, Error> =>
  useQuery({ queryKey: queryKeys.about, queryFn: fetchAbout });

export const useSkills = (): UseQueryResult<Data<typeof fetchSkills>, Error> =>
  useQuery({ queryKey: queryKeys.skills, queryFn: fetchSkills });

export const useCategories = (): UseQueryResult<Data<typeof fetchCategories>, Error> =>
  useQuery({ queryKey: queryKeys.categories, queryFn: fetchCategories });

export const useProjects = (): UseQueryResult<Data<typeof fetchProjects>, Error> =>
  useQuery({ queryKey: queryKeys.projects, queryFn: fetchProjects });

export const useResume = (): UseQueryResult<Data<typeof fetchResume>, Error> =>
  useQuery({ queryKey: queryKeys.resume, queryFn: fetchResume });

export const useMediaSocials = (): UseQueryResult<Data<typeof fetchMediaSocials>, Error> =>
  useQuery({ queryKey: queryKeys.mediaSocials, queryFn: fetchMediaSocials });
