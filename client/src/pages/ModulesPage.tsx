import { Box, Paper, Typography } from '@mui/material';
import {
  Announcement,
  Email,
  Church,
  Favorite,
  Help,
  MenuBook,
  AccountBalance,
  BarChart,
  People,
  Feed,
  Description,
  EmojiEvents,
  Tv,
  Settings,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

interface ModuleItem {
  icon: React.ReactNode;
  label: string;
  route: string;
  testId: string;
}

export default function ModulesPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  const modules: ModuleItem[] = [
    { icon: <Announcement sx={{ fontSize: 48 }} />, label: t('sidebar.announcements'), route: '/announcements', testId: 'module-announcements' },
    { icon: <Email sx={{ fontSize: 48 }} />, label: 'Pristupnica', route: '/membership-applications', testId: 'module-membership' },
    { icon: <Church sx={{ fontSize: 48 }} />, label: 'Akika', route: '/applications', testId: 'module-akika' },
    { icon: <Favorite sx={{ fontSize: 48 }} />, label: 'Vjenčanje', route: '/applications', testId: 'module-marriage' },
    { icon: <Help sx={{ fontSize: 48 }} />, label: t('sidebar.askImam'), route: '/ask-imam', testId: 'module-ask-imam' },
    { icon: <MenuBook sx={{ fontSize: 48 }} />, label: t('sidebar.vaktija'), route: '/vaktija', testId: 'module-vaktija' },
    { icon: <AccountBalance sx={{ fontSize: 48 }} />, label: t('sidebar.projects'), route: '/projects', testId: 'module-projects' },
    { icon: <BarChart sx={{ fontSize: 48 }} />, label: t('sidebar.finances'), route: '/finances', testId: 'module-finances' },
    { icon: <People sx={{ fontSize: 48 }} />, label: t('sidebar.users'), route: '/users', testId: 'module-users' },
    { icon: <Feed sx={{ fontSize: 48 }} />, label: 'Feed', route: '/feed', testId: 'module-feed' },
    { icon: <Description sx={{ fontSize: 48 }} />, label: t('sidebar.documents'), route: '/documents', testId: 'module-documents' },
    { icon: <EmojiEvents sx={{ fontSize: 48 }} />, label: 'Priznanja', route: '/badges', testId: 'module-recognition' },
    { icon: <Tv sx={{ fontSize: 48 }} />, label: 'Media', route: '/livestream-settings', testId: 'module-media' },
    { icon: <Settings sx={{ fontSize: 48 }} />, label: t('sidebar.settings'), route: '/settings', testId: 'module-settings' },
  ];

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600, color: 'hsl(123 46% 34%)' }}>
        Moduli
      </Typography>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
        }}
      >
        {modules.map((module) => (
          <Paper
            key={module.route}
            onClick={() => setLocation(module.route)}
            data-testid={module.testId}
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              minHeight: 120,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 24px rgba(18, 94, 48, 0.18)',
              },
            }}
          >
            <Box sx={{ color: 'hsl(123 46% 54%)' }}>
              {module.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{
                mt: 1,
                textAlign: 'center',
                fontSize: '0.7rem',
                color: 'hsl(123 46% 34%)',
                fontWeight: 500,
              }}
            >
              {module.label}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
