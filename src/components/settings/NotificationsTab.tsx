import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';

interface EmailPreferences {
  welcome_email: boolean;
  daily_digest: boolean;
  event_reminders: boolean;
  task_reminders: boolean;
  marketing_emails: boolean;
}

export function NotificationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { createNotification, sendWelcomeEmail } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    welcome_email: true,
    daily_digest: true,
    event_reminders: true,
    task_reminders: true,
    marketing_emails: false,
  });

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('email_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email preferences:', error);
    } else if (data) {
      setPreferences({
        welcome_email: data.welcome_email,
        daily_digest: data.daily_digest,
        event_reminders: data.event_reminders,
        task_reminders: data.task_reminders,
        marketing_emails: data.marketing_emails,
      });
    }
    setLoading(false);
  };

  const updatePreference = async (key: keyof EmailPreferences, value: boolean) => {
    if (!user) return;

    setPreferences((prev) => ({ ...prev, [key]: value }));

    const { error } = await supabase
      .from('email_preferences')
      .update({ [key]: value })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Error',
        description: 'Failed to update preference',
        variant: 'destructive',
      });
      // Revert on error
      setPreferences((prev) => ({ ...prev, [key]: !value }));
    }
  };

  const sendTestNotification = async () => {
    setSaving(true);
    const result = await createNotification(
      'system',
      '🧪 Test Notification',
      'This is a test notification to verify your notification system is working correctly!'
    );

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Test notification sent! Check your notification bell.',
      });
    }
    setSaving(false);
  };

  const sendTestEmail = async () => {
    if (!user?.email) return;

    setSaving(true);
    
    // Get user's full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    const result = await sendWelcomeEmail(user.email, profile?.full_name);

    if (result.error) {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email Sent',
        description: 'Check your inbox for the test email!',
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-48 bg-muted rounded" />
            <div className="h-4 w-64 bg-muted rounded mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose which emails you'd like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="welcome">Welcome Email</Label>
              <p className="text-sm text-muted-foreground">
                Receive a welcome email when you sign up
              </p>
            </div>
            <Switch
              id="welcome"
              checked={preferences.welcome_email}
              onCheckedChange={(checked) => updatePreference('welcome_email', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="digest">Daily Digest</Label>
              <p className="text-sm text-muted-foreground">
                Get a daily summary of weather, tasks, and recommendations
              </p>
            </div>
            <Switch
              id="digest"
              checked={preferences.daily_digest}
              onCheckedChange={(checked) => updatePreference('daily_digest', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="events">Event Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming events near you
              </p>
            </div>
            <Switch
              id="events"
              checked={preferences.event_reminders}
              onCheckedChange={(checked) => updatePreference('event_reminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="tasks">Task Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded about tasks that are due soon
              </p>
            </div>
            <Switch
              id="tasks"
              checked={preferences.task_reminders}
              onCheckedChange={(checked) => updatePreference('task_reminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Product Updates</Label>
              <p className="text-sm text-muted-foreground">
                Hear about new features and improvements
              </p>
            </div>
            <Switch
              id="marketing"
              checked={preferences.marketing_emails}
              onCheckedChange={(checked) => updatePreference('marketing_emails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            In-App Notifications
          </CardTitle>
          <CardDescription>
            Test your notification system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={sendTestNotification}
              disabled={saving}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
            <Button
              variant="outline"
              onClick={sendTestEmail}
              disabled={saving}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Test Email
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Use these buttons to verify your notification setup is working correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
