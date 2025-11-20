import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, tenantId: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current session status
  const checkSession = async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include", // Include cookies in requests
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Session check error:", error);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check session on app startup
    checkSession().finally(() => setIsLoading(false));
  }, []);

  const login = async (
    username: string,
    password: string,
    tenantId: string
  ): Promise<boolean> => {
    try {
      console.log("🔐 Login attempt:", { username, password: "***", tenantId });
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in requests
        body: JSON.stringify({ username, password, tenantId }),
      });

      console.log("📡 Login response:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Login successful:", data.user);
        setUser(data.user);
        return true;
      }
      
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Login failed:", response.status, errorData);
      return false;
    } catch (error) {
      console.error("💥 Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include", // Include cookies in requests
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, checkSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
