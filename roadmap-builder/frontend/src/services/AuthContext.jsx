import { createContext, useContext, useState } from "react";
import { authService } from "./authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getCurrentUser());

  const login = async (credentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const signup = async (details) => {
    const newUser = await authService.signup(details);
    setUser(newUser);
    return newUser;
  };

    const logout = () => {
        authService.logout();
        window.location.replace("/");
        setUser(null);
    };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
