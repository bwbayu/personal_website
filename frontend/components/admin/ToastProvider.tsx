"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Toast, ToastToggle, type CustomFlowbiteTheme } from "flowbite-react";

interface AdminToastApi {
  show: (message: string) => void;
}

const AdminToastContext = createContext<AdminToastApi | null>(null);

const AUTO_DISMISS_MS = 3000;

// Force the Flowbite toast onto the layered-dark palette in both OS color schemes
// (the admin is dark-always, while Flowbite's default theme is light with a dark:
// variant). Overriding the theme leaves replaces the light/dark pair outright.
const toastDarkTheme: CustomFlowbiteTheme["toast"] = {
  root: {
    base: "flex w-full max-w-xs items-center gap-3 rounded-lg border border-gray-700 bg-gray-800 p-4 text-sm text-gray-200 shadow",
  },
  toggle: {
    base: "-m-1.5 ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-gray-600",
    icon: "h-5 w-5 shrink-0",
  },
};

/**
 * Admin-scoped toast. Mounted once in the admin layout so a single toast survives the
 * post-save redirect to the list (calling show() right before router.push makes the
 * toast appear on the destination). Auto-dismisses; also closeable by hand.
 */
export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setMessage(null);
  }, []);

  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => {
      timer.current = null;
      setMessage(null);
    }, AUTO_DISMISS_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <AdminToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast theme={toastDarkTheme}>
            <span className="font-normal">{message}</span>
            <ToastToggle onDismiss={dismiss} />
          </Toast>
        </div>
      )}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast(): AdminToastApi {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used within an AdminToastProvider");
  }
  return ctx;
}
