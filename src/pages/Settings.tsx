import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from '@/components/settings/ProfileTab';
import { LifestyleTab } from '@/components/settings/LifestyleTab';
import { TasteTab } from '@/components/settings/TasteTab';
import { ModulesTab } from '@/components/settings/ModulesTab';
import { ThemesTab } from '@/components/settings/ThemesTab';
import { PulseAITab } from '@/components/settings/PulseAITab';
import { NotificationsTab } from '@/components/settings/NotificationsTab';
import { Loader2, User, MapPin, Heart, LayoutGrid, Palette, Sparkles, Bell } from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Customize your PulseOS experience</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto gap-1 bg-secondary/50 p-1">
            <TabsTrigger value="profile" className="flex items-center gap-2 py-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="flex items-center gap-2 py-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Lifestyle</span>
            </TabsTrigger>
            <TabsTrigger value="taste" className="flex items-center gap-2 py-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Taste</span>
            </TabsTrigger>
            <TabsTrigger value="modules" className="flex items-center gap-2 py-2">
              <LayoutGrid className="h-4 w-4" />
              <span className="hidden sm:inline">Modules</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2 py-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Themes</span>
            </TabsTrigger>
            <TabsTrigger value="pulseai" className="flex items-center gap-2 py-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">PulseAI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="lifestyle">
            <LifestyleTab />
          </TabsContent>
          <TabsContent value="taste">
            <TasteTab />
          </TabsContent>
          <TabsContent value="modules">
            <ModulesTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="themes">
            <ThemesTab />
          </TabsContent>
          <TabsContent value="pulseai">
            <PulseAITab />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
