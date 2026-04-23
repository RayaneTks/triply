import { useState, useEffect } from "react";

// TODO: wire real auth context with backend
export function useAuthSession() {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Check local storage token or session cookie
  }, []);

  return { isConnected, currentUser, logout: () => setIsConnected(false) };
}
