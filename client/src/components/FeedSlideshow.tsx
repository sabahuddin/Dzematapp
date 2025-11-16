import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight, ArrowForward } from '@mui/icons-material';
import {
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
import { useLocation } from 'wouter';

interface FeedSlideshowProps {
  items: ActivityFeedItem[];
}

export default function FeedSlideshow({ items }: FeedSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setLocation] = useLocation();

  // Reset index when items change
  useEffect(() => {
    if (items.length > 0 && currentIndex >= items.length) {
      setCurrentIndex(0);
    }
  }, [items, currentIndex]);

  useEffect(() => {
    if (items.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [items.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new_member': return { bg: 'var(--semantic-info-bg)', iconColor: 'var(--semantic-info-gradient-start)' };
      case 'badge_awarded': return { bg: 'var(--semantic-award-bg)', iconColor: 'var(--semantic-award-text)' };
      case 'certificate_issued': return { bg: 'var(--semantic-celebration-bg)', iconColor: 'var(--semantic-celebration-text)' };
      case 'shop_item': return { bg: 'var(--semantic-success-bg)', iconColor: 'var(--semantic-success-text)' };
      default: return { bg: 'var(--semantic-neutral-bg)', iconColor: 'text.secondary' };
    }
  };

  const formatDate = (dateString: Date | null) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm');
  };

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

  if (items.length === 0) {
    return null;
  }

  // Clamp index to valid range to prevent undefined access during state updates
  const safeIndex = Math.min(currentIndex, items.length - 1);
  const currentItem = items[safeIndex];
  const colors = getTypeColor(currentItem.type);

  return (
    <Box sx={{ position: 'relative', mb: 3 }}>
      <Card
        onClick={() => handleItemClick(currentItem)}
        data-testid={`feed-slideshow-item-${currentItem.id}`}
        sx={{
          backgroundColor: colors.bg,
          transition: 'all 0.3s ease',
          cursor: currentItem.isClickable ? 'pointer' : 'default',
          
          ...(currentItem.isClickable ? {
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
              {getIcon(currentItem.type)}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                  {currentItem.title}
                </Typography>
                {currentItem.isClickable && (
                  <ArrowForward 
                    sx={{ 
                      color: 'primary.main',
                      ml: 1
                    }} 
                  />
                )}
              </Box>

              {currentItem.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ mb: 1 }}
                >
                  {currentItem.description}
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary">
                {formatDate(currentItem.createdAt)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Navigation arrows */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          px: 1,
        }}
      >
        <IconButton
          onClick={handlePrev}
          size="small"
          sx={{
            pointerEvents: 'auto',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
          }}
          data-testid="slideshow-prev"
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          onClick={handleNext}
          size="small"
          sx={{
            pointerEvents: 'auto',
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' },
          }}
          data-testid="slideshow-next"
        >
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Dots indicator */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          gap: 1,
          mt: 1,
        }}
      >
        {items.map((_, index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: index === safeIndex ? 'primary.main' : 'rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>
    </Box>
  );
}
