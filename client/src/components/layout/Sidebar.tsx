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
  Badge
} from '@mui/material';
import {
  Dashboard,
  People,
  Campaign,
  Event,
  Task,
  Hub,
  Menu,
  Mail,
  QuestionAnswer,
  Radio,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import { SiFacebook, SiInstagram, SiYoutube, SiTwitter } from 'react-icons/si';

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onClose: () => void;
  width: number;
}

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Dashboard },
  { path: '/users', label: 'Korisnici', icon: People },
  { path: '/announcements', label: 'Obavijesti', icon: Campaign },
  { path: '/events', label: 'Događaji', icon: Event },
  { path: '/tasks', label: 'Task Manager', icon: Task },
  { path: '/messages', label: 'Poruke', icon: Mail, showBadge: true },
  { path: '/ask-imam', label: 'Pitaj imama', icon: QuestionAnswer },
  { path: '/livestream', label: 'Livestream', icon: Radio },
];

export default function Sidebar({ open, collapsed, onToggle, onClose, width }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['/api/messages/unread-count'],
    refetchInterval: 30000,
  });

  const handleNavigation = (path: string) => {
    setLocation(path);
    if (isMobile) {
      onClose();
    }
  };

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          minHeight: 64
        }}
      >
        <Hub sx={{ color: '#1976d2', fontSize: 24 }} />
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
            JamatHub
          </Typography>
        )}
        <IconButton 
          onClick={onToggle}
          sx={{ ml: 'auto' }}
          data-testid="sidebar-toggle"
        >
          <Menu />
        </IconButton>
      </Box>

      {/* Navigation */}
      <List sx={{ py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          const showUnreadBadge = item.showBadge && unreadCount && unreadCount.count > 0;
          
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  borderRadius: 1,
                  bgcolor: isActive ? '#e3f2fd' : 'transparent',
                  color: isActive ? '#1976d2' : '#666',
                  borderRight: isActive ? '3px solid #1976d2' : 'none',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    color: '#1976d2'
                  }
                }}
                data-testid={`nav-${item.path.slice(1)}`}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {showUnreadBadge ? (
                    <Badge badgeContent={unreadCount.count} color="error" data-testid="badge-unread-messages">
                      <Icon />
                    </Badge>
                  ) : (
                    <Icon />
                  )}
                </ListItemIcon>
                {!collapsed && <ListItemText primary={item.label} />}
              </ListItemButton>
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
                    Islamska Zajednica
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Ulica Džemata 123
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  +387 33 123 456
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  info@dzemat.ba
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          {/* Social Media Icons */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#1976d2' }}>
              Društvene mreže
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-start' }}>
              <IconButton
                component="a"
                href="https://facebook.com"
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
              <IconButton
                component="a"
                href="https://instagram.com"
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
              <IconButton
                component="a"
                href="https://youtube.com"
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
              <IconButton
                component="a"
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ 
                  color: '#1da1f2',
                  '&:hover': { bgcolor: '#e3f2fd' }
                }}
                data-testid="social-twitter"
              >
                <SiTwitter size={20} />
              </IconButton>
            </Box>
          </Box>
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
