import { useCallback, useEffect, useState } from "react";
import { authClient, type AuthUser } from "../lib/auth-client";

interface UseAuthSession {
  isConnected: boolean;
  isLoading: boolean;
  currentUser: AuthUser | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser | null) => void;
}

export function useAuthSession(): UseAuthSession {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(authClient.getToken()));

  const refresh = useCallback(async () => {
    if (!authClient.getToken()) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authClient.me();
      setCurrentUser(me);
    } catch {
      authClient.clear();
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onAuthChanged = () => {
      void refresh();
    };
    window.addEventListener("triply-auth-changed", onAuthChanged);
    return () => window.removeEventListener("triply-auth-changed", onAuthChanged);
  }, [refresh]);

  const logout = useCallback(async () => {
    await authClient.logout();
    setCurrentUser(null);
  }, []);

  return {
    isConnected: !!currentUser,
    isLoading,
    currentUser,
    refresh,
    logout,
    setUser: setCurrentUser,
  };
}
