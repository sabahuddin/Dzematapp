import { Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Avatar } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type ActivityFeedItem, type PrayerTime, type Announcement, type Message } from '@shared/schema';
import { HeroPrayerCard } from '../components/HeroPrayerCard';
import { SectionCard } from '../components/SectionCard';
import FeedSlideshow from '../components/FeedSlideshow';
import { ArrowForward, Article, Campaign, Mail, Receipt, EmojiEvents } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/hooks/useAuth';

// Green placeholder image for content without photos
const placeholderImg = '/placeholder.png';
const announcementImg = placeholderImg;
const eventImg = placeholderImg;
const taskImg = placeholderImg;
const messageImg = placeholderImg;
const dateImg = placeholderImg;
const mediaImg = placeholderImg;

export default function MobileDashboard() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation(['dashboard', 'common']);
  const { formatPrice } = useCurrency();

  const { data: prayerTime, isLoading: prayerLoading, error: prayerError } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
    retry: false,
  });

  const { data: badgesData } = useQuery({
    queryKey: ['/api/badges'],
  });

  const { user } = useAuth();
  
  const { data: userBadgesData } = useQuery({
    queryKey: [`/api/user-badges/${user?.id}`],
    enabled: !!user?.id,
  });

  const allBadges = (badgesData as any[]) || [];
  const userBadges = (userBadgesData as any[]) || [];
  
  const earnedBadges = userBadges.map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    return badge;
  }).filter(Boolean);

  const { data: feedItems = [], isLoading: feedLoading, error: feedError } = useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/activity-feed'],
    refetchInterval: 30000,
  });

  // Fetch announcements
  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    refetchInterval: 30000,
  });

  // Fetch messages for current user (returns messages with sender info)
  const { data: messages = [], isLoading: messagesLoading } = useQuery<(Message & { sender?: { firstName: string; lastName: string } })[]>({
    queryKey: ['/api/messages'],
    refetchInterval: 30000,
  });

  // Fetch membership fee payments for current user
  const { data: myPaymentsData, isLoading: paymentsLoading } = useQuery<{ payments: any[], lastUpdated: string | null }>({
    queryKey: ['/api/membership-fees/my-payments'],
    refetchInterval: 60000,
  });
  const myPayments = myPaymentsData?.payments || [];

  // Calculate membership stats
  const currentYear = new Date().getFullYear();
  const thisYearPayments = Array.isArray(myPayments) ? myPayments.filter((p: any) => p.coverageYear === currentYear) : [];
  const totalPaidThisYear = thisYearPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
  const uniquePaidMonths = new Set(thisYearPayments.map((p: any) => p.coverageMonth));
  const paidMonthsCount = uniquePaidMonths.size;

  // Get user-specific activities (events, shop, tasks, messages, etc.)
  const userActivities = feedItems
    .filter(item => 
      item.type === 'event' || 
      item.type === 'shop_item' ||
      item.type === 'important_date_reminder' ||
      item.type === 'media' ||
      item.type === 'task' ||
      item.type === 'message'
    )
    .slice(0, 5);

  const handleItemClick = (item: ActivityFeedItem) => {
    // Early return if item is not clickable
    if (!item.isClickable) return;
    
    const id = item.relatedEntityId;
    const entityType = item.relatedEntityType?.toLowerCase();
    const itemType = item.type?.toLowerCase();
    
    // Use itemType as fallback if entityType doesn't match known types
    const type = entityType || itemType;
    
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
      case 'service':
      case 'marketplace':
        if (id) {
          setLocation(`/shop?itemId=${id}`);
        } else {
          setLocation('/shop');
        }
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
      default: 
        // For shop_item type without specific entityType, go to shop
        if (itemType === 'shop_item') {
          setLocation(id ? `/shop?itemId=${id}` : '/shop');
        }
        break;
    }
  };

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  const getEntityTypeBadgeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'announcement': t('common:entityTypes.announcement'),
      'event': t('common:entityTypes.event'),
      'shop_item': t('common:entityTypes.shop_item'),
      'task': t('common:entityTypes.task'),
      'message': t('common:entityTypes.message'),
      'media': t('common:entityTypes.media'),
      'important_date_reminder': t('common:entityTypes.important_date_reminder'),
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

  const getBadgeColor = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points_total': return { bg: 'var(--semantic-award-bg)', text: 'var(--semantic-award-text)', border: 'var(--semantic-award-border)' };
      case 'contributions_amount': return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success-text)', border: 'var(--semantic-success-border)' };
      case 'tasks_completed': return { bg: 'var(--semantic-info-bg)', text: 'var(--semantic-info-text)', border: 'var(--semantic-info-border)' };
      case 'events_attended': return { bg: 'var(--semantic-celebration-bg)', text: 'var(--semantic-celebration-text)', border: 'var(--semantic-celebration-border)' };
      default: return { bg: 'hsl(0 0% 96%)', text: '#616161', border: 'hsl(0 0% 74%)' };
    }
  };

  return (
    <>
      {/* User Badges Section - Compact */}
      {earnedBadges.length > 0 && (
        <Box 
          sx={{ 
            mx: 2, 
            mt: 2, 
            mb: 1,
            p: 1,
            bgcolor: '#ffffff', 
            borderRadius: 2,
            boxShadow: 1,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 0.5,
            cursor: 'pointer'
          }}
          onClick={() => setLocation('/my-badges')}
        >
          {earnedBadges.map((badge: any) => (
            <Box
              key={badge.id}
              sx={{ 
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={badge.name}
            >
              {badge.icon?.startsWith('/') || badge.icon?.startsWith('http') ? (
                <img src={badge.icon} alt={badge.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />
              ) : (
                <span style={{ fontSize: '1.5rem' }}>{badge.icon || '🏆'}</span>
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* Hero Prayer Times */}
        {prayerLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {prayerError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {t('dashboard:errors.prayerTimesFailed')}
          </Alert>
        )}
        {prayerTime && <HeroPrayerCard prayerTime={prayerTime} />}

        {/* Feed Section */}
        <SectionCard 
          title={t('dashboard:communityActivities')}
          icon={<Article />}
          linkTo="/feed"
          linkText={t('common:common.viewAll')}
        >
          {feedLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {feedError && (
            <Alert severity="error">
              {t('dashboard:errors.feedFailed')}
            </Alert>
          )}

          {!feedLoading && !feedError && feedItems.length > 0 && (
            <FeedSlideshow items={feedItems} />
          )}

          {!feedLoading && !feedError && feedItems.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('dashboard:feed.empty')}
            </Typography>
          )}
        </SectionCard>

        {/* Announcements Section */}
        <SectionCard 
          title={t('navigation:menu.announcements')}
          icon={<Campaign />}
          linkTo="/announcements"
          linkText={t('common:common.viewAll')}
        >
          {announcementsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!announcementsLoading && announcements.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('dashboard:announcements.empty')}
            </Typography>
          )}

          {!announcementsLoading && announcements.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {announcements.slice(0, 3).map((announcement, index) => {
                const isLast = index === announcements.length - 1 || index === 2;
                const imageUrl = normalizeImageUrl((announcement as any).photoUrl) || announcementImg;
                return (
                  <Box
                    key={announcement.id}
                    onClick={() => setLocation(`/announcements?id=${announcement.id}`)}
                    data-testid={`announcement-${announcement.id}`}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: 'var(--card)',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(57, 73, 171, 0.04)',
                      },
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
                        {announcement.categories && announcement.categories.length > 0 && (
                          <Chip
                            label={announcement.categories[0]}
                            size="small"
                            sx={{
                              height: '18px',
                              fontSize: '0.7rem',
                              mb: 0.5,
                              width: 'fit-content',
                            }}
                          />
                        )}

                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            mb: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {announcement.title}
                        </Typography>

                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'var(--muted-foreground)',
                            fontSize: '0.7rem',
                            display: 'block',
                          }}
                        >
                          {formatDate(announcement.publishDate)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', pr: 1.5 }}>
                        <ArrowForward 
                          sx={{ 
                            color: 'var(--primary)',
                            fontSize: '20px',
                            flexShrink: 0,
                          }} 
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </SectionCard>

        {/* User Activities Section - Events, Shop, Tasks, etc. */}
        <SectionCard 
          title={t('dashboard:myActivities')}
          icon={<Article />}
        >
          {feedLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!feedLoading && userActivities.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('dashboard:feed.empty')}
            </Typography>
          )}

          {!feedLoading && userActivities.length > 0 && (
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
                          bgcolor: 'rgba(57, 73, 171, 0.04)',
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
                        {/* Entity Type Badge - for shop_item use title which contains proper label */}
                        <Chip
                          label={item.type === 'shop_item' ? item.title : getEntityTypeBadgeLabel(item.type)}
                          size="small"
                          sx={{
                            height: '18px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: 'var(--accent)',
                            color: 'var(--accent-foreground)',
                            mb: 0.5,
                            width: 'fit-content',
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
                          {/* For shop_item, description contains the product name, title is the label */}
                          {item.type === 'shop_item' ? item.description : item.title}
                        </Typography>
                        
                        {/* Show description for non-shop items */}
                        {item.type !== 'shop_item' && item.description && (
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

        {/* Membership Fees Section */}
        <SectionCard 
          title={t('membershipFees:myPayments.title')}
          icon={<Receipt />}
          linkTo="/my-clanarina"
          linkText={t('membershipFees:myPayments.viewHistory')}
        >
          {paymentsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!paymentsLoading && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t('membershipFees:myPayments.paidMonths')} ({currentYear})
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {paidMonthsCount} / 12
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('membershipFees:myPayments.totalPaid')}
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {formatPrice(totalPaidThisYear)}
                  </Typography>
                </Box>
              </Box>
              
              {/* Monthly payment indicators */}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map((month) => {
                  const payment = thisYearPayments.find((p: any) => p.coverageMonth === month);
                  const isPaid = !!payment;
                  const monthNames = [
                    t('common:months.jan'), t('common:months.feb'), t('common:months.mar'),
                    t('common:months.apr'), t('common:months.may'), t('common:months.jun'),
                    t('common:months.jul'), t('common:months.aug'), t('common:months.sep'),
                    t('common:months.oct'), t('common:months.nov'), t('common:months.dec')
                  ];
                  return (
                    <Chip
                      key={month}
                      label={monthNames[month - 1]}
                      size="small"
                      sx={{
                        minWidth: 42,
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: isPaid ? 'success.light' : 'grey.200',
                        color: isPaid ? 'success.dark' : 'text.disabled',
                        fontWeight: isPaid ? 600 : 400,
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </SectionCard>

        {/* Messages Section */}
        <SectionCard 
          title={t('dashboard:myMessages')}
          icon={<Mail />}
          linkTo="/messages"
          linkText={t('common:common.viewAll')}
        >
          {messagesLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {!messagesLoading && messages.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              {t('dashboard:messages.empty')}
            </Typography>
          )}

          {!messagesLoading && messages.length > 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {messages.slice(0, 3).map((message, index) => {
                const isLast = index === messages.length - 1 || index === 2;
                return (
                  <Box
                    key={message.id}
                    onClick={() => message.threadId ? setLocation(`/messages?threadId=${message.threadId}`) : setLocation('/messages')}
                    data-testid={`message-${message.id}`}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: 'var(--card)',
                      borderBottom: isLast ? 'none' : '1px solid var(--border)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'rgba(57, 73, 171, 0.04)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5 }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          bgcolor: 'var(--primary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {message.sender?.firstName?.charAt(0) || 'P'}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: message.isRead ? 400 : 600,
                            fontSize: '0.9rem',
                            mb: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {message.subject || 'Poruka'}
                        </Typography>

                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'var(--muted-foreground)',
                            fontSize: '0.8rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Nepoznat pošiljalac'}
                        </Typography>

                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'var(--muted-foreground)',
                            fontSize: '0.7rem',
                            display: 'block',
                          }}
                        >
                          {formatDate(message.createdAt)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ArrowForward 
                          sx={{ 
                            color: 'var(--primary)',
                            fontSize: '20px',
                            flexShrink: 0,
                          }} 
                        />
                      </Box>
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
