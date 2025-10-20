import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

type ViewType = 'shop' | 'events' | 'announcements' | 'imamQuestions' | 'tasks';

export function useMarkAsViewed(type: ViewType) {
  const { user } = useAuth();

  const markViewedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', `/api/notifications/mark-viewed/${type}`, {});
    },
    onSuccess: () => {
      // Invalidate notifications count to refresh badges
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread'] });
    },
  });

  useEffect(() => {
    // Mark as viewed when component mounts (user visits the page)
    if (user) {
      markViewedMutation.mutate();
    }
  }, []);
}
