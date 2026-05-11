import { apiFetch, type ApiSuccessEnvelope } from "./http";

const TOKEN_KEY = "triply_token";

function notifyAuthChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("triply-auth-changed"));
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface LoginRegisterData {
  user: AuthUser;
  token: string;
  token_type: string;
}

interface MeData {
  user: AuthUser;
}

export const authClient = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
      notifyAuthChanged();
    }
  },
  clear() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      notifyAuthChanged();
    }
  },

  async login(payload: { email: string; password: string; device_name?: string }): Promise<AuthUser> {
    const res = await apiFetch<ApiSuccessEnvelope<LoginRegisterData>>("/auth/login", {
      method: "POST",
      body: { ...payload, device_name: payload.device_name ?? "triply-spa" },
      authenticated: false,
    });
    if (res?.data?.token) this.setToken(res.data.token);
    return res.data.user;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    device_name?: string;
  }): Promise<AuthUser> {
    const res = await apiFetch<ApiSuccessEnvelope<LoginRegisterData>>("/auth/register", {
      method: "POST",
      body: { ...payload, device_name: payload.device_name ?? "triply-spa" },
      authenticated: false,
    });
    if (res?.data?.token) this.setToken(res.data.token);
    return res.data.user;
  },

  async me(): Promise<AuthUser> {
    const res = await apiFetch<ApiSuccessEnvelope<MeData>>("/auth/me");
    return res.data.user;
  },

  async logout(): Promise<void> {
    try {
      await apiFetch<ApiSuccessEnvelope<{ revoked: boolean }>>("/auth/logout", { method: "POST" });
    } finally {
      this.clear();
    }
  },

  forgotPassword(payload: { email: string }) {
    return apiFetch<ApiSuccessEnvelope<{ requested: boolean; email: string }>>("/auth/forgot-password", {
      method: "POST",
      body: payload,
      authenticated: false,
    });
  },

  resetPassword(payload: { email: string; token: string; password: string; password_confirmation: string }) {
    return apiFetch<ApiSuccessEnvelope<{ reset: boolean; email: string }>>("/auth/reset-password", {
      method: "POST",
      body: payload,
      authenticated: false,
    });
  },
};
