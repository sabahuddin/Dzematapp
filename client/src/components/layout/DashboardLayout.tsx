import React, { useState, useRef, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import AppBar from './AppBar';
import BottomNavigation, { BOTTOM_NAV_HEIGHT } from './BottomNavigation';
import { MobileAppBar, MOBILE_APP_BAR_HEIGHT } from '../MobileAppBar';
import { useLocation } from 'wouter';
import { useEdgeLockScroll } from '@/hooks/useEdgeLockScroll';

const MOBILE_CONTENT_PADDING = 16;

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
  
  useEdgeLockScroll(scrollRef);

  // Lock body scroll on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isMobile]);

  // Reset scroll to top when route changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [location]);

  // Mobile Layout - Fixed headers/footers with locked scroll
  if (isMobile) {
    return (
      <Box sx={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top AppBar - Fixed at top */}
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          bgcolor: '#1a1a1a',
        }}>
          <MobileAppBar title="DžematApp" />
        </Box>

        {/* Main Content - Scrollable area */}
        <Box 
          ref={scrollRef}
          sx={{ 
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            pt: `calc(${MOBILE_APP_BAR_HEIGHT}px + ${MOBILE_CONTENT_PADDING}px)`,
            pb: `calc(${BOTTOM_NAV_HEIGHT}px + ${MOBILE_CONTENT_PADDING}px)`,
            px: 2,
            bgcolor: '#121212',
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
