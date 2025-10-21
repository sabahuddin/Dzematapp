import React from 'react';
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
  Tooltip
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
  Store
} from '@mui/icons-material';
import { SiFacebook, SiInstagram, SiYoutube, SiX } from 'react-icons/si';
import { useAuth } from '@/contexts/AuthContext';
import type { OrganizationSettings } from '@shared/schema';
import mosqueLogoPath from '@assets/ChatGPT Image 20. okt 2025. u 22_58_31_1760993927064.png';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  width: number;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Dashboard },
  { path: '/users', label: 'Korisnici', labelForMember: 'Profil', icon: People },
  { path: '/announcements', label: 'Obavijesti', icon: Campaign, showBadge: true },
  { path: '/events', label: 'Događaji', icon: Event, showBadge: true },
  { path: '/tasks', label: 'Sekcije', icon: Task, showBadge: true },
  { path: '/sections', label: 'Sve sekcije', icon: Assignment, hideForAdmin: true },
  { path: '/messages', label: 'Poruke', icon: Mail, showBadge: true },
  { path: '/ask-imam', label: 'Pitaj imama', icon: QuestionAnswer, showBadge: true },
  { path: '/documents', label: 'Dokumenti', icon: Description },
  { path: '/shop', label: 'Shop', icon: Store, showBadge: true },
  { path: '/requests', label: 'Zahtjevi i prijave', icon: Assignment },
  { path: '/livestream', label: 'Livestream', icon: Radio },
  { path: '/livestream-settings', label: 'Livestream uprav.', icon: Radio, adminOnly: true },
  { path: '/organization-settings', label: 'Org. podaci', icon: Settings, adminOnly: true },
];

export default function Sidebar({ open, collapsed, onToggle, onClose, width }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000,
  });

  const { data: notificationCounts } = useQuery<{ shop: number; events: number; announcements: number; imamQuestions: number; tasks: number }>({
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
          borderBottom: '1px solid #e0e0e0',
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
              bgcolor: '#f5f5f5',
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
            {!collapsed && <ListItemText primary="Zatvori/Otvori" />}
          </ListItemButton>
        </ListItem>

        <Divider sx={{ mb: 1 }} />

        {menuItems.map((item) => {
          // Hide admin-only items from non-admin users
          if (item.adminOnly && !user?.isAdmin) {
            return null;
          }

          // Hide items marked as hideForAdmin from admin users
          if (item.hideForAdmin && user?.isAdmin) {
            return null;
          }

          const Icon = item.icon;
          const isActive = location === item.path;
          
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
                badgeCount = notificationCounts.tasks;
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
              onClick={() => handleNavigation(item.path)}
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
                  bgcolor: '#f5f5f5',
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
      </List>

      {/* Info Section and Social Media */}
      {!collapsed && (
        <Box sx={{ borderTop: '1px solid #e0e0e0', p: 2 }}>
          {/* Džemat Info */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
              Informacije
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                <LocationOn sx={{ fontSize: 16, color: 'text.secondary', mt: 0.25 }} />
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                    {orgSettings?.name || 'Islamska Zajednica'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {orgSettings?.address || 'Ulica Džemata 123'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {orgSettings?.phone || '+387 33 123 456'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {orgSettings?.email || 'info@dzemat.ba'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Social Media Icons */}
          {(orgSettings?.facebookUrl || orgSettings?.instagramUrl || orgSettings?.youtubeUrl || orgSettings?.twitterUrl) && (
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
                Društvene mreže
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
                      '&:hover': { bgcolor: '#f5f5f5' }
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
