import { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
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
import { useLocation } from 'wouter';

interface FeedSlideshowProps {
  items: ActivityFeedItem[];
}

export default function FeedSlideshow({ items }: FeedSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [, setLocation] = useLocation();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Limit to 10 items
  const limitedItems = items.slice(0, 10);

  // Reset index when items change
  useEffect(() => {
    if (limitedItems.length > 0 && currentIndex >= limitedItems.length) {
      setCurrentIndex(0);
    }
  }, [limitedItems, currentIndex]);

  useEffect(() => {
    if (limitedItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % limitedItems.length);
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [limitedItems.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swipe left - next
        setCurrentIndex((prev) => (prev + 1) % limitedItems.length);
      } else {
        // Swipe right - prev
        setCurrentIndex((prev) => (prev - 1 + limitedItems.length) % limitedItems.length);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
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

  if (limitedItems.length === 0) {
    return null;
  }

  // Clamp index to valid range to prevent undefined access during state updates
  const safeIndex = Math.min(currentIndex, limitedItems.length - 1);
  const currentItem = limitedItems[safeIndex];
  const colors = getTypeColor(currentItem.type);

  return (
    <Box sx={{ mb: 3 }}>
      <Card
        onClick={() => handleItemClick(currentItem)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid={`feed-slideshow-item-${currentItem.id}`}
        sx={{
          backgroundColor: colors.bg,
          transition: 'all 0.3s ease',
          cursor: currentItem.isClickable ? 'pointer' : 'default',
          userSelect: 'none',
          
          ...(currentItem.isClickable ? {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '&:active': {
              transform: 'scale(0.98)',
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                >
                  {currentItem.description}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
