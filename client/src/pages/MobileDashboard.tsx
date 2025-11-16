import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';
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

  const getIcon = (type: string) => {
    const iconProps = { fontSize: 'large' as const };
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
      return { bg: '#ffffff', iconColor: 'primary.main' };
    }
    
    switch (type) {
      case 'new_member': return { bg: 'var(--semantic-info-bg)', iconColor: 'var(--semantic-info-gradient-start)' };
      case 'badge_awarded': return { bg: 'var(--semantic-award-bg)', iconColor: 'var(--semantic-award-text)' };
      case 'certificate_issued': return { bg: 'var(--semantic-celebration-bg)', iconColor: 'var(--semantic-celebration-text)' };
      case 'shop_item': return { bg: 'var(--semantic-success-bg)', iconColor: 'var(--semantic-success-text)' };
      default: return { bg: 'var(--semantic-neutral-bg)', iconColor: 'text.secondary' };
    }
  };

  const handleItemClick = (item: ActivityFeedItem) => {
    if (!item.isClickable) return;

    switch (item.relatedEntityType) {
      case 'announcement': setLocation('/announcements'); break;
      case 'event': setLocation('/events'); break;
      case 'project': setLocation('/projects'); break;
      case 'media': setLocation('/media'); break;
    }
  };

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  // Get latest 5 feed items
  const latestFeed = feedItems.slice(0, 5);

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

      {/* Feed Section */}
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {t('dashboard:feed.title', 'Feed')}
      </Typography>

      {feedLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {feedError && (
        <Alert severity="error">
          {t('dashboard:errors.feedFailed', 'Nije moguće učitati aktivnosti')}
        </Alert>
      )}

      {!feedLoading && !feedError && latestFeed.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {t('dashboard:feed.empty', 'Nema aktivnosti')}
        </Typography>
      )}

      {!feedLoading && !feedError && latestFeed.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {latestFeed.map((item) => {
            const colors = getTypeColor(item.type, item.isClickable);
            
            return (
              <Card
                key={item.id}
                onClick={() => handleItemClick(item)}
                data-testid={`feed-item-${item.id}`}
                sx={{
                  cursor: item.isClickable ? 'pointer' : 'default',
                  backgroundColor: colors.bg,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  
                  ...(item.isClickable ? {
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                      transform: 'translateY(-2px)',
                    },
                  } : {
                    opacity: 0.95,
                  })
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        color: colors.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 56,
                      }}
                    >
                      {getIcon(item.type)}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                          {item.title}
                        </Typography>
                        {item.isClickable && (
                          <ArrowForward 
                            sx={{ 
                              color: 'primary.main',
                              ml: 1
                            }} 
                          />
                        )}
                      </Box>

                      {item.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ mb: 1 }}
                        >
                          {item.description}
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        {formatDate(item.createdAt)}
                      </Typography>
                    </Box>
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
