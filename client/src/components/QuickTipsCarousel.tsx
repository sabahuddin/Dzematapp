import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb
} from '@mui/icons-material';

interface QuickTip {
  title: string;
  description: string;
}

interface QuickTipsCarouselProps {
  autoPlayInterval?: number;
}

export default function QuickTipsCarousel({ autoPlayInterval = 8000 }: QuickTipsCarouselProps) {
  const { t } = useTranslation('quickTips');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const tips: QuickTip[] = t('tips', { returnObjects: true }) as QuickTip[];
  
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentTipIndex((current) => (current + 1) % tips.length);
          return 0;
        }
        return prev + (100 / (autoPlayInterval / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [isPaused, autoPlayInterval, tips.length]);

  const handlePrevious = () => {
    setCurrentTipIndex((prev) => (prev - 1 + tips.length) % tips.length);
    setProgress(0);
  };

  const handleNext = () => {
    setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    setProgress(0);
  };

  const currentTip = tips[currentTipIndex];

  return (
    <Card 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="quick-tips-carousel"
    >
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: 'white'
          }
        }}
      />
      
      <CardContent sx={{ pt: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <Lightbulb sx={{ fontSize: 24 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="overline" 
              sx={{ 
                fontSize: '0.75rem',
                opacity: 0.9,
                fontWeight: 600,
                letterSpacing: 1
              }}
            >
              {t('title')}
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                fontSize: isMobile ? '1rem' : '1.25rem'
              }}
            >
              {currentTip.title}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.95,
                lineHeight: 1.6,
                fontSize: isMobile ? '0.875rem' : '0.95rem'
              }}
            >
              {currentTip.description}
            </Typography>
          </Box>
        </Box>

        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mt: 2
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size="small"
              onClick={handlePrevious}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
              data-testid="button-previous-tip"
            >
              <ChevronLeft />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleNext}
              sx={{ 
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
              }}
              data-testid="button-next-tip"
            >
              <ChevronRight />
            </IconButton>
          </Box>

          <Typography 
            variant="caption" 
            sx={{ 
              opacity: 0.8,
              fontSize: '0.75rem'
            }}
          >
            {t('tipNumber', { current: currentTipIndex + 1, total: tips.length })}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
