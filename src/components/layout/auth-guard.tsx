"use client";

import { useIsAuthenticated, useLogout } from "@refinedev/core";
import { useEffect } from "react";
import { ADMIN_LOGIN } from "./nav";

/**
 * Client-side session check. The proxy already redirects requests without an admin token
 * and the backend enforces role=admin on every call, so the page renders straight away
 * (a static shell for instant navigation); this only signs out a session the backend has
 * since rejected (expired refresh, revoked or demoted user).
 */
export function AuthGuard() {
  const { data } = useIsAuthenticated();
  const { mutate: logout } = useLogout();
  const rejected = data?.authenticated === false;
  useEffect(() => {
    if (rejected) logout({ redirectPath: ADMIN_LOGIN });
  }, [rejected, logout]);
  return null;
}
