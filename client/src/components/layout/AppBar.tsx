import React, { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Person,
  Logout,
  EmojiEvents
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { queryClient } from '../../lib/queryClient';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface AppBarProps {
  onMenuClick: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation(['navigation', 'dashboard']);
  const [, setLocation] = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = window.innerWidth < 900;

  const { data: activityLog } = useQuery<any[]>({
    queryKey: [`/api/activity-logs/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: contributions } = useQuery<any[]>({
    queryKey: [`/api/financial-contributions/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const activityLogPoints = activityLog?.reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;
  const contributionPoints = contributions?.reduce((sum: number, c: any) => sum + (c.pointsValue || 0), 0) || 0;
  const totalPoints = activityLogPoints + contributionPoints;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleGoToProfile = () => {
    setAnchorEl(null);
    setLocation('/my-profile');
  };

  const handleLogout = () => {
    queryClient.clear(); // Clear all cache to prevent data leakage between tenants
    logout();
    handleProfileMenuClose();
  };

  const getPageTitle = () => {
    // This would be better managed through a context or state management
    // For now, we'll return a default title
    return t('navigation:menu.dashboard');
  };

  return (
    <MuiAppBar 
      position="static" 
      elevation={1}
      sx={{ 
        bgcolor: 'white', 
        color: 'text.primary',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{ 
              mr: 2,
              '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
            }}
            data-testid="menu-button"
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
            {getPageTitle()}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {t('navigation:appBar.welcome')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user && !user.isAdmin && (
            <Chip
              icon={<EmojiEvents sx={{ fontSize: '16px !important' }} />}
              label={totalPoints}
              size="small"
              sx={{
                bgcolor: 'hsl(14 100% 94%)',
                color: 'hsl(14 100% 45%)',
                fontWeight: 700,
                fontSize: '13px',
                height: '32px',
                '& .MuiChip-icon': {
                  color: 'hsl(35 100% 50%) !important',
                  marginLeft: '4px'
                }
              }}
              data-testid="chip-total-points"
            />
          )}
          <IconButton
            size="large"
            onClick={handleProfileMenuOpen}
            sx={{ 
              p: 1,
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.04)'
              }
            }}
            data-testid="profile-menu-button"
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#3949AB' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.isAdmin ? t('navigation:appBar.administrator') : t('navigation:appBar.user')}
            </Typography>
          </Box>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleProfileMenuClose}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 180,
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }
          }}
        >
          <MenuItem onClick={handleGoToProfile} data-testid="menu-profile">
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('navigation:appBar.myProfile')}</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleLogout} data-testid="menu-logout">
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('navigation:appBar.logout')}</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
}
