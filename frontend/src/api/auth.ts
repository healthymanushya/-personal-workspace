import { apiRequest } from "./client";
import type { TokenResponse, User } from "../types/user";

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
}

export function register(email: string, password: string, full_name?: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password, full_name },
    skipAuth: true,
  });
}

export function me(): Promise<User> {
  return apiRequest<User>("/api/auth/me");
}
