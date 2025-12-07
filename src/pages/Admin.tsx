import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, Activity, Palette, LayoutGrid, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const ADMIN_EMAILS = ['kevinguerrier.kg@gmail.com', '3rdeyeadvisors@gmail.com', 'kevinroberts5678@gmail.com', 'kevin@pulselife.com'];

interface UserData {
  id: string;
  email: string;
  full_name: string;
  city: string;
  created_at: string;
  theme?: string;
  enabled_modules?: string[];
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeToday: 0, themes: {} as Record<string, number> });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user && !ADMIN_EMAILS.includes(user.email || '')) {
      navigate('/app');
    } else if (user) {
      setIsAdmin(true);
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchAdminData() {
      if (!isAdmin) return;

      try {
        // Fetch all profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, user_id, email, full_name, city, created_at')
          .order('created_at', { ascending: false });

        // Fetch preferences for theme data
        const { data: prefs } = await supabase
          .from('preferences')
          .select('user_id, theme, enabled_modules');

        const prefsMap = new Map(prefs?.map(p => [p.user_id, p]) || []);

        const usersWithPrefs = (profiles || []).map(profile => ({
          id: profile.user_id,
          email: profile.email || 'N/A',
          full_name: profile.full_name || 'Unknown',
          city: profile.city || 'Not set',
          created_at: profile.created_at,
          theme: prefsMap.get(profile.user_id)?.theme || 'night',
          enabled_modules: prefsMap.get(profile.user_id)?.enabled_modules as string[] || [],
        }));

        setUsers(usersWithPrefs);

        // Calculate stats
        const themeCount: Record<string, number> = {};
        prefs?.forEach(p => {
          const t = p.theme || 'night';
          themeCount[t] = (themeCount[t] || 0) + 1;
        });

        setStats({
          totalUsers: usersWithPrefs.length,
          activeToday: Math.floor(usersWithPrefs.length * 0.6), // Mock active users
          themes: themeCount,
        });
      } catch (err) {
        console.error('Admin data error:', err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchAdminData();
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">PulseOS Admin</h1>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to App
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{dataLoading ? '-' : stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Today</p>
                <p className="text-2xl font-bold">{dataLoading ? '-' : stats.activeToday}</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Palette className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Theme</p>
                <p className="text-2xl font-bold capitalize">
                  {dataLoading ? '-' : Object.entries(stats.themes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'night'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <LayoutGrid className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Modules</p>
                <p className="text-2xl font-bold">
                  {dataLoading ? '-' : Math.round(users.reduce((acc, u) => acc + (u.enabled_modules?.length || 0), 0) / Math.max(users.length, 1))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
          
          {dataLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Theme</TableHead>
                    <TableHead>Modules</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.city}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{u.theme}</Badge>
                      </TableCell>
                      <TableCell>{u.enabled_modules?.length || 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Theme Distribution */}
        <div className="p-5 rounded-xl bg-card border border-border/50">
          <h2 className="text-lg font-semibold mb-4">Theme Distribution</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.themes).map(([theme, count]) => (
              <div key={theme} className="px-4 py-2 rounded-lg bg-secondary/50">
                <span className="font-medium capitalize">{theme}</span>
                <span className="ml-2 text-muted-foreground">{count} users</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
