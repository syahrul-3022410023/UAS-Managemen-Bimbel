export const roles = ["admin", "mentor", "parent"] as const;

export type UserRole = (typeof roles)[number];

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  mentor: "Mentor",
  parent: "Orang Tua"
};

export const roleHomePath = (role: UserRole) => {
  const paths: Record<UserRole, string> = {
    admin: "/admin/dashboard",
    mentor: "/mentor/dashboard",
    parent: "/orang-tua/dashboard"
  };

  return paths[role];
};

export const routeRoleMap: Array<{ prefix: string; roles: UserRole[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/mentor", roles: ["mentor"] },
  { prefix: "/orang-tua", roles: ["parent"] }
];

export const normalizeRole = (value: unknown): UserRole | null => {
  if (typeof value !== "string") {
    return null;
  }

  return roles.includes(value as UserRole) ? (value as UserRole) : null;
};
