import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("mill_user");
    const savedToken = localStorage.getItem("mill_token");
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem("mill_user", JSON.stringify({
      _id: userData._id,
      username: userData.username,
      role: userData.role
    }));
    localStorage.setItem("mill_token", userData.token);
    setUser({
      _id: userData._id,
      username: userData.username,
      role: userData.role
    });
  };

  const logout = () => {
    localStorage.removeItem("mill_user");
    localStorage.removeItem("mill_token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === "superadmin", loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
