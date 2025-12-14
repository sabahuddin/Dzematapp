import { Box, Paper, Typography, Button, Divider } from '@mui/material';
import {
  Announcement,
  Email,
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
  Assignment,
  Store,
  CalendarMonth,
  Person,
  Logout,
  Receipt,
} from '@mui/icons-material';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';

interface ModuleItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  route: string;
  testId: string;
  adminOnly?: boolean;
}

export default function ModulesPage() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation('navigation');
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  // Ordered same as webapp sidebar menu - using translation keys
  const modules: ModuleItem[] = [
    { icon: <Feed sx={{ fontSize: 48 }} />, label: t('menu.feed'), description: '', route: '/feed', testId: 'module-feed' },
    { icon: <Person sx={{ fontSize: 48 }} />, label: t('menu.profile'), description: '', route: '/my-profile', testId: 'module-profile' },
    { icon: <People sx={{ fontSize: 48 }} />, label: user?.isAdmin ? t('menu.users') : t('menu.myActivities'), description: '', route: user?.isAdmin ? '/users' : '/my-activities', testId: 'module-users' },
    { icon: <BarChart sx={{ fontSize: 48 }} />, label: t('menu.finances'), description: '', route: '/finances', testId: 'module-finances', adminOnly: true },
    { icon: <Receipt sx={{ fontSize: 48 }} />, label: user?.isAdmin ? t('menu.membershipFees') : t('menu.myMembership'), description: '', route: user?.isAdmin ? '/membership-fees' : '/my-clanarina', testId: 'module-membership-fees' },
    { icon: <BarChart sx={{ fontSize: 48 }} />, label: t('menu.activityLog'), description: '', route: '/activity-log', testId: 'module-activity', adminOnly: true },
    { icon: <AccountBalance sx={{ fontSize: 48 }} />, label: t('menu.projects'), description: '', route: '/projects', testId: 'module-projects' },
    { icon: <Announcement sx={{ fontSize: 48 }} />, label: t('menu.announcements'), description: '', route: '/announcements', testId: 'module-announcements' },
    { icon: <CalendarMonth sx={{ fontSize: 48 }} />, label: t('menu.events'), description: '', route: '/events', testId: 'module-events' },
    { icon: <Assignment sx={{ fontSize: 48 }} />, label: user?.isAdmin ? t('menu.tasks') : t('menu.sections'), description: '', route: '/tasks', testId: 'module-tasks' },
    { icon: <Email sx={{ fontSize: 48 }} />, label: t('menu.messages'), description: '', route: '/messages', testId: 'module-messages' },
    { icon: <Help sx={{ fontSize: 48 }} />, label: t('menu.askImam'), description: '', route: '/ask-imam', testId: 'module-ask-imam' },
    { icon: <Description sx={{ fontSize: 48 }} />, label: t('menu.documents'), description: '', route: '/documents', testId: 'module-documents' },
    { icon: <Store sx={{ fontSize: 48 }} />, label: t('menu.shop'), description: '', route: '/shop', testId: 'module-shop' },
    { icon: <EmojiEvents sx={{ fontSize: 48 }} />, label: t('menu.sponsors'), description: '', route: '/sponsors', testId: 'module-sponsors' },
    { icon: <Assignment sx={{ fontSize: 48 }} />, label: t('menu.applications'), description: '', route: '/applications', testId: 'module-applications' },
    { icon: <MenuBook sx={{ fontSize: 48 }} />, label: t('menu.vaktija'), description: '', route: '/vaktija', testId: 'module-vaktija' },
    { icon: <Help sx={{ fontSize: 48 }} />, label: t('menu.guide'), description: '', route: '/vodic', testId: 'module-guide' },
    { icon: <Tv sx={{ fontSize: 48 }} />, label: t('menu.livestream'), description: '', route: '/livestream', testId: 'module-media' },
    { icon: <Settings sx={{ fontSize: 48 }} />, label: t('settings'), description: '', route: '/settings', testId: 'module-settings', adminOnly: true },
  ].filter(m => !m.adminOnly || user?.isAdmin);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#0D1B2A' }}>
        {t('modules', { defaultValue: 'Modules' })}
      </Typography>
      
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(3, 1fr)',
            sm: 'repeat(4, 1fr)',
            md: 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        {modules.map((module) => (
          <Paper
            key={module.testId}
            onClick={() => setLocation(module.route)}
            data-testid={module.testId}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: '120px',
              backgroundColor: '#ffffff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
              border: 'none',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 16px rgba(57, 73, 171, 0.15)',
              },
            }}
          >
            <Box sx={{ color: '#3949AB', mb: 1 }}>
              {module.icon}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {module.label}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          onClick={handleLogout}
          data-testid="button-logout"
          sx={{ px: 4 }}
        >
          {t('appBar.logout')}
        </Button>
      </Box>
    </Box>
  );
}
