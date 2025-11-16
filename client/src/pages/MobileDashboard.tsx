import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type ActivityFeedItem, type PrayerTime } from '@shared/schema';
import CompactPrayerTimes from '../components/CompactPrayerTimes';
import FeedSlideshow from '../components/FeedSlideshow';
import { ArrowForward } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

export default function MobileDashboard() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation(['dashboard', 'common']);

  const { data: prayerTime, isLoading: prayerLoading, error: prayerError } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
    retry: false,
  });

  const { data: feedItems = [], isLoading: feedLoading, error: feedError } = useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/activity-feed'],
    refetchInterval: 30000,
  });

  // Get user-specific activities
  const { data: userActivities = [], isLoading: userActivitiesLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/activity-feed'],
    refetchInterval: 30000,
    select: (data) => {
      // Filter for user-relevant items (announcements, events, shop, tasks, messages, important dates, media)
      return data
        .filter(item => 
          item.type === 'announcement' || 
          item.type === 'event' || 
          item.type === 'shop_item' ||
          item.type === 'important_date_reminder' ||
          item.type === 'media' ||
          item.type === 'task' ||
          item.type === 'message'
        )
        .slice(0, 5);
    },
  });

  const handleItemClick = (item: ActivityFeedItem) => {
    if (!item.isClickable) return;

    switch (item.relatedEntityType) {
      case 'announcement': setLocation('/announcements'); break;
      case 'event': setLocation('/events'); break;
      case 'project': setLocation('/projects'); break;
      case 'media': setLocation('/media'); break;
      case 'shop_item': setLocation('/shop'); break;
      case 'badge': setLocation('/badges'); break;
      case 'certificate': setLocation('/certificates'); break;
      case 'user': setLocation('/users'); break;
      case 'task': setLocation('/tasks'); break;
      case 'message': setLocation('/messages'); break;
      case 'important_date_reminder': setLocation('/events'); break; // Important dates shown in events
      default: break;
    }
  };

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  return (
    <Box>
      {/* Compact Prayer Times */}
      {prayerLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {prayerError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('dashboard:errors.prayerTimesFailed', 'Nije moguće učitati vaktiju')}
        </Alert>
      )}
      {prayerTime && <CompactPrayerTimes prayerTime={prayerTime} />}

      {/* Feed Slideshow */}
      {feedLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {feedError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('dashboard:errors.feedFailed', 'Nije moguće učitati aktivnosti')}
        </Alert>
      )}

      {!feedLoading && !feedError && feedItems.length > 0 && (
        <FeedSlideshow items={feedItems} />
      )}

      {/* User-specific activities */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('dashboard:myActivities', 'Moje aktivnosti')}
      </Typography>

      {userActivitiesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {!userActivitiesLoading && userActivities.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('dashboard:feed.empty', 'Nema aktivnosti')}
        </Typography>
      )}

      {!userActivitiesLoading && userActivities.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {userActivities.map((item) => (
            <Card
              key={item.id}
              onClick={() => handleItemClick(item)}
              data-testid={`user-activity-${item.id}`}
              sx={{
                cursor: item.isClickable ? 'pointer' : 'default',
                backgroundColor: '#ffffff',
                transition: 'all 0.3s ease',
                position: 'relative',
                
                ...(item.isClickable && {
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    transform: 'translateY(-2px)',
                  },
                })
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {item.title}
                    </Typography>
                    {item.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {formatDate(item.createdAt)}
                    </Typography>
                  </Box>
                  {item.isClickable && (
                    <ArrowForward sx={{ color: 'primary.main' }} />
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
