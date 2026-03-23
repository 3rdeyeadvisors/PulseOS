import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

export function usePushNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const registerToken = useCallback(async (token: string, platform: 'ios' | 'android') => {
    if (!user) return;

    try {
      // Upsert the token - update if exists, insert if not
      const { error } = await supabase
        .from('push_tokens')
        .upsert(
          {
            user_id: user.id,
            token,
            platform,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,token',
          }
        );

      if (error) {
        console.error('Error registering push token:', error);
      } else {
        console.log('Push token registered successfully');
      }
    } catch (err: unknown) {
      console.error('Failed to register push token:', getErrorMessage(err));
    }
  }, [user]);

  const removeToken = useCallback(async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', token);

      if (error) {
        console.error('Error removing push token:', error);
      }
    } catch (err: unknown) {
      console.error('Failed to remove push token:', getErrorMessage(err));
    }
  }, [user]);

  const handleNotificationAction = useCallback((notification: PushNotificationSchema) => {
    const data = notification.data as Record<string, unknown> | undefined;
    
    if (!data) return;

    // Route based on notification data
    if (data['route']) {
      navigate(data['route'] as string);
    } else if (data['type'] === 'task_invite' || data['taskId']) {
      navigate('/app/today');
    } else if (data['type'] === 'activity_invite' || data['activityId']) {
      navigate('/app/friends');
    } else if (data['type'] === 'friend_request' || data['senderId']) {
      navigate('/app/friends');
    } else if (data['type'] === 'daily_digest') {
      navigate('/app/today');
    } else if (data['type'] === 'event_reminder') {
      navigate('/app/out-and-about');
    }
  }, [navigate]);

  const requestPermissions = useCallback(async () => {
    if (!isNative) {
      console.log('Push notifications only available on native platforms');
      return false;
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setPermissionStatus('denied');
        console.log('Push notification permission denied');
        return false;
      }

      setPermissionStatus('granted');
      return true;
    } catch (err: unknown) {
      console.error('Error requesting push permissions:', getErrorMessage(err));
      return false;
    }
  }, [isNative]);

  const initializePushNotifications = useCallback(async () => {
    if (!isNative || !user) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      // Register with APNs/FCM
      await PushNotifications.register();

      // Listener for registration success
      PushNotifications.addListener('registration', async (token: Token) => {
        console.log('Push registration success, token:', token.value);
        const platform = Capacitor.getPlatform() as 'ios' | 'android';
        await registerToken(token.value, platform);
      });

      // Listener for registration errors
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
      });

      // Listener for received notifications (foreground)
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        // Show a toast for foreground notifications
        toast(notification.title || 'Notification', {
          description: notification.body,
        });
      });

      // Listener for notification tap actions
      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Push notification action performed:', action);
        handleNotificationAction(action.notification);
      });

    } catch (err: unknown) {
      console.error('Error initializing push notifications:', getErrorMessage(err));
    }
  }, [isNative, user, requestPermissions, registerToken, handleNotificationAction]);

  // Initialize on mount when user is authenticated
  useEffect(() => {
    if (user && isNative) {
      initializePushNotifications();
    }

    return () => {
      if (isNative) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [user, isNative, initializePushNotifications]);

  return {
    permissionStatus,
    isNative,
    requestPermissions,
    initializePushNotifications,
    removeToken,
  };
}
