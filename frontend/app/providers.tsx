"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// App-root client boundary for TanStack Query. One QueryClient is shared by both the
// public route group and the admin area, so cache + dedup span the whole app. Created
// once per mount via useState so it is not re-instantiated on re-render.
//
// Defaults: staleTime 5m matches the server `Cache-Control: max-age=300`;
// refetchOnWindowFocus off (single operator; admin freshness comes from explicit
// invalidation after writes, not focus refetch); retry once.
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
