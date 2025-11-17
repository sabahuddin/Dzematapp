import { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { type ActivityFeedItem } from '@shared/schema';
import { useLocation } from 'wouter';
import announcementImg from '@assets/stock_images/landscape_a6df4c9a-7ea0-45ce-8002-a75e2dfd7cc3.jpg';
import eventImg from '@assets/stock_images/landscape_da0e8bcb-c25e-4c54-92c5-ad89b2da6f96.jpg';
import taskImg from '@assets/stock_images/landscape_a2a0ad41-12a5-46e8-b3f8-74b17b4cb651.jpg';
import messageImg from '@assets/stock_images/landscape_c9e91c95-1dd6-46f1-a85f-05fe71f025db.jpg';
import mediaImg from '@assets/stock_images/landscape_d02d4a94-4aae-4ea7-8e44-2bbe0b8b26f6.jpg';
import dateImg from '@assets/stock_images/landscape_3bce5afc-d2b2-49cb-b4e7-6a2b5c1b18fd.jpg';

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

  const getDefaultImageForType = (type: string): string => {
    switch (type) {
      case 'announcement': return announcementImg;
      case 'event': return eventImg;
      case 'task': return taskImg;
      case 'message': return messageImg;
      case 'media': return mediaImg;
      case 'important_date_reminder': return dateImg;
      case 'shop_item': return eventImg;
      default: return announcementImg;
    }
  };

  const getImageUrl = (item: ActivityFeedItem): string => {
    try {
      const metadata = item.metadata ? JSON.parse(item.metadata) : null;
      return metadata?.imageUrl || getDefaultImageForType(item.type);
    } catch {
      return getDefaultImageForType(item.type);
    }
  };

  const getEntityTypeBadgeLabel = (type: string): string => {
    switch (type) {
      case 'announcement': return 'Obavještenje';
      case 'event': return 'Događaj';
      case 'shop_item': return 'Shop';
      case 'new_member': return 'Novi član';
      case 'badge_awarded': return 'Značka';
      case 'certificate_issued': return 'Zahvalnica';
      case 'task': return 'Zadatak';
      case 'message': return 'Poruka';
      case 'media': return 'Media';
      case 'important_date_reminder': return 'Važan datum';
      case 'project_completed': return 'Projekat';
      default: return 'Aktivnost';
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
  const imageUrl = getImageUrl(currentItem);

  return (
    <Box sx={{ mb: 3 }}>
      <Card
        onClick={() => handleItemClick(currentItem)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-testid={`feed-slideshow-item-${currentItem.id}`}
        sx={{
          cursor: currentItem.isClickable ? 'pointer' : 'default',
          bgcolor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          transition: 'all 0.2s ease',
          boxShadow: 'none',
          userSelect: 'none',
          
          ...(currentItem.isClickable && {
            '&:hover': {
              borderColor: 'var(--primary)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          })
        }}
      >
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* Image on Left - 4:3 aspect ratio, 40% of card width */}
            <Box
              component="img"
              src={imageUrl}
              alt=""
              sx={{
                width: '40%',
                aspectRatio: '4 / 3',
                objectFit: 'cover',
                flexShrink: 0,
              }}
            />

            {/* Content on Right */}
            <Box sx={{ flex: 1, minWidth: 0, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {/* Entity Type Badge */}
              <Chip
                label={getEntityTypeBadgeLabel(currentItem.type)}
                size="small"
                sx={{
                  height: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  bgcolor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  mb: 0.5,
                  width: 'fit-content',
                }}
              />
              
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: 'var(--card-foreground)',
                  mb: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentItem.title}
              </Typography>
              
              {currentItem.description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'var(--muted-foreground)',
                    fontSize: '0.85rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {currentItem.description}
                </Typography>
              )}

              {currentItem.isClickable && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <ArrowForward 
                    sx={{ 
                      color: 'var(--primary)',
                      fontSize: '18px',
                    }} 
                  />
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Slideshow indicators */}
      {limitedItems.length > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1.5 }}>
          {limitedItems.map((_, index) => (
            <Box
              key={index}
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: index === safeIndex ? 'var(--primary)' : 'var(--muted)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
