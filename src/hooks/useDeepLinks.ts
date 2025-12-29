import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';

export function useDeepLinks() {
  const navigate = useNavigate();

  const handleDeepLink = useCallback((url: string) => {
    console.log('Deep link received:', url);

    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const searchParams = urlObj.searchParams;

      // Handle different deep link patterns
      
      // App routes
      if (path.startsWith('/app/')) {
        navigate(path);
        return;
      }

      // Password reset
      if (path === '/reset-password' || path.includes('reset-password')) {
        const token = searchParams.get('token');
        if (token) {
          navigate(`/reset-password?token=${token}`);
        } else {
          navigate('/reset-password');
        }
        return;
      }

      // Task invite
      if (path.startsWith('/task/invite/') || path.includes('task-invite')) {
        const taskId = path.split('/').pop() || searchParams.get('id');
        if (taskId) {
          // Navigate to Today page where task invites are handled
          navigate('/app/today', { state: { taskInviteId: taskId } });
        }
        return;
      }

      // Activity invite
      if (path.startsWith('/activity/invite/') || path.includes('activity-invite')) {
        const activityId = path.split('/').pop() || searchParams.get('id');
        if (activityId) {
          // Navigate to Friends page where activity invites are handled
          navigate('/app/friends', { state: { activityInviteId: activityId } });
        }
        return;
      }

      // Friend request
      if (path.startsWith('/friend/') || path.includes('friend-request')) {
        navigate('/app/friends');
        return;
      }

      // Auth callback (for OAuth)
      if (path === '/auth' || path.includes('auth/callback')) {
        navigate('/auth');
        return;
      }

      // Default: try to navigate to the path
      if (path && path !== '/') {
        navigate(path);
      }

    } catch (err) {
      console.error('Error handling deep link:', err);
    }
  }, [navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // Handle app opened with URL (cold start)
    App.getLaunchUrl().then((urlOpen) => {
      if (urlOpen?.url) {
        handleDeepLink(urlOpen.url);
      }
    });

    // Handle URL open while app is running (warm start)
    const listener = App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      handleDeepLink(event.url);
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, [handleDeepLink]);

  return {
    handleDeepLink,
  };
}
