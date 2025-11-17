import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import AppBar from './AppBar';
import BottomNavigation from './BottomNavigation';
import { MobileAppBar } from '../MobileAppBar';
import { useLocation } from 'wouter';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location] = useLocation();

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const sidebarWidth = sidebarCollapsed ? 64 : 280;

  // Mobile Layout - Fixed container
  if (isMobile) {
    return (
      <Box sx={{ 
        bgcolor: 'var(--background)', 
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top AppBar */}
        <Box sx={{ flexShrink: 0 }}>
          <MobileAppBar title="DžematApp" />
        </Box>

        {/* Main Content - Scrollable area */}
        <Box sx={{ 
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          p: 2,
        }}>
          {children}
        </Box>

        {/* Bottom Navigation */}
        <Box sx={{ flexShrink: 0 }}>
          <BottomNavigation />
        </Box>
      </Box>
    );
  }

  // Desktop Layout - Original layout
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        onClose={() => setSidebarOpen(false)}
        width={sidebarWidth}
      />
      
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          width: '100%',
        }}
      >
        <AppBar onMenuClick={handleSidebarToggle} />
        
        <Box 
          component="main" 
          sx={{ 
            flex: 1, 
            p: { xs: 2, sm: 3 },
            bgcolor: 'hsl(240 4% 96%)',
            overflowY: 'auto',
            width: '100%',
            maxWidth: '100%'
          }}
        >
          <Box sx={{ 
            margin: '0 auto',
            width: '100%'
          }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
