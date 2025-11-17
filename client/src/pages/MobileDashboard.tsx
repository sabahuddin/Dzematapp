import { Box, Typography, Card, CardContent, CircularProgress, Alert, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type ActivityFeedItem, type PrayerTime } from '@shared/schema';
import { MobileAppBar } from '../components/MobileAppBar';
import { HeroPrayerCard } from '../components/HeroPrayerCard';
import { SectionCard } from '../components/SectionCard';
import FeedSlideshow from '../components/FeedSlideshow';
import BottomNavigation from '../components/layout/BottomNavigation';
import { ArrowForward, Article } from '@mui/icons-material';
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

  const getEntityTypeBadgeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'announcement': t('common:entityTypes.announcement', 'Obavijest'),
      'event': t('common:entityTypes.event', 'Događaj'),
      'shop_item': t('common:entityTypes.shop_item', 'Trgovina'),
      'task': t('common:entityTypes.task', 'Zadatak'),
      'message': t('common:entityTypes.message', 'Poruka'),
      'media': t('common:entityTypes.media', 'Medija'),
      'important_date_reminder': t('common:entityTypes.important_date_reminder', 'Važan datum'),
    };
    return labels[type] || type;
  };

  return (
    <Box sx={{ 
      bgcolor: 'var(--background)', 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top AppBar - Fixed */}
      <Box sx={{ flexShrink: 0 }}>
        <MobileAppBar title="DžematApp" />
      </Box>

      {/* Main Content - Scrollable area */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        p: 2,
        pt: 1,
        pb: 10,
      }}>
        {/* Hero Prayer Times */}
        {prayerLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {prayerError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('dashboard:errors.prayerTimesFailed', 'Nije moguće učitati vaktiju')}
          </Alert>
        )}
        {prayerTime && <HeroPrayerCard prayerTime={prayerTime} />}

        {/* Feed Section */}
        <SectionCard 
          title={t('dashboard:communityActivities', 'Aktivnosti zajednice')}
          icon={<Article />}
          linkTo="/feed"
          linkText={t('common.viewAll', 'Vidi sve')}
        >
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

          {!feedLoading && !feedError && feedItems.length > 0 && (
            <FeedSlideshow items={feedItems} />
          )}

          {!feedLoading && !feedError && feedItems.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('dashboard:feed.empty', 'Nema aktivnosti')}
            </Typography>
          )}
        </SectionCard>

        {/* User Activities Section */}
        <SectionCard 
          title={t('dashboard:myActivities', 'Moje aktivnosti')}
          icon={<Article />}
        >
          {userActivitiesLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!userActivitiesLoading && userActivities.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('dashboard:feed.empty', 'Nema aktivnosti')}
            </Typography>
          )}

          {!userActivitiesLoading && userActivities.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {userActivities.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  data-testid={`user-activity-${item.id}`}
                  sx={{
                    cursor: item.isClickable ? 'pointer' : 'default',
                    bgcolor: 'var(--card)',
                    border: '2px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    transition: 'all 0.2s ease',
                    boxShadow: 'none',
                    
                    ...(item.isClickable && {
                      '&:hover': {
                        borderColor: 'var(--primary)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    })
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        {/* Entity Type Badge */}
                        <Chip
                          label={getEntityTypeBadgeLabel(item.type)}
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: 'var(--accent)',
                            color: 'var(--accent-foreground)',
                            mb: 0.75,
                          }}
                        />
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: 'var(--card-foreground)',
                            mb: 0.5
                          }}
                        >
                          {item.title}
                        </Typography>
                        
                        {item.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'var(--muted-foreground)',
                              fontSize: '0.85rem',
                              mb: 0.5
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                        
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'var(--muted-foreground)',
                            fontSize: '0.75rem',
                            display: 'block'
                          }}
                        >
                          {formatDate(item.createdAt)}
                        </Typography>
                      </Box>
                      
                      {item.isClickable && (
                        <ArrowForward 
                          sx={{ 
                            color: 'var(--primary)',
                            fontSize: '20px',
                            mt: 0.5
                          }} 
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* Bottom Navigation - Fixed */}
      <Box sx={{ flexShrink: 0 }}>
        <BottomNavigation />
      </Box>
    </Box>
  );
}
