import type { AuthProvider } from "@refinedev/core";
import { api } from "@/lib/api/browser";

async function postJson(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { detail?: string; dev_otp?: string | null };
  return { ok: res.ok, status: res.status, data };
}

export const requestOtp = (phone: string) => postJson("/api/auth/otp/request", { phone });

export const authProvider: AuthProvider = {
  async login({ phone, otp, redirectTo }: { phone: string; otp: string; redirectTo?: string }) {
    const r = await postJson("/api/auth/otp/verify", { phone, otp });
    if (r.ok) return { success: true, redirectTo: redirectTo || "/" };
    return {
      success: false,
      error: { name: "Login failed", message: r.data.detail ?? "Could not verify the code." },
    };
  },
  async logout() {
    await postJson("/api/auth/logout");
    return { success: true, redirectTo: "/login" };
  },
  async check() {
    const { data, response } = await api.GET("/api/v1/auth/me").catch(() => ({
      data: undefined,
      response: { ok: false } as Response,
    }));
    if (response.ok && data?.role === "admin") return { authenticated: true };
    return { authenticated: false, logout: true, redirectTo: "/login" };
  },
  async getIdentity() {
    const { data } = await api.GET("/api/v1/auth/me");
    return data ? { ...data, name: data.full_name || data.phone } : null;
  },
  async getPermissions() {
    const { data } = await api.GET("/api/v1/auth/me");
    return data?.role ?? null;
  },
  async onError(error: { statusCode?: number; status?: number }) {
    const status = error?.statusCode ?? error?.status;
    if (status === 401) return { logout: true, redirectTo: "/login" };
    return { error: error as Error };
  },
};
