import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import AppBar from './AppBar';
import BottomNavigation, { BOTTOM_NAV_HEIGHT } from './BottomNavigation';
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

  // Mobile Layout - Sticky container with natural scroll
  if (isMobile) {
    return (
      <Box sx={{ 
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'var(--background)',
      }}>
        {/* Top AppBar - Sticky at top */}
        <Box sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1100,
          bgcolor: 'var(--card)',
        }}>
          <MobileAppBar title="DžematApp" />
        </Box>

        {/* Main Content - Scrollable with proper padding */}
        <Box 
          sx={{ 
            flex: 1,
            px: 2,
            pt: 2,
            pb: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom, 0px) + 16px)`,
          }}
        >
          {children}
        </Box>

        {/* Bottom Navigation - Sticky at bottom */}
        <Box sx={{ 
          position: 'sticky',
          bottom: 0,
          zIndex: 1100,
          marginTop: 'auto',
        }}>
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
