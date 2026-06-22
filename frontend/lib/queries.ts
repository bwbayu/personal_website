"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchMediaSocials } from "@/app/api/mediaSocials";

// Central query keys + typed hooks for the public reads. Keys are stable per
// endpoint so the same endpoint requested from two places (media-socials in the
// navbar + footer) dedups to a single network request and shares one cache entry.
// The fetcher in app/api/* keeps its `no-store` fetch and acts as the query
// function — TanStack Query is the cache layer, not the browser HTTP cache.
//
// The home/projects/resume pages render at build time (see lib/public/content.ts),
// so media-socials (navbar + footer chrome) is the only remaining public read here.
//
// Each hook's return type is annotated explicitly: the inferred UseQueryResult
// references an internal (un-nameable) react-query type, so without an annotation
// `data` degrades to `any` at the import site (TS2742). The data type is derived
// from the fetcher so the annotation can never drift from the actual payload.
export const queryKeys = {
  mediaSocials: ["media-socials"],
} as const;

// Admin reads are keyed by API path so a domain's list view and its dashboard count
// share one cache entry (one fetch, one invalidation refreshes both). Distinct from
// the public keys above: admin lists are unfiltered and refetched on write.
export const adminKeys = {
  domain: (apiPath: string) => ["admin", apiPath] as const,
};

type Data<F extends () => Promise<unknown>> = Awaited<ReturnType<F>>;

export const useMediaSocials = (): UseQueryResult<Data<typeof fetchMediaSocials>, Error> =>
  useQuery({ queryKey: queryKeys.mediaSocials, queryFn: fetchMediaSocials });
