export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

const USERS_KEY = "minddock-users";
const CURRENT_USER_KEY = "minddock-current-user";

function getStoredUsers(): AuthUser[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(USERS_KEY);
    return stored ? (JSON.parse(stored) as AuthUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;

  if (user) {
    window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(CURRENT_USER_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function registerUser(name: string, email: string, password: string) {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = users.find((user) => user.email.toLowerCase() === normalizedEmail);
  if (existing) {
    return {
      success: false as const,
      message: "An account with this email already exists.",
    };
  }

  const newUser: AuthUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
  };

  const nextUsers = [newUser, ...users];
  saveUsers(nextUsers);
  saveCurrentUser(newUser);

  return {
    success: true as const,
    message: `Welcome ${newUser.name}! Your account is ready.`,
    user: newUser,
  };
}

export function loginUser(email: string, password: string) {
  const users = getStoredUsers();
  const normalizedEmail = email.trim().toLowerCase();

  const match = users.find(
    (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
  );

  if (!match) {
    return {
      success: false as const,
      message: "Invalid email or password.",
    };
  }

  saveCurrentUser(match);

  return {
    success: true as const,
    message: `Welcome back, ${match.name}!`,
    user: match,
  };
}

export function logoutUser() {
  saveCurrentUser(null);
}
