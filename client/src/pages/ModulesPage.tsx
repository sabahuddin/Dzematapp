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
  Assignment,
  Store,
  CalendarMonth,
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
  const { t } = useTranslation();
  const { user } = useAuth();

  // Ordered same as webapp sidebar menu
  const modules: ModuleItem[] = [
    { icon: <Feed sx={{ fontSize: 48 }} />, label: 'Feed', description: 'Aktivnosti zajednice', route: '/feed', testId: 'module-feed' },
    { icon: <People sx={{ fontSize: 48 }} />, label: user?.isAdmin ? 'Korisnici' : 'Moje aktivnosti', description: user?.isAdmin ? 'Članovi džemata' : 'Pregled aktivnosti', route: user?.isAdmin ? '/users' : '/activity-log', testId: 'module-users' },
    { icon: <BarChart sx={{ fontSize: 48 }} />, label: user?.isAdmin ? 'Finansije' : 'Moje uplate', description: user?.isAdmin ? 'Finansijski pregled' : 'Moje donacije', route: '/finances', testId: 'module-finances' },
    { icon: <BarChart sx={{ fontSize: 48 }} />, label: user?.isAdmin ? 'Izvještaj aktivnosti' : 'Moje aktivnosti', description: 'Pregled aktivnosti', route: '/activity-log', testId: 'module-activity', adminOnly: true },
    { icon: <AccountBalance sx={{ fontSize: 48 }} />, label: 'Projekti', description: 'Projekti džemata', route: '/projects', testId: 'module-projects' },
    { icon: <Announcement sx={{ fontSize: 48 }} />, label: 'Obavještenja', description: 'Obavještenja džemata', route: '/announcements', testId: 'module-announcements' },
    { icon: <CalendarMonth sx={{ fontSize: 48 }} />, label: 'Događaji', description: 'Događaji i aktivnosti', route: '/events', testId: 'module-events' },
    { icon: <Assignment sx={{ fontSize: 48 }} />, label: user?.isAdmin ? 'Zadaci' : 'Sekcije', description: 'Sekcije i zadaci', route: '/tasks', testId: 'module-tasks' },
    { icon: <Email sx={{ fontSize: 48 }} />, label: 'Poruke', description: 'Obavještenja i poruke', route: '/messages', testId: 'module-messages' },
    { icon: <Help sx={{ fontSize: 48 }} />, label: 'Pitaj Imama', description: 'Pitanja za imama', route: '/ask-imam', testId: 'module-ask-imam' },
    { icon: <Description sx={{ fontSize: 48 }} />, label: 'Dokumenti', description: 'Dokumenti džemata', route: '/documents', testId: 'module-documents' },
    { icon: <Store sx={{ fontSize: 48 }} />, label: 'Trgovina', description: 'DžematShop i oglasnik', route: '/shop', testId: 'module-shop' },
    { icon: <Assignment sx={{ fontSize: 48 }} />, label: 'Prijave', description: 'Pristupnica, Akika, Vjenčanje', route: '/applications', testId: 'module-applications' },
    { icon: <MenuBook sx={{ fontSize: 48 }} />, label: 'Vaktija', description: 'Raspored namaza', route: '/vaktija', testId: 'module-vaktija' },
    { icon: <Help sx={{ fontSize: 48 }} />, label: 'Vodič', description: 'Vodič kroz aplikaciju', route: '/vodic', testId: 'module-guide' },
    { icon: <EmojiEvents sx={{ fontSize: 48 }} />, label: 'Moje aktivnosti', description: 'Aktivnosti, zahvalnice, značke i bodovi', route: '/recognitions', testId: 'module-recognition' },
    { icon: <Tv sx={{ fontSize: 48 }} />, label: 'Media', description: 'Livestream i snimci', route: '/livestream', testId: 'module-media' },
    { icon: <Settings sx={{ fontSize: 48 }} />, label: 'Podešavanja', description: 'Podešavanja džemata', route: '/settings', testId: 'module-settings', adminOnly: true },
  ].filter(m => !m.adminOnly || user?.isAdmin);

  return (
    <Box>
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
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 16px rgba(18, 94, 48, 0.18)',
              },
            }}
          >
            <Box sx={{ color: 'hsl(123 46% 54%)', mb: 1 }}>
              {module.icon}
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
              {module.label}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}
