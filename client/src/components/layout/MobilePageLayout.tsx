import { Box } from '@mui/material';
import { MobileAppBar } from '../MobileAppBar';
import BottomNavigation from './BottomNavigation';
import { ReactNode } from 'react';

interface MobilePageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
}

export function MobilePageLayout({ children, title = 'DžematApp', showBack }: MobilePageLayoutProps) {
  return (
    <Box sx={{ 
      bgcolor: 'var(--background)', 
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Top AppBar - Fixed */}
      <Box sx={{ flexShrink: 0 }}>
        <MobileAppBar title={title} showBack={showBack} />
      </Box>

      {/* Main Content - Scrollable area */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        p: 2,
        pt: 1,
        pb: 2,
      }}>
        {children}
      </Box>

      {/* Bottom Navigation - Fixed */}
      <Box sx={{ flexShrink: 0 }}>
        <BottomNavigation />
      </Box>
    </Box>
  );
}
