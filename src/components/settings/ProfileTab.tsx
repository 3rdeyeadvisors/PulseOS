import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Save, Upload, User, AtSign, Globe, Eye, Check, X, BadgeCheck, Trash2, AlertTriangle } from 'lucide-react';

export function ProfileTab() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [interestsPublic, setInterestsPublic] = useState(false);
  const [profilePublic, setProfilePublic] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, username, interests_public, profile_public, verified')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setEmail(data.email || user.email || '');
        setAvatarUrl(data.avatar_url);
        setUsername(data.username || '');
        setOriginalUsername(data.username);
        setInterestsPublic(data.interests_public || false);
        setProfilePublic(data.profile_public || false);
        setVerified(data.verified || false);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  // Validate username format
  const validateUsername = (value: string): string | null => {
    if (!value) return null; // Empty is OK, just means no username
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 20) return 'Username must be 20 characters or less';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores allowed';
    if (/^[0-9]/.test(value)) return 'Username cannot start with a number';
    return null;
  };

  // Check username availability
  useEffect(() => {
    if (!username || username === originalUsername) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      setUsernameAvailable(null);
      return;
    }

    setUsernameError(null);
    setCheckingUsername(true);

    const timeoutId = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .neq('user_id', user?.id || '')
        .maybeSingle();

      setUsernameAvailable(data === null);
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, originalUsername, user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrlWithCacheBust })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(avatarUrlWithCacheBust);
      toast.success('Avatar updated');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate username if changed
    if (username && username !== originalUsername) {
      const validationError = validateUsername(username);
      if (validationError) {
        toast.error(validationError);
        return;
      }
      if (usernameAvailable === false) {
        toast.error('Username is not available');
        return;
      }
    }

    setSaving(true);

    const updateData: Record<string, any> = {
      full_name: fullName,
      interests_public: interestsPublic,
      profile_public: profilePublic,
    };

    // Only update username if it changed
    if (username !== originalUsername) {
      updateData.username = username ? username.toLowerCase() : null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (error) {
      if (error.code === '23505') {
        toast.error('Username is already taken');
      } else {
        toast.error('Failed to save profile');
      }
    } else {
      toast.success('Profile saved');
      setOriginalUsername(username ? username.toLowerCase() : null);
    }
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    
    const { error } = await deleteAccount();
    
    if (error) {
      toast.error(error.message || 'Failed to delete account');
      setDeleting(false);
    } else {
      toast.success('Your account has been deleted');
      setDeleteDialogOpen(false);
      navigate('/');
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.[0]?.toUpperCase() || 'U';
  };

  const getUsernameStatusIcon = () => {
    if (checkingUsername) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (usernameError || usernameAvailable === false) return <X className="h-4 w-4 text-destructive" />;
    if (usernameAvailable === true) return <Check className="h-4 w-4 text-green-500" />;
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-border">
                <AvatarImage src={avatarUrl || undefined} alt={fullName || 'Profile'} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {verified && (
                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                  <BadgeCheck className="h-6 w-6 text-primary fill-primary/20" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              <span className="flex items-center gap-2">
                <AtSign className="h-4 w-4" />
                Username
              </span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                placeholder="your_username"
                className="pl-8 pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {getUsernameStatusIcon()}
              </span>
            </div>
            {usernameError && (
              <p className="text-xs text-destructive">{usernameError}</p>
            )}
            {!usernameError && usernameAvailable === true && (
              <p className="text-xs text-green-500">Username is available!</p>
            )}
            {!usernameError && usernameAvailable === false && (
              <p className="text-xs text-destructive">Username is already taken</p>
            )}
            <p className="text-xs text-muted-foreground">
              Used for the community section. 3-20 characters, letters, numbers, and underscores only.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button onClick={handleSave} disabled={saving || checkingUsername}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>Control what others can see about you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="interests-public" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Make Interests Public
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow others to see your interests and preferences
              </p>
            </div>
            <Switch
              id="interests-public"
              checked={interestsPublic}
              onCheckedChange={setInterestsPublic}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="profile-public" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Discoverable in Community
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow users in your city to find you in the community section
              </p>
            </div>
            <Switch
              id="profile-public"
              checked={profilePublic}
              onCheckedChange={setProfilePublic}
            />
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Note:</strong> Your exact location (address, zip code) is always private. 
            Only your city will be shown if you enable community discovery.
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Your Account?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-4">
                    <p>
                      This action is <strong>permanent and cannot be undone</strong>. All your data will be deleted, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Your profile and preferences</li>
                      <li>All tasks and chat history</li>
                      <li>Friend connections and invites</li>
                      <li>Leaderboard entries and streaks</li>
                      <li>All notifications and email preferences</li>
                    </ul>
                    <div className="pt-4">
                      <Label htmlFor="delete-confirm" className="text-foreground font-medium">
                        Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> to confirm:
                      </Label>
                      <Input
                        id="delete-confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                        placeholder="Type DELETE"
                        className="mt-2"
                        autoComplete="off"
                      />
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    Cancel
                  </AlertDialogCancel>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete My Account
                      </>
                    )}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
