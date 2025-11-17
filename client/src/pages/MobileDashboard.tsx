import { Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Avatar } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type ActivityFeedItem, type PrayerTime } from '@shared/schema';
import { HeroPrayerCard } from '../components/HeroPrayerCard';
import { SectionCard } from '../components/SectionCard';
import FeedSlideshow from '../components/FeedSlideshow';
import { ArrowForward, Article } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '@/lib/imageUtils';

// Import default placeholder images
import announcementImg from '@assets/stock_images/mosque_announcement__5fa54614.jpg';
import eventImg from '@assets/stock_images/islamic_community_ev_6ebc00b7.jpg';
import taskImg from '@assets/stock_images/mosque_task_work_vol_d0885b38.jpg';
import messageImg from '@assets/stock_images/message_envelope_let_edf65931.jpg';
import dateImg from '@assets/stock_images/important_date_calen_8295ac6d.jpg';
import mediaImg from '@assets/stock_images/video_camera_media_l_00904efa.jpg';

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

    const id = item.relatedEntityId;
    const type = item.relatedEntityType?.toLowerCase();
    
    switch (type) {
      case 'announcement': 
        setLocation(id ? `/announcements?id=${id}` : '/announcements'); 
        break;
      case 'event': 
        setLocation(id ? `/events?id=${id}` : '/events'); 
        break;
      case 'project': 
        setLocation(id ? `/projects?id=${id}` : '/projects'); 
        break;
      case 'media': 
        setLocation('/media'); 
        break;
      case 'shop_item': 
        setLocation(id ? `/shop?id=${id}` : '/shop'); 
        break;
      case 'badge': 
        setLocation('/badges'); 
        break;
      case 'certificate': 
        setLocation('/certificates'); 
        break;
      case 'user': 
        setLocation('/users'); 
        break;
      case 'task': 
        setLocation('/tasks'); 
        break;
      case 'message': 
        setLocation('/messages'); 
        break;
      case 'important_date_reminder': 
        setLocation('/events'); 
        break;
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

  const getDefaultImageForType = (type: string): string => {
    switch (type) {
      case 'announcement': return announcementImg;
      case 'event': return eventImg;
      case 'task': return taskImg;
      case 'message': return messageImg;
      case 'media': return mediaImg;
      case 'important_date_reminder': return dateImg;
      case 'shop_item': return eventImg; // Fallback for shop without photo
      default: return announcementImg;
    }
  };

  const getImageUrl = (item: ActivityFeedItem): string => {
    try {
      const metadata = item.metadata ? JSON.parse(item.metadata) : null;
      const imageUrl = normalizeImageUrl(metadata?.imageUrl);
      return imageUrl || getDefaultImageForType(item.type);
    } catch {
      return getDefaultImageForType(item.type);
    }
  };

  return (
    <>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {userActivities.map((item, index) => {
                const imageUrl = getImageUrl(item);
                const isLast = index === userActivities.length - 1;
                return (
                  <Box
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    data-testid={`user-activity-${item.id}`}
                    sx={{
                      cursor: item.isClickable ? 'pointer' : 'default',
                      bgcolor: 'var(--card)',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      transition: 'all 0.2s ease',
                      
                      ...(item.isClickable && {
                        '&:hover': {
                          bgcolor: 'var(--accent)',
                        },
                      })
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
                      {/* Image on Left - 4:3 aspect ratio, 1/3 of card width */}
                      <Box
                        component="img"
                        src={imageUrl}
                        alt=""
                        sx={{
                          width: '33.33%',
                          aspectRatio: '4 / 3',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />

                      {/* Content on Right */}
                      <Box sx={{ flex: 1, minWidth: 0, p: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {/* Entity Type Badge */}
                        <Chip
                          label={getEntityTypeBadgeLabel(item.type)}
                          size="small"
                          sx={{
                            height: '18px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: 'var(--accent)',
                            color: 'var(--accent-foreground)',
                            mb: 0.5,
                          }}
                        />
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: 'var(--card-foreground)',
                            mb: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </Typography>
                        
                        {item.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'var(--muted-foreground)',
                              fontSize: '0.8rem',
                              mb: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                        
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'var(--muted-foreground)',
                            fontSize: '0.7rem',
                            display: 'block'
                          }}
                        >
                          {formatDate(item.createdAt)}
                        </Typography>
                      </Box>
                      
                      {item.isClickable && (
                        <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
                          <ArrowForward 
                            sx={{ 
                              color: 'var(--primary)',
                              fontSize: '20px',
                              flexShrink: 0,
                            }} 
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </SectionCard>
    </>
  );
}
