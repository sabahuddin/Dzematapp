import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Divider,
  Badge,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  Dashboard,
  People,
  Campaign,
  Event,
  Task,
  Menu,
  Mail,
  QuestionAnswer,
  Radio,
  Phone,
  Email,
  LocationOn,
  Settings,
  Description,
  Assignment,
  Store,
  Schedule,
  Info,
  AttachMoney,
  Timeline,
  EmojiEvents,
  Work,
  CardGiftcard,
  ExpandLess,
  ExpandMore,
  OndemandVideo,
  DynamicFeed
} from '@mui/icons-material';
import { SiFacebook, SiInstagram, SiYoutube, SiX } from 'react-icons/si';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationSettings } from '@shared/schema';
import mosqueLogoPath from '@assets/ChatGPT Image 20. okt 2025. u 22_58_31_1760993927064.png';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  width: number;
}

export default function Sidebar({ open, collapsed, onToggle, onClose, width }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { t } = useTranslation(['navigation']);
  const [priznanjaOpen, setPriznanjaOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const menuItems: Array<{
    path: string;
    label: string;
    labelForMember?: string;
    pathForMember?: string;
    icon: any;
    adminOnly?: boolean;
    showBadge?: boolean;
  }> = [
    { path: '/dashboard', label: t('navigation:menu.dashboard'), icon: Dashboard },
    { path: '/feed', label: 'Feed', icon: DynamicFeed },
    { path: '/users', label: t('navigation:menu.users'), labelForMember: t('navigation:menu.profile'), icon: People },
    { path: '/finances', label: t('navigation:menu.finances'), labelForMember: t('navigation:menu.myPayments'), icon: AttachMoney },
    { path: '/activity-log', label: t('navigation:menu.activityLog'), labelForMember: t('navigation:menu.myActivities'), icon: Timeline },
    { path: '/projects', label: t('navigation:menu.projects'), icon: Work },
    { path: '/announcements', label: t('navigation:menu.announcements'), icon: Campaign, showBadge: true },
    { path: '/events', label: t('navigation:menu.events'), icon: Event, showBadge: true },
    { path: '/tasks', label: t('navigation:menu.tasks'), labelForMember: t('navigation:menu.sections'), icon: Task, showBadge: true },
    { path: '/messages', label: t('navigation:menu.messages'), icon: Mail, showBadge: true },
    { path: '/ask-imam', label: t('navigation:menu.askImam'), icon: QuestionAnswer, showBadge: true },
    { path: '/documents', label: t('navigation:menu.documents'), icon: Description },
    { path: '/shop', label: t('navigation:menu.shop'), icon: Store, showBadge: true },
    { path: '/applications', label: t('navigation:menu.applications'), icon: Assignment },
    { path: '/vaktija', label: t('navigation:menu.vaktija'), icon: Schedule },
    { path: '/vodic', label: t('navigation:menu.guide'), icon: Info },
    { path: '/settings', label: 'Podešavanja', icon: Settings, adminOnly: true },
  ];

  const priznanjaItems = [
    { path: '/my-certificates', label: 'Moje zahvale', icon: CardGiftcard, showBadge: true, memberOnly: true },
    { path: '/my-badges', label: 'Moje značke', icon: EmojiEvents, memberOnly: true },
    { path: '/my-points', label: 'Moji bodovi', icon: Timeline, memberOnly: true },
    { path: '/certificates', label: 'Zahvalnice', icon: CardGiftcard, adminOnly: true },
    { path: '/badges-admin', label: 'Značke', icon: EmojiEvents, adminOnly: true },
  ];

  const mediaItems = [
    { path: '/livestream', label: t('navigation:menu.livestream'), icon: Radio },
    { path: '/livestream-settings', label: t('navigation:menu.livestreamSettings'), icon: Radio, adminOnly: true },
  ];

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000,
  });

  const { data: unviewedCertificatesCount } = useQuery<{ count: number }>({
    queryKey: ['/api/certificates/unviewed-count'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: notificationCounts } = useQuery<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number; accessRequests: number }>({
    queryKey: ['/api/notifications/unread'],
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: orgSettings } = useQuery<OrganizationSettings>({
    queryKey: ['/api/organization-settings'],
  });


  const handleNavigation = (path: string) => {
    setLocation(path);
    if (isMobile) {
      onClose();
    }
  };

  const sidebarContent = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid hsl(0 0% 88%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 64,
          width: '100%',
          justifyContent: collapsed ? 'center' : 'flex-start'
        }}
      >
        <img 
          src={mosqueLogoPath} 
          alt="Mosque Logo" 
          style={{ width: 48, height: 48, objectFit: 'contain' }}
        />
        {!collapsed && (
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1976d2', fontFamily: 'Aladin, cursive' }}>
            DžematApp
          </Typography>
        )}
      </Box>

      {/* Navigation */}
      <List sx={{ py: 2, flex: 1, width: '100%', overflowX: 'hidden' }}>
        {/* Toggle Button as First Item */}
        <ListItem disablePadding sx={{ width: '100%', maxWidth: '100%', mb: 1 }}>
          <ListItemButton
            onClick={onToggle}
            sx={{
              mx: 1,
              borderRadius: 1,
              bgcolor: 'hsl(0 0% 96%)',
              color: '#1976d2',
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 0 : 2,
              minWidth: 0,
              '&:hover': {
                bgcolor: '#e3f2fd',
                color: '#1976d2'
              }
            }}
            data-testid="sidebar-toggle"
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 'auto' : 40, justifyContent: 'center' }}>
              <Menu />
            </ListItemIcon>
            {!collapsed && <ListItemText primary={t('navigation:toggleSidebar')} />}
          </ListItemButton>
        </ListItem>

        <Divider sx={{ mb: 1 }} />

        {menuItems.map((item) => {
          // Hide admin-only items from non-admin users
          if (item.adminOnly && !user?.isAdmin) {
            return null;
          }

          const Icon = item.icon;
          
          // Use different path for non-admin users if pathForMember is defined
          const itemPath = (!user?.isAdmin && item.pathForMember) ? item.pathForMember : item.path;
          const isActive = location === itemPath;
          
          // Determine badge count based on item path
          let badgeCount = 0;
          if (item.showBadge && notificationCounts) {
            switch (item.path) {
              case '/announcements':
                badgeCount = notificationCounts.announcements;
                break;
              case '/events':
                badgeCount = notificationCounts.events;
                break;
              case '/tasks':
                // For admin, show pending access requests count; for members, show tasks count
                badgeCount = user?.isAdmin ? notificationCounts.accessRequests : notificationCounts.tasks;
                break;
              case '/messages':
                badgeCount = unreadCount?.count || 0;
                break;
              case '/ask-imam':
                badgeCount = notificationCounts.imamQuestions;
                break;
              case '/shop':
                badgeCount = notificationCounts.shop;
                break;
            }
          }
          
          const showBadge = item.showBadge && badgeCount > 0;
          
          // Use different label for non-admin users if labelForMember is defined
          const displayLabel = (!user?.isAdmin && item.labelForMember) ? item.labelForMember : item.label;
          
          const buttonContent = (
            <ListItemButton
              onClick={() => handleNavigation(itemPath)}
              sx={{
                mx: 1,
                borderRadius: 1,
                bgcolor: isActive ? '#e3f2fd' : 'transparent',
                color: isActive ? '#1976d2' : '#666',
                borderRight: isActive ? '3px solid #1976d2' : 'none',
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 2,
                minWidth: 0,
                '&:hover': {
                  bgcolor: 'hsl(0 0% 96%)',
                  color: '#1976d2'
                }
              }}
              data-testid={`nav-${item.path.slice(1)}`}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 'auto' : 40, justifyContent: 'center' }}>
                {showBadge ? (
                  <Badge badgeContent={badgeCount} color="error" data-testid={`badge-${item.path.slice(1)}`}>
                    <Icon />
                  </Badge>
                ) : (
                  <Icon />
                )}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={displayLabel} />}
            </ListItemButton>
          );

          return (
            <ListItem key={item.path} disablePadding sx={{ width: '100%', maxWidth: '100%' }}>
              {collapsed ? (
                <Tooltip title={displayLabel} placement="right">
                  {buttonContent}
                </Tooltip>
              ) : (
                buttonContent
              )}
            </ListItem>
          );
        })}

        {/* Priznanja Menu Group */}
        <ListItem disablePadding sx={{ width: '100%', maxWidth: '100%' }}>
          <ListItemButton
            onClick={() => setPriznanjaOpen(!priznanjaOpen)}
            sx={{
              mx: 1,
              borderRadius: 1,
              bgcolor: 'transparent',
              color: '#666',
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 0 : 2,
              minWidth: 0,
              '&:hover': {
                bgcolor: 'hsl(0 0% 96%)',
                color: '#1976d2'
              }
            }}
            data-testid="nav-priznanja-group"
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 'auto' : 40, justifyContent: 'center' }}>
              {unviewedCertificatesCount && unviewedCertificatesCount.count > 0 ? (
                <Badge badgeContent={unviewedCertificatesCount.count} color="error" data-testid="badge-priznanja">
                  <CardGiftcard />
                </Badge>
              ) : (
                <CardGiftcard />
              )}
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText primary="Priznanja" />
                {priznanjaOpen ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </ListItemButton>
        </ListItem>
        {!collapsed && (
          <Collapse in={priznanjaOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {priznanjaItems.map((item: any) => {
                // Don't render until user is loaded
                if (!user) return null;
                if (item.adminOnly && !user.isAdmin) return null;
                if (item.memberOnly && user.isAdmin) return null;
                
                const Icon = item.icon;
                const isActive = location === item.path;
                let badgeCount = 0;
                
                if (item.path === '/my-certificates' && unviewedCertificatesCount) {
                  badgeCount = unviewedCertificatesCount.count || 0;
                }
                
                const showBadge = item.showBadge && badgeCount > 0;
                
                return (
                  <ListItem key={item.path} disablePadding sx={{ width: '100%', maxWidth: '100%' }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        mx: 1,
                        ml: 4,
                        borderRadius: 1,
                        bgcolor: isActive ? '#e3f2fd' : 'transparent',
                        color: isActive ? '#1976d2' : '#666',
                        borderRight: isActive ? '3px solid #1976d2' : 'none',
                        px: 2,
                        '&:hover': {
                          bgcolor: 'hsl(0 0% 96%)',
                          color: '#1976d2'
                        }
                      }}
                      data-testid={`nav-${item.path.slice(1)}`}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: 40, justifyContent: 'center' }}>
                        {showBadge ? (
                          <Badge badgeContent={badgeCount} color="error">
                            <Icon />
                          </Badge>
                        ) : (
                          <Icon />
                        )}
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}

        {/* Media Menu Group */}
        <ListItem disablePadding sx={{ width: '100%', maxWidth: '100%' }}>
          <ListItemButton
            onClick={() => setMediaOpen(!mediaOpen)}
            sx={{
              mx: 1,
              borderRadius: 1,
              bgcolor: 'transparent',
              color: '#666',
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 0 : 2,
              minWidth: 0,
              '&:hover': {
                bgcolor: 'hsl(0 0% 96%)',
                color: '#1976d2'
              }
            }}
            data-testid="nav-media-group"
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 'auto' : 40, justifyContent: 'center' }}>
              <OndemandVideo />
            </ListItemIcon>
            {!collapsed && (
              <>
                <ListItemText primary={t('navigation:menu.mediaGroup')} />
                {mediaOpen ? <ExpandLess /> : <ExpandMore />}
              </>
            )}
          </ListItemButton>
        </ListItem>
        {!collapsed && (
          <Collapse in={mediaOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {mediaItems.map((item) => {
                if (item.adminOnly && !user?.isAdmin) return null;
                
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <ListItem key={item.path} disablePadding sx={{ width: '100%', maxWidth: '100%' }}>
                    <ListItemButton
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        mx: 1,
                        ml: 4,
                        borderRadius: 1,
                        bgcolor: isActive ? '#e3f2fd' : 'transparent',
                        color: isActive ? '#1976d2' : '#666',
                        borderRight: isActive ? '3px solid #1976d2' : 'none',
                        px: 2,
                        '&:hover': {
                          bgcolor: 'hsl(0 0% 96%)',
                          color: '#1976d2'
                        }
                      }}
                      data-testid={`nav-${item.path.slice(1)}`}
                    >
                      <ListItemIcon sx={{ color: 'inherit', minWidth: 40, justifyContent: 'center' }}>
                        <Icon />
                      </ListItemIcon>
                      <ListItemText primary={item.label} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          </Collapse>
        )}
      </List>

      {/* Info Section and Social Media */}
      {!collapsed && (
        <Box sx={{ borderTop: '1px solid hsl(0 0% 88%)', p: 2 }}>
          {/* Džemat Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
              {t('navigation:contactInfo')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    {orgSettings?.name || t('navigation:fallbackOrgName')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {orgSettings?.address || t('navigation:fallbackAddress')}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {orgSettings?.phone || t('navigation:fallbackPhone')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {orgSettings?.email || t('navigation:fallbackEmail')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Social Media Icons */}
          {(orgSettings?.facebookUrl || orgSettings?.instagramUrl || orgSettings?.youtubeUrl || orgSettings?.twitterUrl) && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
                {t('navigation:socialMedia')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
                {orgSettings?.facebookUrl && (
                  <IconButton
                    component="a"
                    href={orgSettings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ 
                      color: '#1877f2',
                      '&:hover': { bgcolor: '#e3f2fd' }
                    }}
                    data-testid="social-facebook"
                  >
                    <SiFacebook size={20} />
                  </IconButton>
                )}
                {orgSettings?.instagramUrl && (
                  <IconButton
                    component="a"
                    href={orgSettings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ 
                      color: '#e4405f',
                      '&:hover': { bgcolor: '#fce4ec' }
                    }}
                    data-testid="social-instagram"
                  >
                    <SiInstagram size={20} />
                  </IconButton>
                )}
                {orgSettings?.youtubeUrl && (
                  <IconButton
                    component="a"
                    href={orgSettings.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ 
                      color: '#ff0000',
                      '&:hover': { bgcolor: '#ffebee' }
                    }}
                    data-testid="social-youtube"
                  >
                    <SiYoutube size={20} />
                  </IconButton>
                )}
                {orgSettings?.twitterUrl && (
                  <IconButton
                    component="a"
                    href={orgSettings.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ 
                      color: '#000000',
                      '&:hover': { bgcolor: 'hsl(0 0% 96%)' }
                    }}
                    data-testid="social-twitter"
                  >
                    <SiX size={20} />
                  </IconButton>
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: width,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: width,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.standard,
          }),
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
}
