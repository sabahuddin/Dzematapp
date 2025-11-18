import { AppBar, Toolbar, IconButton, Badge, Avatar, Box, Typography, Menu, MenuItem, Chip } from '@mui/material';
import { Notifications, Menu as MenuIcon, Logout, Settings, ArrowBack, Person, EmojiEvents } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface MobileAppBarProps {
  title?: string;
  showBack?: boolean;
}

export function MobileAppBar({ title = 'DžematApp', showBack }: MobileAppBarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [location, setLocation] = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Auto-detect if back button should show based on current route
  const isDashboard = location === '/' || location === '/dashboard';
  const shouldShowBack = showBack !== undefined ? showBack : !isDashboard;
  
  const handleBack = () => {
    window.history.back();
  };

  const { data: notificationCounts } = useQuery<{ 
    shop: number; 
    events: number; 
    announcements: number; 
    imamQuestions: number; 
    tasks: number; 
    accessRequests: number;
  }>({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: unreadMessages } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: unviewedCertificates } = useQuery<{ count: number }>({
    queryKey: ['/api/certificates/unviewed-count'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: activityLog } = useQuery<any[]>({
    queryKey: ['/api/activity-logs/user', user?.id],
    refetchInterval: 60000,
    enabled: !!user?.id,
  });

  const totalPoints = activityLog?.reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;

  const totalNotifications = (notificationCounts?.shop || 0) +
    (notificationCounts?.events || 0) +
    (notificationCounts?.announcements || 0) +
    (notificationCounts?.imamQuestions || 0) +
    (notificationCounts?.tasks || 0) +
    (notificationCounts?.accessRequests || 0) +
    (unreadMessages?.count || 0) +
    (unviewedCertificates?.count || 0);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleSettings = () => {
    setLocation('/settings');
    handleMenuClose();
  };

  const handleProfile = () => {
    setLocation('/my-profile');
    handleMenuClose();
  };

  const handleNotificationsClick = () => {
    setLocation('/notifications');
  };

  const getInitials = () => {
    if (!user) return '?';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        bgcolor: 'var(--card)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--card-foreground)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important', px: 2 }}>
        {/* Lijeva strana - Back ili Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {shouldShowBack && (
            <IconButton 
              onClick={handleBack}
              sx={{ color: 'var(--card-foreground)', mr: 0.5 }}
              data-testid="button-back"
            >
              <ArrowBack />
            </IconButton>
          )}
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--primary)',
              letterSpacing: '-0.02em'
            }}
            data-testid="appbar-title"
          >
            {title}
          </Typography>
        </Box>

        {/* Desna strana - Bodovi, Notifikacije i Avatar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Bodovi */}
          {user && (
            <Chip
              icon={<EmojiEvents sx={{ fontSize: '16px !important' }} />}
              label={totalPoints}
              size="small"
              sx={{
                bgcolor: 'hsl(36 100% 94%)',
                color: 'hsl(14 100% 45%)',
                fontWeight: 700,
                fontSize: '13px',
                height: '28px',
                '& .MuiChip-icon': {
                  color: 'hsl(14 100% 45%)',
                  marginLeft: '6px'
                }
              }}
              data-testid="chip-total-points"
            />
          )}
          
          {/* Notifikacije */}
          <IconButton 
            onClick={handleNotificationsClick}
            sx={{ color: 'var(--card-foreground)' }}
            data-testid="button-notifications"
          >
            <Badge 
              badgeContent={totalNotifications} 
              color="error"
              max={99}
            >
              <Notifications />
            </Badge>
          </IconButton>

          {/* User Avatar sa Menijem */}
          {user && (
            <>
              <IconButton 
                onClick={handleMenuOpen}
                sx={{ p: 0.5 }}
                data-testid="button-user-menu"
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    bgcolor: 'var(--primary)',
                    fontSize: '14px',
                    fontWeight: 600
                  }}
                >
                  {getInitials()}
                </Avatar>
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                data-testid="menu-user"
              >
                <MenuItem onClick={handleProfile} data-testid="menuitem-profile">
                  <Person sx={{ mr: 1 }} />
                  {t('common.profile', 'Profil')}
                </MenuItem>
                {user?.isAdmin && (
                  <MenuItem onClick={handleSettings} data-testid="menuitem-settings">
                    <Settings sx={{ mr: 1 }} />
                    {t('common.settings', 'Podešavanja')}
                  </MenuItem>
                )}
                <MenuItem onClick={handleLogout} data-testid="menuitem-logout">
                  <Logout sx={{ mr: 1 }} />
                  {t('common.logout', 'Odjavi se')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
