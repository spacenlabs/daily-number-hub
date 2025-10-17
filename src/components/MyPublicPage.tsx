import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGameAssignments } from '@/hooks/useGameAssignments';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, ExternalLink, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

const PUBLIC_DOMAIN = 'https://satta-game.online';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  public_username: string | null;
  is_active: boolean;
}

export const MyPublicPage = () => {
  const { user } = useAuth();
  const { getUserGames } = useGameAssignments();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isInEditor, setIsInEditor] = useState(false);

  useEffect(() => {
    // Detect if we're in the editor iframe
    try {
      setIsInEditor(window.self !== window.top && window.location.host.includes('lovable'));
    } catch (e) {
      // Cross-origin iframe access blocked
      setIsInEditor(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
      fetchUserGames();
    }
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // Auto-generate username if not exists
      if (data && !data.public_username) {
        await generateUsername(data);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserGames = async () => {
    if (!user?.id) return;
    const userGames = await getUserGames(user.id);
    setGames(userGames);
  };

  const generateUsername = async (currentProfile: UserProfile) => {
    setGenerating(true);
    try {
      // Generate base username from email
      const emailPrefix = currentProfile.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = emailPrefix;
      let attempt = 0;

      // Check for uniqueness and add numbers if needed
      while (attempt < 100) {
        const testUsername = attempt === 0 ? username : `${username}${attempt}`;
        
        const { data: existing } = await supabase
          .from('profiles')
          .select('public_username')
          .eq('public_username', testUsername)
          .maybeSingle();

        if (!existing) {
          username = testUsername;
          break;
        }
        attempt++;
      }

      // Update profile with generated username
      const { error } = await supabase
        .from('profiles')
        .update({ public_username: username })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile({ ...currentProfile, public_username: username });
      toast.success('Public username generated!');
    } catch (error: any) {
      console.error('Error generating username:', error);
      toast.error('Failed to generate username');
    } finally {
      setGenerating(false);
    }
  };

  const copyUrl = () => {
    if (profile?.public_username) {
      const url = `${PUBLIC_DOMAIN}/u/${profile.public_username}`;
      navigator.clipboard.writeText(url);
      toast.success('Full URL copied to clipboard!');
    }
  };

  const visitPage = () => {
    if (profile?.public_username) {
      const absoluteUrl = `${PUBLIC_DOMAIN}/u/${profile.public_username}`;
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
      toast.info('Opening your public page at satta-game.online');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-8">
          <p className="text-center text-muted-foreground">Unable to load profile</p>
        </CardContent>
      </Card>
    );
  }

  const shortUrl = profile.public_username ? `/u/${profile.public_username}` : null;
  const fullUrl = profile.public_username 
    ? `${PUBLIC_DOMAIN}/u/${profile.public_username}`
    : null;

  return (
    <div className="space-y-6">
      {isInEditor && (
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-sm">
            <strong>Editor Preview:</strong> You're in the editor. Public visitors won't see any login. 
            Click <strong>"Publish"</strong> in the top right to get your live public URL.
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Your Public Results Page</CardTitle>
          <CardDescription>
            Share this link with anyone to show your assigned games and results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generating ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating your public username...</span>
            </div>
          ) : shortUrl ? (
            <>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-primary/5">
                  <p className="text-sm font-medium mb-3">Your Public URL (Anyone can view - no login required)</p>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 p-3 bg-background border rounded text-sm break-all font-mono">
                      {fullUrl}
                    </code>
                    <Button onClick={copyUrl} variant="outline" size="icon" title="Copy URL">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={visitPage} className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Open Public Page
                  </Button>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    After you publish your site, anyone can view this page without logging in. Share this URL with your audience!
                  </AlertDescription>
                </Alert>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">No public username available</p>
          )}

          <div className="flex items-center gap-4 pt-4 border-t">
            <div>
              <span className="text-sm text-muted-foreground">Status: </span>
              {profile.is_active ? (
                <Badge variant="default" className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="destructive">Inactive</Badge>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Assigned Games: </span>
              <Badge variant="secondary">{games.length}</Badge>
            </div>
          </div>

          {!profile.is_active && (
            <p className="text-sm text-muted-foreground">
              Your page is currently inactive. Contact an administrator to activate it.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Assigned Games</CardTitle>
          <CardDescription>
            These games will appear on your public page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {games.length === 0 ? (
            <p className="text-muted-foreground">No games assigned yet</p>
          ) : (
            <div className="space-y-2">
              {games.map((game: any) => (
                <div key={game.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium">{game.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Today: {game.today_result ?? '---'} | Yesterday: {game.yesterday_result ?? '---'}
                    </p>
                  </div>
                  <Badge variant={game.status === 'published' ? 'default' : 'secondary'}>
                    {game.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
