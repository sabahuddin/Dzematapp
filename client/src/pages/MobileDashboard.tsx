import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type ActivityFeedItem, type PrayerTime } from '@shared/schema';
import CompactPrayerTimes from '../components/CompactPrayerTimes';
import {
  ArrowForward,
  PersonAdd,
  CheckCircle,
  Store,
  EmojiEvents,
  Article,
  Event,
  CardGiftcard,
  NotificationsActive,
  Videocam,
  CalendarMonth
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function MobileDashboard() {
  const [, setLocation] = useLocation();

  const { data: prayerTime, isLoading: prayerLoading } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
    retry: false,
  });

  const { data: feedItems = [], isLoading: feedLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/activity-feed'],
    refetchInterval: 30000,
  });

  const getIcon = (type: string) => {
    const iconProps = { fontSize: 'medium' as const };
    switch (type) {
      case 'new_member': return <PersonAdd {...iconProps} />;
      case 'project_completed': return <CheckCircle {...iconProps} />;
      case 'shop_item': return <Store {...iconProps} />;
      case 'badge_awarded': return <EmojiEvents {...iconProps} />;
      case 'certificate_issued': return <CardGiftcard {...iconProps} />;
      case 'announcement': return <Article {...iconProps} />;
      case 'event': return <Event {...iconProps} />;
      case 'important_date_reminder': return <NotificationsActive {...iconProps} />;
      case 'media': return <Videocam {...iconProps} />;
      default: return <CalendarMonth {...iconProps} />;
    }
  };

  const getTypeColor = (type: string, isClickable: boolean) => {
    if (isClickable) {
      return { bg: '#ffffff', iconColor: 'hsl(123 46% 54%)', borderColor: 'var(--semantic-success-border)' };
    }
    
    switch (type) {
      case 'new_member': return { bg: 'var(--semantic-info-bg)', iconColor: 'var(--semantic-info-text)', borderColor: 'var(--semantic-info-border)' };
      case 'badge_awarded': return { bg: 'var(--semantic-award-bg)', iconColor: 'var(--semantic-award-text)', borderColor: 'var(--semantic-award-border)' };
      case 'certificate_issued': return { bg: 'var(--semantic-celebration-bg)', iconColor: 'var(--semantic-celebration-text)', borderColor: 'var(--semantic-celebration-border)' };
      case 'shop_item': return { bg: 'var(--semantic-success-bg)', iconColor: 'var(--semantic-success-text)', borderColor: 'var(--semantic-success-border)' };
      default: return { bg: 'var(--semantic-neutral-bg)', iconColor: 'text.secondary', borderColor: 'var(--semantic-neutral-border)' };
    }
  };

  const handleItemClick = (item: ActivityFeedItem) => {
    if (!item.isClickable) return;

    switch (item.relatedEntityType) {
      case 'announcement': setLocation('/announcements'); break;
      case 'event': setLocation('/events'); break;
      case 'project': setLocation('/projects'); break;
      case 'media': setLocation('/livestream-settings'); break;
    }
  };

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  if (prayerLoading || feedLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get latest 5 feed items
  const latestFeed = feedItems.slice(0, 5);

  return (
    <Box>
      {/* Compact Prayer Times */}
      {prayerTime && <CompactPrayerTimes prayerTime={prayerTime} />}

      {/* Feed Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'hsl(123 46% 34%)' }}>
        Feed
      </Typography>

      {latestFeed.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Nema aktivnosti
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {latestFeed.map((item) => {
            const colors = getTypeColor(item.type, item.isClickable);
            
            return (
              <Card
                key={item.id}
                onClick={() => handleItemClick(item)}
                data-testid={`feed-item-${item.id}`}
                sx={{
                  cursor: item.isClickable ? 'pointer' : 'default',
                  bgcolor: colors.bg,
                  border: `2px solid ${colors.borderColor}`,
                  transition: 'all 0.2s ease',
                  ...(item.isClickable && {
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 16px rgba(18, 94, 48, 0.15)',
                    },
                  }),
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ color: colors.iconColor, flexShrink: 0 }}>
                      {getIcon(item.type)}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: item.isClickable ? 'hsl(123 46% 34%)' : 'text.primary',
                          mb: 0.5,
                        }}
                      >
                        {item.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
                    {item.isClickable && (
                      <ArrowForward sx={{ color: 'hsl(123 46% 54%)', fontSize: 20 }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
