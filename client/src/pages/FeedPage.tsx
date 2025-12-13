import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  ArrowForward,
  PersonAdd,
  CheckCircle,
  Store,
  EmojiEvents,
  Article,
  Event,
  CalendarMonth,
  CardGiftcard,
  NotificationsActive,
  Videocam
} from '@mui/icons-material';
import { type ActivityFeedItem } from '@shared/schema';
import { format } from 'date-fns';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeCTA } from '@/components/UpgradeCTA';

export default function FeedPage() {
  const { t } = useTranslation(['feed', 'common']);
  const [, setLocation] = useLocation();
  const featureAccess = useFeatureAccess('feed');

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="feed" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

  const { data: feedItems = [], isLoading } = useQuery<ActivityFeedItem[]>({
    queryKey: ['/api/activity-feed'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const getIcon = (type: string) => {
    const iconProps = { fontSize: 'large' as const };
    switch (type) {
      case 'new_member':
        return <PersonAdd {...iconProps} />;
      case 'project_completed':
        return <CheckCircle {...iconProps} />;
      case 'shop_item':
        return <Store {...iconProps} />;
      case 'badge_awarded':
        return <EmojiEvents {...iconProps} />;
      case 'certificate_issued':
        return <CardGiftcard {...iconProps} />;
      case 'announcement':
        return <Article {...iconProps} />;
      case 'event':
        return <Event {...iconProps} />;
      case 'important_date_reminder':
        return <NotificationsActive {...iconProps} />;
      case 'media':
        return <Videocam {...iconProps} />;
      default:
        return <CalendarMonth {...iconProps} />;
    }
  };

  const getTypeColor = (type: string, isClickable: boolean) => {
    if (isClickable) {
      return { bg: '#ffffff', iconColor: 'primary.main' };
    }
    
    switch (type) {
      case 'new_member':
        return { bg: 'var(--semantic-info-bg)', iconColor: 'var(--semantic-info-gradient-start)' }; // Blue
      case 'badge_awarded':
        return { bg: 'var(--semantic-award-bg)', iconColor: 'var(--semantic-award-text)' }; // Orange
      case 'certificate_issued':
        return { bg: 'var(--semantic-celebration-bg)', iconColor: 'var(--semantic-celebration-text)' }; // Purple
      case 'shop_item':
        return { bg: 'var(--semantic-success-bg)', iconColor: 'var(--semantic-success-text)' }; // Green
      default:
        return { bg: 'var(--semantic-neutral-bg)', iconColor: 'text.secondary' }; // Gray
    }
  };

  const handleItemClick = (item: ActivityFeedItem) => {
    if (!item.isClickable) return;

    switch (item.relatedEntityType) {
      case 'announcement':
        setLocation('/announcements');
        break;
      case 'event':
        setLocation('/events');
        break;
      case 'project':
        setLocation('/projects');
        break;
      case 'media':
        setLocation('/media');
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          {t('feed:title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('feed:allCommunityActivities')}
        </Typography>
      </Box>

      {feedItems.length === 0 ? (
        <Alert severity="info">
          {t('feed:noActivities')}
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {feedItems.map((item) => {
            const colors = getTypeColor(item.type, item.isClickable);
            return (
              <Card
                key={item.id}
                data-testid={`feed-item-${item.id}`}
                onClick={() => handleItemClick(item)}
                sx={{
                  transition: 'all 0.3s ease',
                  cursor: item.isClickable ? 'pointer' : 'default',
                  position: 'relative',
                  backgroundColor: colors.bg,
                  
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
                        {item.type === 'new_member' ? `${t('feed:newMember')}: ${item.description?.split(' ').map((n: string) => n[0]).join('')}` : item.title}
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
