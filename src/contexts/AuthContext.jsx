import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";

export const AuthContext = createContext();

// Custom hook - this is what App.jsx calls as AuthContext()
export const useAuthContext = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
  const localUser = localStorage.getItem("alwajudUser");
  const initialUser = localUser ? JSON.parse(localUser) : null;
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [token, setToken] = useState(initialUser?.accessToken || null);
  const Url = import.meta.env.VITE_ROUTE;

  const isTokenExpired = (user) => {
    if (!user || !user.exp) return true;
    return Date.now() >= user.exp;
  };
  
  const login = async (inputs) => {
    const res = await axios.post(
      `${Url}/login`,
      { password: inputs },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const exp = Date.now() + 30 * 60 * 1000;
    const userData = { ...res.data, exp };

    setCurrentUser(userData); // <-- this is what unlocks the protected routes
    return userData;
  };

  const logout = async () => {
    try {
      await axios.post(`${Url}/clients/logout`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      // proceed with cleanup regardless
    } finally {
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem("alwajudUser");
    }
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("alwajudUser", JSON.stringify(currentUser));
      setToken(currentUser.accessToken);

      const delay = currentUser.exp - Date.now();
      if (delay > 0) {
        const timeoutId = setTimeout(logout, delay);
        return () => clearTimeout(timeoutId);
      } else {
        logout();
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialUser && isTokenExpired(initialUser)) {
      logout();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, Url }}>
      {children}
    </AuthContext.Provider>
  );
};
