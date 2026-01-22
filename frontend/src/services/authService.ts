import api from "@/lib/api";
import { UserRole } from "@/types";

/* =======================
   TYPES
======================= */

export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    userId: number;
    phoneNumber: string;
    name: string;
    role: UserRole;
  };
  isNewUser: boolean;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  otp?: string; // dev only
}

/* =======================
   AUTH SERVICE
======================= */

export const authService = {
  // Send OTP
  async sendOtp(phoneNumber: string): Promise<OTPResponse> {
    const response = await api.post("/auth/send-otp", { phoneNumber });
    return response.data;
  },

  // Verify OTP + login
  async verifyOtp(
    phoneNumber: string,
    otp: string,
    role: UserRole
  ): Promise<LoginResponse> {
    const response = await api.post("/auth/verify-otp", {
      phoneNumber,
      otp,
      role,
    });

    if (response.data.success) {
      localStorage.setItem("auth_token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  },

  // Logout
  logout(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Auth check
  isAuthenticated(): boolean {
    return !!localStorage.getItem("auth_token");
  },

  // Token getter
  getToken(): string | null {
    return localStorage.getItem("auth_token");
  },
};

export default authService;
