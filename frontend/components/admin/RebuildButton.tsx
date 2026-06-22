"use client";

import { useState } from "react";
import { Modal } from "flowbite-react";
import { triggerRebuild } from "@/lib/admin/api";
import { useAdminToast } from "./ToastProvider";
import { confirmModalTheme } from "./confirmModalTheme";

// Manual "Rebuild site" trigger (D3): no auto-fire on publish. A confirm modal guards
// against accidental rebuild storms; the action is disabled while in flight so it can't
// double-fire. Backend 503 ('not configured') / 502 ('dispatch failed') surface their
// message inside the modal instead of crashing.
export function RebuildButton() {
  const { show } = useAdminToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = () => {
    setError(null);
    setConfirmOpen(true);
  };

  const close = () => {
    if (pending) return;
    setConfirmOpen(false);
  };

  const run = async () => {
    setPending(true);
    setError(null);
    try {
      await triggerRebuild();
      show("Rebuild started");
      setConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rebuild failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="rounded border border-gray-600 px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
      >
        Rebuild site
      </button>

      <Modal show={confirmOpen} size="md" dismissible onClose={close} theme={confirmModalTheme}>
        <Modal.Header>Rebuild site</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-gray-300">
            Trigger a full rebuild and redeploy of the public site? Published changes go
            live a few minutes after the build finishes.
          </p>
          {error && (
            <p className="mt-3 rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={run}
            disabled={pending}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Starting..." : "Rebuild"}
          </button>
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="rounded border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
