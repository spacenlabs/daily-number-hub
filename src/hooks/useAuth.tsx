import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Permission, UserPermission, ROLE_HIERARCHY } from '@/types/permissions';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  permissions: UserPermission[];
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
  hasRoleOrHigher: (role: AppRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  canManageUsers: boolean;
  canManageGames: boolean;
  canManageResults: boolean;
  canManageContent: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const fetchUserPermissions = async (userId: string): Promise<UserPermission[]> => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .is('expires_at', null)
        .or(`expires_at.gt.${new Date().toISOString()}`);

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return (data || []) as UserPermission[];
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile and permissions when user logs in
        if (session?.user) {
          setTimeout(async () => {
            const [userProfile, userPermissions] = await Promise.all([
              fetchProfile(session.user.id),
              fetchUserPermissions(session.user.id)
            ]);
            setProfile(userProfile);
            setPermissions(userPermissions);
            setLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setPermissions([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(async () => {
          const [userProfile, userPermissions] = await Promise.all([
            fetchProfile(session.user.id),
            fetchUserPermissions(session.user.id)
          ]);
          setProfile(userProfile);
          setPermissions(userPermissions);
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Role and permission checking functions
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = profile?.role === 'super_admin';

  const hasRole = (role: AppRole): boolean => {
    return profile?.role === role;
  };

  const hasRoleOrHigher = (role: AppRole): boolean => {
    if (!profile?.role) return false;
    return ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[role];
  };

  const hasPermission = (permission: Permission): boolean => {
    return permissions.some(p => p.permission === permission);
  };

  // Convenience permission checks
  const canManageUsers = hasPermission('manage_users');
  const canManageGames = hasPermission('manage_games');
  const canManageResults = hasPermission('manage_results');
  const canManageContent = hasPermission('manage_content');
  const canViewAnalytics = hasPermission('view_analytics');
  const canManageSettings = hasPermission('manage_settings');

  const value = {
    user,
    session,
    profile,
    permissions,
    loading,
    isAdmin,
    isSuperAdmin,
    hasRole,
    hasRoleOrHigher,
    hasPermission,
    canManageUsers,
    canManageGames,
    canManageResults,
    canManageContent,
    canViewAnalytics,
    canManageSettings,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};