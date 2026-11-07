import { apiRequest, PublicUser } from "./api-client";

export type AuthUser = PublicUser;

export async function getCurrentUser() {
  const result = await apiRequest<{ user: AuthUser | null }>("/api/auth");
  return result.user;
}

export async function registerUser(name: string, email: string, password: string) {
  try {
    const result = await apiRequest<{ user: AuthUser }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "register", name, email, password }),
    });
    return { success: true as const, message: `Welcome ${result.user.name}! Your account is ready.`, user: result.user };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Unable to create your account." };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    const result = await apiRequest<{ user: AuthUser }>("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "login", email, password }),
    });
    return { success: true as const, message: `Welcome back, ${result.user.name}!`, user: result.user };
  } catch (error) {
    return { success: false as const, message: error instanceof Error ? error.message : "Unable to sign in." };
  }
}

export async function logoutUser() {
  await apiRequest("/api/auth", { method: "POST", body: JSON.stringify({ action: "logout" }) });
}
