import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import api, { setTokenGetter } from "../lib/api";
import { auth, googleProvider } from "../lib/firebase";
import { normalizeError } from "../utils/chat";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);

  const getToken = useCallback(async () => {
    if (!auth.currentUser) return null;
    return await auth.currentUser.getIdToken();
  }, []);

  useEffect(() => {
    setTokenGetter(getToken);
  }, [getToken]);

  const syncSession = useCallback(async () => {
    const response = await api.post("/auth/session");
    const nextProfile = response.data?.data?.user || null;
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      try {
        setFirebaseUser(user);

        if (user) {
          await syncSession();
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Session sync failed:", error);
        setProfile(null);
      } finally {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, [syncSession]);

  const login = useCallback(async ({ email, password }) => {
    setAuthBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      throw new Error(normalizeError(error, "Login failed"));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setAuthBusy(true);
    try {
      const credentials = await createUserWithEmailAndPassword(auth, email, password);

      if (name?.trim()) {
        await updateProfile(credentials.user, { displayName: name.trim() });
      }

      await syncSession();

      await sendEmailVerification(credentials.user, {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: false
      });

      return true;
    } catch (error) {
      throw new Error(normalizeError(error, "Signup failed"));
    } finally {
      setAuthBusy(false);
    }
  }, [syncSession]);

  const loginWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (error) {
      throw new Error(normalizeError(error, "Google sign-in failed"));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthBusy(true);
    try {
      if (auth.currentUser) {
        try {
          await api.post("/auth/logout");
        } catch (error) {
          console.warn("Backend logout failed:", error);
        }
      }

      await signOut(auth);
      setFirebaseUser(null);
      setProfile(null);
      return true;
    } catch (error) {
      throw new Error(normalizeError(error, "Logout failed"));
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const response = await api.get("/auth/me");
    const nextProfile = response.data?.data || null;
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const updateMyProfile = useCallback(async (payload) => {
    const response = await api.patch("/users/me", payload);
    const nextProfile = response.data?.data || null;
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const resendVerification = useCallback(async () => {
    if (!auth.currentUser) {
      throw new Error("No active user");
    }

    try {
      await api.post("/auth/send-verification-email", {
        continueUrl: `${window.location.origin}/auth/action`
      });
      return true;
    } catch (error) {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: false
      });
      return true;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email) => {
    try {
      await api.post("/auth/forgot-password", {
        email,
        continueUrl: `${window.location.origin}/auth/action`
      });
      return true;
    } catch (error) {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false
      });
      return true;
    }
  }, []);

  const value = useMemo(() => ({
    firebaseUser,
    profile,
    initializing,
    authBusy,
    login,
    signup,
    loginWithGoogle,
    logout,
    refreshProfile,
    updateMyProfile,
    resendVerification,
    requestPasswordReset,
    getToken
  }), [
    firebaseUser,
    profile,
    initializing,
    authBusy,
    login,
    signup,
    loginWithGoogle,
    logout,
    refreshProfile,
    updateMyProfile,
    resendVerification,
    requestPasswordReset,
    getToken
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}