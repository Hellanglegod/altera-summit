// Admin authentication configuration

// This is the obfuscated route for the admin portal
export const ADMIN_ROUTE = process.env.ADMIN_ROUTE || "stellar-gateway-x7k2m9";

// Allowed admin roles
export const ALLOWED_ROLES = ["super_admin", "director_registrations", "committee_director"] as const;
export type AdminRole = (typeof ALLOWED_ROLES)[number];

// Session configuration
export const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds

// Protected paths - these require admin authentication
export const PROTECTED_PATHS = [
  "/dashboard",
  "/applications",
  "/committees",
  "/secretariat",
  "/settings",
  "/profile",
];

// Public paths (accessible without admin authentication)
export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/reset-password",
  "/forgot-password",
];

// Function to check if a path requires authentication
export function requiresAuth(path: string): boolean {
  return PROTECTED_PATHS.some(
    (protectedPath) =>
      path === protectedPath || path.startsWith(`${protectedPath}/`)
  );
}

// Function to check if user has required role
export function hasRequiredRole(userRole: string | undefined, requiredRole: AdminRole): boolean {
  if (!userRole) return false;
  return userRole === "super_admin" || userRole === requiredRole;
}