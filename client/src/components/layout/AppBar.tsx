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
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Person,
  Logout
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface AppBarProps {
  onMenuClick: () => void;
}

export default function AppBar({ onMenuClick }: AppBarProps) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMobile = window.innerWidth < 900;

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const getPageTitle = () => {
    // This would be better managed through a context or state management
    // For now, we'll return a default title
    return 'Dashboard';
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
            Dobrodošli u DžematApp Admin Panel
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2' }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          
          <Box sx={{ ml: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.isAdmin ? 'Administrator' : 'Korisnik'}
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
          <MenuItem onClick={handleProfileMenuClose} data-testid="menu-profile">
            <ListItemIcon>
              <Person fontSize="small" />
            </ListItemIcon>
            <ListItemText>Moj Profil</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleLogout} data-testid="menu-logout">
            <ListItemIcon>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText>Odjava</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
}
