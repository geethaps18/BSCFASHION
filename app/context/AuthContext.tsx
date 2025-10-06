"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  name: string;
  contact: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isSignedIn: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  loginWithOtp: (contact: string, otp: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchMe = useCallback(async (t?: string) => {
    const authToken = t || token;
    if (!authToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        // ✅ Fix: Map API response to user
        setUser({
          id: data.userId,
          name: data.name || "",
          contact: data.email || data.phone || "",
        });
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      fetchMe(savedToken).finally(() => setIsHydrated(true));
    } else {
      setIsHydrated(true);
      setIsLoading(false);
    }
  }, [fetchMe]);

  const loginWithOtp = async (contact: string, otp: string) => {
    try {
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, otp }),
      });

      if (!res.ok) throw new Error("Login failed");

      const data = await res.json();
      setToken(data.token);
      localStorage.setItem("token", data.token);
      await fetchMe(data.token);
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isSignedIn: !!user,
        isLoading,
        isHydrated,
        loginWithOtp,
        logout,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
