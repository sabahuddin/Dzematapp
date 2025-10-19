import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import AppBar from './AppBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const sidebarWidth = sidebarCollapsed ? 64 : 280;

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
            bgcolor: '#fafafa',
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
