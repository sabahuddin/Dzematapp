import { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { Box, Typography, Button, Card, CardContent } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { Link } from 'wouter';

export const ALL_MODULES = {
  dashboard: { id: 'dashboard', name: 'Kontrolna ploča', icon: 'Dashboard' },
  announcements: { id: 'announcements', name: 'Objave', icon: 'Campaign' },
  events: { id: 'events', name: 'Aktivnosti', icon: 'Event' },
  vaktija: { id: 'vaktija', name: 'Vaktija', icon: 'AccessTime' },
  users: { id: 'users', name: 'Članovi', icon: 'People' },
  tasks: { id: 'tasks', name: 'Zadaci', icon: 'Assignment' },
  messages: { id: 'messages', name: 'Poruke', icon: 'Mail' },
  askImam: { id: 'askImam', name: 'Pitanja za Imama', icon: 'QuestionAnswer' },
  'ask-imam': { id: 'ask-imam', name: 'Ask Imam (EN)', icon: 'QuestionAnswer' },
  shop: { id: 'shop', name: 'Shop', icon: 'Store' },
  marketplace: { id: 'marketplace', name: 'Tržišnica', icon: 'LocalOffer' },
  requests: { id: 'requests', name: 'Zahtjevi', icon: 'Assignment' },
  finances: { id: 'finances', name: 'Finansije', icon: 'AccountBalance' },
  projects: { id: 'projects', name: 'Projekti', icon: 'Folder' },
  activity: { id: 'activity', name: 'Aktivnost', icon: 'Visibility' },
  'activity-log': { id: 'activity-log', name: 'Dnevnik aktivnosti', icon: 'History' },
  documents: { id: 'documents', name: 'Dokumenti', icon: 'Folder' },
  certificates: { id: 'certificates', name: 'Zahvale/Certifikati', icon: 'CardMembership' },
  badges: { id: 'badges', name: 'Značke', icon: 'EmojiEvents' },
  points: { id: 'points', name: 'Poeni', icon: 'Stars' },
  media: { id: 'media', name: 'Mediji/Livestream', icon: 'VideoLibrary' },
  livestream: { id: 'livestream', name: 'Direktan prenos', icon: 'Video' },
  settings: { id: 'settings', name: 'Postavke', icon: 'Settings' },
  guide: { id: 'guide', name: 'Vodiči', icon: 'Help' },
  vodic: { id: 'vodic', name: 'Vodič', icon: 'Help' },
  sponsors: { id: 'sponsors', name: 'Sponzori', icon: 'Favorite' },
  applications: { id: 'applications', name: 'Aplikacije', icon: 'Description' },
} as const;

export type ModuleId = keyof typeof ALL_MODULES;

interface ModuleContextType {
  enabledModules: string[];
  isModuleEnabled: (moduleId: ModuleId) => boolean;
  allModules: typeof ALL_MODULES;
}

const ModuleContext = createContext<ModuleContextType>({
  enabledModules: [],
  isModuleEnabled: () => false,
  allModules: ALL_MODULES,
});

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const enabledModules = useMemo(() => {
    if (user?.isSuperAdmin) {
      return Object.keys(ALL_MODULES);
    }
    // Get enabled modules from tenant, with fallback to basic modules
    const tenantModules = user?.tenant?.enabledModules;
    console.log('[ModuleContext] User tenant:', user?.tenant);
    console.log('[ModuleContext] Enabled modules:', tenantModules);
    return tenantModules || ['dashboard', 'announcements', 'events', 'vaktija', 'users'];
  }, [user]);

  const isModuleEnabled = (moduleId: ModuleId): boolean => {
    if (user?.isSuperAdmin) return true;
    return enabledModules.includes(moduleId);
  };

  return (
    <ModuleContext.Provider value={{ enabledModules, isModuleEnabled, allModules: ALL_MODULES }}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules() {
  return useContext(ModuleContext);
}

interface ModuleGuardProps {
  moduleId: ModuleId;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ModuleGuard({ moduleId, children, fallback }: ModuleGuardProps) {
  const { isModuleEnabled, allModules } = useModules();
  
  if (isModuleEnabled(moduleId)) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  const moduleName = allModules[moduleId]?.name || moduleId;
  
  return (
    <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <Card sx={{ maxWidth: 400, textAlign: 'center' }}>
        <CardContent sx={{ p: 4 }}>
          <Lock sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Modul nije dostupan
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            <strong>{moduleName}</strong> nije uključen u vaš paket. 
            Kontaktirajte administratora za pristup ovom modulu.
          </Typography>
          <Link href="/">
            <Button variant="contained" data-testid="button-back-home">
              Nazad na početnu
            </Button>
          </Link>
        </CardContent>
      </Card>
    </Box>
  );
}

export function ModuleChip({ moduleId }: { moduleId: ModuleId }) {
  const { isModuleEnabled, allModules } = useModules();
  const enabled = isModuleEnabled(moduleId);
  const moduleName = allModules[moduleId]?.name || moduleId;
  
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        bgcolor: enabled ? 'hsl(160 40% 95%)' : 'hsl(0 0% 95%)',
        color: enabled ? '#26A69A' : 'text.secondary',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      {!enabled && <Lock sx={{ fontSize: 14 }} />}
      {moduleName}
    </Box>
  );
}
