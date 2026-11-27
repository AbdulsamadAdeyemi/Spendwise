// Authentication service communicating with PostgreSQL backend via JWT tokens.
import { apiClient } from "./apiClient";

export const authService = {
  async register({ firstName, lastName, email, password, profilePictureUrl }) {
    const trimmedFirstName = (firstName || "").trim();
    const trimmedLastName = (lastName || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!trimmedFirstName || trimmedFirstName.length > 60) {
      throw new Error("First name must be between 1 and 60 characters.");
    }
    if (!trimmedLastName || trimmedLastName.length > 60) {
      throw new Error("Last name must be between 1 and 60 characters.");
    }
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw new Error("Enter a valid email address.");
    }
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    try {
      const data = await apiClient.post("/auth/register", {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: normalizedEmail,
        password,
        profilePictureUrl,
      });

      if (data?.token) {
        apiClient.setToken(data.token);
      }

      // Purge legacy local storage mock user tables if present
      localStorage.removeItem("spendwise_users");
      localStorage.removeItem("spendwise_active_user");

      return data.user;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to the SpendWise backend server. Please verify your connection.",
          { cause: error }
        );
      }
      throw error;
    }
  },

  async login({ email, password }) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Please enter your email address.");
    }
    if (!password) {
      throw new Error("Please enter your password.");
    }

    try {
      const data = await apiClient.post("/auth/login", {
        email: normalizedEmail,
        password,
      });

      if (data?.token) {
        apiClient.setToken(data.token);
      }

      // Purge legacy local storage mock user tables if present
      localStorage.removeItem("spendwise_users");
      localStorage.removeItem("spendwise_active_user");

      return data.user;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to the SpendWise backend server. Please verify your connection.",
          { cause: error }
        );
      }
      throw error;
    }
  },

  async getProfile() {
    try {
      const data = await apiClient.get("/auth/me");
      return data?.user || null;
    } catch {
      return null;
    }
  },

  async updateProfile({ firstName, lastName, profilePictureUrl }) {
    const data = await apiClient.put("/auth/profile", {
      firstName,
      lastName,
      profilePictureUrl,
    });
    if (data?.user) {
      return data.user;
    }
    throw new Error("Failed to update profile.");
  },

  async forgotPassword(email) {
    const normalizedEmail = (email || "").trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error("Please enter your email address.");
    }
    return await apiClient.post("/auth/forgot-password", { email: normalizedEmail });
  },

  async verifyResetToken(token) {
    if (!token) {
      return { valid: false, error: "Reset token missing." };
    }
    return await apiClient.post("/auth/verify-reset-token", { token });
  },

  async resetPassword({ token, password }) {
    if (!token) {
      throw new Error("Reset token is missing or invalid.");
    }
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }
    return await apiClient.post("/auth/reset-password", { token, password });
  },

  logout() {
    try {
      apiClient.clearToken();
      localStorage.removeItem("spendwise_active_user");
      localStorage.removeItem("spendwise_users");
    } catch (error) {
      console.error("[Auth Service] Failed to clear session:", error);
    }
  },
};
