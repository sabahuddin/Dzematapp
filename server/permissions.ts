import { User, WorkGroupMember } from "@shared/schema";

export type UserRole = "admin" | "clan_io" | "clan" | "clan_porodice";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  clan_io: "Član IO",
  clan: "Član",
  clan_porodice: "Član porodice"
};

export function hasRole(user: User, role: UserRole): boolean {
  if (user.isAdmin && role === "admin") return true;
  
  if (!user.roles || user.roles.length === 0) return false;
  
  return user.roles.includes(role);
}

export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  return roles.some(role => hasRole(user, role));
}

export function isAdmin(user: User): boolean {
  return user.isAdmin || hasRole(user, "admin");
}

export function isClanIO(user: User): boolean {
  return hasRole(user, "clan_io");
}

export function isClan(user: User): boolean {
  return hasRole(user, "clan");
}

export function isClanPorodice(user: User): boolean {
  return hasRole(user, "clan_porodice");
}

export interface PermissionContext {
  user: User;
  workGroupId?: string;
  isWorkGroupModerator?: boolean;
}

export const Permissions = {
  canManageUsers(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canCreateWorkGroup(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canDeleteWorkGroup(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canViewAllWorkGroups(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user) || isClanIO(ctx.user);
  },

  canCreateAnnouncement(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canEditAnnouncement(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canDeleteAnnouncement(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canCreateEvent(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canEditEvent(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canDeleteEvent(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  },

  canManageWorkGroupMembers(ctx: PermissionContext): boolean {
    if (isAdmin(ctx.user)) return true;
    
    if (ctx.isWorkGroupModerator) return true;
    
    return false;
  },

  canCreateTask(ctx: PermissionContext): boolean {
    if (isAdmin(ctx.user)) return true;
    
    if (ctx.isWorkGroupModerator) return true;
    
    return false;
  },

  canEditTask(ctx: PermissionContext): boolean {
    if (isAdmin(ctx.user)) return true;
    
    if (ctx.isWorkGroupModerator) return true;
    
    return false;
  },

  canDeleteTask(ctx: PermissionContext): boolean {
    if (isAdmin(ctx.user)) return true;
    
    if (ctx.isWorkGroupModerator) return true;
    
    return false;
  },

  canCommentOnTask(ctx: PermissionContext): boolean {
    return true;
  },

  canMarkTaskComplete(ctx: PermissionContext): boolean {
    return true;
  },

  canAssignRoles(ctx: PermissionContext): boolean {
    return isAdmin(ctx.user);
  }
};
