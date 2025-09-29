import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Edit, UserPlus, Shield, Eye, Users } from 'lucide-react';
import { AppRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '@/types/permissions';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  role: AppRole;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export const UserManagement = () => {
  const { canManageUsers, profile, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('user');
  
  // Edit form states
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (canManageUsers) {
      fetchUsers();
    }
  }, [canManageUsers]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update user role",
      });
    }
  };

  const handleAddUser = async () => {
    try {
      // Call our Edge Function instead of using admin API directly
      const response = await supabase.functions.invoke('create-admin-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          firstName: newUserFirstName,
          lastName: newUserLastName
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create user');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to create user');
      }

      await fetchUsers();
      setIsAddUserOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserRole('user');
      
      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create user",
      });
    }
  };

  const handleEditProfile = (user: UserProfile) => {
    setEditingUser(user);
    setEditFirstName(user.first_name || '');
    setEditLastName(user.last_name || '');
    setEditEmail(user.email);
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingUser) return;

    try {
      const response = await supabase.functions.invoke('update-user-profile', {
        body: {
          userId: editingUser.user_id,
          firstName: editFirstName,
          lastName: editLastName,
          email: editEmail,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update profile');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to update profile');
      }

      await fetchUsers();
      setIsEditProfileOpen(false);
      setEditingUser(null);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile",
      });
    }
  };

  const handleChangePassword = (user: UserProfile) => {
    setEditingUser(user);
    setNewPassword('');
    setCurrentPassword('');
    setIsChangePasswordOpen(true);
  };

  const handleUpdatePassword = async () => {
    if (!editingUser) return;

    try {
      const isOwnPassword = editingUser.user_id === profile?.user_id;
      
      const response = await supabase.functions.invoke('update-user-password', {
        body: {
          userId: editingUser.user_id,
          newPassword: newPassword,
          currentPassword: isOwnPassword && !isSuperAdmin ? currentPassword : undefined,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update password');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to update password');
      }

      setIsChangePasswordOpen(false);
      setEditingUser(null);
      setNewPassword('');
      setCurrentPassword('');
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update password",
      });
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'admin': return 'default';
      case 'game_manager': return 'secondary';
      case 'content_manager': return 'outline';
      case 'result_operator': return 'secondary';
      case 'viewer': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'super_admin': return <Shield className="h-4 w-4" />;
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'game_manager': return <Users className="h-4 w-4" />;
      case 'content_manager': return <Edit className="h-4 w-4" />;
      case 'result_operator': return <Edit className="h-4 w-4" />;
      case 'viewer': return <Eye className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>You don't have permission to manage users.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUserRole} onValueChange={(value: AppRole) => setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <SelectItem key={role} value={role}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role as AppRole)}
                          <div>
                            <div>{label}</div>
                            <div className="text-xs text-muted-foreground">
                              {ROLE_DESCRIPTIONS[role as AppRole]}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddUser} disabled={!newUserEmail || !newUserPassword}>
                  Create User
                </Button>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.first_name || user.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : 'No name set'
                    }
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {ROLE_LABELS[user.role]}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {(user.user_id === profile?.user_id || isSuperAdmin) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProfile(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChangePassword(user)}
                          >
                            Change Password
                          </Button>
                        </>
                      )}
                      {user.user_id !== profile?.user_id && isSuperAdmin && (
                        <Select
                          value={user.role}
                          onValueChange={(value: AppRole) => handleRoleChange(user.user_id, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABELS).map(([role, label]) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center gap-2">
                                  {getRoleIcon(role as AppRole)}
                                  {label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {user.user_id === profile?.user_id && (
                        <Badge variant="outline">You</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editFirstName">First Name</Label>
              <Input
                id="editFirstName"
                type="text"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div>
              <Label htmlFor="editLastName">Last Name</Label>
              <Input
                id="editLastName"
                type="text"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile}>
                Update Profile
              </Button>
              <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingUser?.user_id === profile?.user_id && !isSuperAdmin && (
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
            )}
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                minLength={8}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdatePassword}
                disabled={
                  !newPassword || 
                  newPassword.length < 8 ||
                  (editingUser?.user_id === profile?.user_id && !isSuperAdmin && !currentPassword)
                }
              >
                Change Password
              </Button>
              <Button variant="outline" onClick={() => setIsChangePasswordOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};