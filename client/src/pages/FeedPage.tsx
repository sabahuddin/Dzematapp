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

export default function FeedPage() {
  const { t, i18n } = useTranslation(['common']);
  const [, setLocation] = useLocation();

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
        return { bg: 'var(--semantic-info-bg)', iconColor: '#1976d2' }; // Blue
      case 'badge_awarded':
        return { bg: 'var(--semantic-award-bg)', iconColor: '#f57c00' }; // Orange
      case 'certificate_issued':
        return { bg: 'var(--semantic-celebration-bg)', iconColor: '#7b1fa2' }; // Purple
      case 'shop_item':
        return { bg: 'var(--semantic-success-bg)', iconColor: '#388e3c' }; // Green
      default:
        return { bg: '#f5f5f5', iconColor: 'text.secondary' }; // Gray
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
          Feed
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sve aktivnosti u džematu
        </Typography>
      </Box>

      {feedItems.length === 0 ? (
        <Alert severity="info">
          Nema aktivnosti za prikaz
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
