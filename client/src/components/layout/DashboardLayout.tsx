import React, { useState, useRef } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import AppBar from './AppBar';
import BottomNavigation, { BOTTOM_NAV_HEIGHT } from './BottomNavigation';
import { MobileAppBar } from '../MobileAppBar';
import { useLocation } from 'wouter';
import { useEdgeLockScroll } from '@/hooks/useEdgeLockScroll';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Apply edge lock scroll for mobile
  useEdgeLockScroll(scrollRef);

  // Mobile Layout - Fixed container
  if (isMobile) {
    return (
      <Box sx={{ 
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Top AppBar - Fixed at top */}
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: 'var(--card)',
        }}>
          <MobileAppBar title="DžematApp" />
        </Box>

        {/* Main Content - Scrollable with padding for fixed elements */}
        <Box 
          ref={scrollRef}
          sx={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            pt: '80px',
            pb: `${BOTTOM_NAV_HEIGHT + 24}px`,
            px: 2,
            bgcolor: 'var(--background)',
          }}
        >
          {children}
        </Box>

        {/* Bottom Navigation - Fixed at bottom */}
        <Box sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
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
