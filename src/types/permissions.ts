export type AppRole = 'super_admin' | 'admin' | 'game_manager' | 'content_manager' | 'result_operator' | 'viewer' | 'user';

export type Permission = 
  | 'manage_users'
  | 'manage_games'
  | 'manage_results'
  | 'manage_content'
  | 'view_analytics'
  | 'manage_settings';

export interface UserPermission {
  id: string;
  user_id: string;
  permission: Permission;
  granted_by?: string;
  granted_at: string;
  expires_at?: string;
  created_at: string;
}

export const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 6,
  admin: 5,
  game_manager: 4,
  content_manager: 3,
  result_operator: 2,
  viewer: 1,
  user: 0,
};

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  game_manager: 'Game Manager',
  content_manager: 'Content Manager',
  result_operator: 'Result Operator',
  viewer: 'Viewer',
  user: 'User',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  super_admin: 'Full system access including user management and system settings',
  admin: 'Manage games, results, content, and view analytics',
  game_manager: 'Manage games and results, view analytics',
  content_manager: 'Manage website content and view analytics',
  result_operator: 'Update game results only',
  viewer: 'Read-only access to analytics and dashboard',
  user: 'Basic user access',
};

export const DEFAULT_ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  super_admin: ['manage_users', 'manage_games', 'manage_results', 'manage_content', 'view_analytics', 'manage_settings'],
  admin: ['manage_games', 'manage_results', 'manage_content', 'view_analytics'],
  game_manager: ['manage_games', 'manage_results', 'view_analytics'],
  content_manager: ['manage_content', 'view_analytics'],
  result_operator: ['manage_results'],
  viewer: ['view_analytics'],
  user: [],
};