import { Box, Typography, IconButton } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { Link } from 'wouter';
import { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  icon?: ReactNode;
  linkTo?: string;
  linkText?: string;
  children: ReactNode;
  variant?: 'default' | 'hero';
}

export function SectionCard({ 
  title, 
  icon, 
  linkTo, 
  linkText = 'Vidi sve', 
  children,
  variant = 'default'
}: SectionCardProps) {
  const isHero = variant === 'hero';

  return (
    <Box
      sx={{
        ...(isHero ? {
          background: 'linear-gradient(135deg, var(--semantic-success-bg) 0%, hsl(123 46% 96%) 100%)',
        } : {
          bgcolor: 'var(--card)',
        }),
        border: `2px solid ${isHero ? 'var(--semantic-success-border)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        p: isHero ? 3 : 2,
        mb: 2,
        boxShadow: isHero ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
      }}
      data-testid={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && <Box sx={{ color: isHero ? 'var(--primary)' : 'var(--muted-foreground)' }}>{icon}</Box>}
          <Typography 
            variant={isHero ? 'h6' : 'subtitle1'}
            sx={{ 
              fontWeight: isHero ? 700 : 600,
              color: isHero ? 'hsl(123 46% 34%)' : 'var(--card-foreground)',
              fontSize: isHero ? '1.1rem' : '1rem'
            }}
            data-testid={`text-section-title-${title.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {title}
          </Typography>
        </Box>

        {linkTo && (
          <Link href={linkTo}>
            <IconButton 
              size="small" 
              sx={{ 
                color: isHero ? 'hsl(123 46% 54%)' : 'var(--primary)',
                '&:hover': {
                  bgcolor: isHero ? 'hsl(123 46% 90%)' : 'var(--accent)',
                }
              }}
              data-testid={`button-view-all-${title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <ArrowForward fontSize="small" />
            </IconButton>
          </Link>
        )}
      </Box>

      {/* Content */}
      {children}
    </Box>
  );
}
