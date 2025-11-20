/**
 * MODULE REGISTRY - Centralna definicija svih modula u DžematApp
 * 
 * Ovaj fajl definiše:
 * - Sve dostupne module u aplikaciji
 * - Koje module sadrži svaki subscription tier (Basic/Standard/Full)
 * - Read-only preview module za upsell marketing
 */

export type ModuleId =
  | 'dashboard'
  | 'users'
  | 'announcements'
  | 'events'
  | 'tasks'
  | 'messages'
  | 'askImam'
  | 'requests'
  | 'shop'
  | 'vaktija'
  | 'finances'
  | 'projects'
  | 'activity'
  | 'badges'
  | 'points'
  | 'certificates'
  | 'documents'
  | 'media'
  | 'settings'
  | 'guide';

export type SubscriptionTier = 'basic' | 'standard' | 'full';

export interface ModuleDefinition {
  id: ModuleId;
  name: string; // Display name
  nameKey: string; // i18n translation key
  description: string;
  icon: string; // Icon identifier
  route: string; // Frontend route path
  requiresAuth: boolean; // Requires login
  requiredRoles?: string[]; // Optional role requirements
  category: 'core' | 'communication' | 'management' | 'financial' | 'content';
}

/**
 * Kompletna definicija svih modula
 */
export const MODULE_DEFINITIONS: Record<ModuleId, ModuleDefinition> = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    nameKey: 'navigation.dashboard',
    description: 'Pregled aktivnosti i statistika',
    icon: 'Home',
    route: '/dashboard',
    requiresAuth: true,
    category: 'core',
  },
  users: {
    id: 'users',
    name: 'Korisnici',
    nameKey: 'navigation.users',
    description: 'Upravljanje članovima džemata',
    icon: 'Users',
    route: '/users',
    requiresAuth: true,
    requiredRoles: ['admin'],
    category: 'management',
  },
  announcements: {
    id: 'announcements',
    name: 'Obavještenja',
    nameKey: 'navigation.announcements',
    description: 'Objave i vijesti',
    icon: 'Bell',
    route: '/announcements',
    requiresAuth: false, // Public content
    category: 'communication',
  },
  events: {
    id: 'events',
    name: 'Događaji',
    nameKey: 'navigation.events',
    description: 'Kalendar događaja i važni datumi',
    icon: 'Calendar',
    route: '/events',
    requiresAuth: false, // Public content
    category: 'core',
  },
  tasks: {
    id: 'tasks',
    name: 'Sekcije',
    nameKey: 'navigation.workgroups',
    description: 'Radne grupe i zadaci',
    icon: 'Briefcase',
    route: '/work-groups',
    requiresAuth: true,
    category: 'management',
  },
  messages: {
    id: 'messages',
    name: 'Poruke',
    nameKey: 'navigation.messages',
    description: 'Interna komunikacija',
    icon: 'Mail',
    route: '/messages',
    requiresAuth: true,
    category: 'communication',
  },
  askImam: {
    id: 'askImam',
    name: 'Pitaj Imama',
    nameKey: 'navigation.askImam',
    description: 'Postavi pitanje imamu',
    icon: 'HelpCircle',
    route: '/ask-imam',
    requiresAuth: true,
    category: 'communication',
  },
  requests: {
    id: 'requests',
    name: 'Zahtjevi',
    nameKey: 'navigation.requests',
    description: 'Pristupnice, vjenčanja, akika',
    icon: 'FileText',
    route: '/requests',
    requiresAuth: false, // Guest can submit
    category: 'management',
  },
  shop: {
    id: 'shop',
    name: 'Trgovina',
    nameKey: 'navigation.shop',
    description: 'DžematShop i marketplace',
    icon: 'ShoppingBag',
    route: '/shop',
    requiresAuth: true,
    category: 'content',
  },
  vaktija: {
    id: 'vaktija',
    name: 'Vaktija',
    nameKey: 'navigation.vaktija',
    description: 'Kalendar vaktija',
    icon: 'Clock',
    route: '/vaktija',
    requiresAuth: false, // Public content
    category: 'core',
  },
  finances: {
    id: 'finances',
    name: 'Finansije',
    nameKey: 'navigation.finances',
    description: 'Donacije i finansijski izvještaji',
    icon: 'DollarSign',
    route: '/finances',
    requiresAuth: true,
    requiredRoles: ['admin', 'clan_io'],
    category: 'financial',
  },
  projects: {
    id: 'projects',
    name: 'Projekti',
    nameKey: 'navigation.projects',
    description: 'Upravljanje projektima džemata',
    icon: 'Target',
    route: '/projects',
    requiresAuth: true,
    requiredRoles: ['admin', 'clan_io'],
    category: 'financial',
  },
  activity: {
    id: 'activity',
    name: 'Aktivnost',
    nameKey: 'navigation.activity',
    description: 'Feed aktivnosti',
    icon: 'Activity',
    route: '/activity',
    requiresAuth: false, // Public content
    category: 'core',
  },
  badges: {
    id: 'badges',
    name: 'Značke',
    nameKey: 'navigation.badges',
    description: 'Sistem priznanja',
    icon: 'Award',
    route: '/badges',
    requiresAuth: true,
    category: 'content',
  },
  points: {
    id: 'points',
    name: 'Poeni',
    nameKey: 'navigation.points',
    description: 'Bodovni sistem',
    icon: 'TrendingUp',
    route: '/points',
    requiresAuth: true,
    category: 'content',
  },
  certificates: {
    id: 'certificates',
    name: 'Potvrde',
    nameKey: 'navigation.certificates',
    description: 'Zahvale i certifikati',
    icon: 'Award',
    route: '/certificates',
    requiresAuth: true,
    category: 'content',
  },
  documents: {
    id: 'documents',
    name: 'Dokumenti',
    nameKey: 'navigation.documents',
    description: 'Dokumentacija džemata',
    icon: 'FileText',
    route: '/documents',
    requiresAuth: true,
    category: 'content',
  },
  media: {
    id: 'media',
    name: 'Media',
    nameKey: 'navigation.media',
    description: 'Livestream i medijski sadržaj',
    icon: 'Video',
    route: '/media',
    requiresAuth: false, // Public livestream
    category: 'content',
  },
  settings: {
    id: 'settings',
    name: 'Podešavanja',
    nameKey: 'navigation.settings',
    description: 'Konfiguracija sistema',
    icon: 'Settings',
    route: '/settings',
    requiresAuth: true,
    requiredRoles: ['admin'],
    category: 'core',
  },
  guide: {
    id: 'guide',
    name: 'Vodič',
    nameKey: 'navigation.guide',
    description: 'Uputstva za korištenje',
    icon: 'Book',
    route: '/guide',
    requiresAuth: false, // Public help
    category: 'core',
  },
};

/**
 * SUBSCRIPTION TIER CONFIGURATIONS
 * Definiše koje module sadrži svaki paket
 */

// BASIC PAKET (€29/mjesec)
// Osnovni moduli + read-only preview ostalih
export const BASIC_TIER_MODULES: ModuleId[] = [
  'dashboard',
  'announcements',
  'events',
  'vaktija',
  'activity',
  'guide',
  'requests', // Guest can submit
];

export const BASIC_TIER_READ_ONLY: ModuleId[] = [
  'tasks',
  'messages',
  'askImam',
  'shop',
  'finances',
  'projects',
  'badges',
  'points',
  'certificates',
  'documents',
  'media',
];

// STANDARD PAKET (€79/mjesec)
// Većina modula + read-only naprednih
export const STANDARD_TIER_MODULES: ModuleId[] = [
  'dashboard',
  'users',
  'announcements',
  'events',
  'tasks',
  'messages',
  'askImam',
  'requests',
  'vaktija',
  'activity',
  'documents',
  'guide',
  'settings',
];

export const STANDARD_TIER_READ_ONLY: ModuleId[] = [
  'shop',
  'finances',
  'projects',
  'badges',
  'points',
  'certificates',
  'media',
];

// FULL PAKET (€149/mjesec)
// Svi moduli aktivni
export const FULL_TIER_MODULES: ModuleId[] = [
  'dashboard',
  'users',
  'announcements',
  'events',
  'tasks',
  'messages',
  'askImam',
  'requests',
  'shop',
  'vaktija',
  'finances',
  'projects',
  'activity',
  'badges',
  'points',
  'certificates',
  'documents',
  'media',
  'settings',
  'guide',
];

export const FULL_TIER_READ_ONLY: ModuleId[] = []; // Ništa nije read-only

/**
 * Helper function da dobije enabled module za tier
 */
export function getEnabledModulesForTier(tier: SubscriptionTier): ModuleId[] {
  switch (tier) {
    case 'basic':
      return BASIC_TIER_MODULES;
    case 'standard':
      return STANDARD_TIER_MODULES;
    case 'full':
      return FULL_TIER_MODULES;
    default:
      return BASIC_TIER_MODULES;
  }
}

/**
 * Helper function da dobije read-only module za tier
 */
export function getReadOnlyModulesForTier(tier: SubscriptionTier): ModuleId[] {
  switch (tier) {
    case 'basic':
      return BASIC_TIER_READ_ONLY;
    case 'standard':
      return STANDARD_TIER_READ_ONLY;
    case 'full':
      return FULL_TIER_READ_ONLY;
    default:
      return BASIC_TIER_READ_ONLY;
  }
}

/**
 * Check if module is enabled for tier
 */
export function isModuleEnabledForTier(
  moduleId: ModuleId,
  tier: SubscriptionTier
): boolean {
  const enabledModules = getEnabledModulesForTier(tier);
  return enabledModules.includes(moduleId);
}

/**
 * Check if module is read-only for tier
 */
export function isModuleReadOnlyForTier(
  moduleId: ModuleId,
  tier: SubscriptionTier
): boolean {
  const readOnlyModules = getReadOnlyModulesForTier(tier);
  return readOnlyModules.includes(moduleId);
}

/**
 * Get module access level
 */
export type ModuleAccessLevel = 'full' | 'readonly' | 'disabled';

export function getModuleAccessLevel(
  moduleId: ModuleId,
  tier: SubscriptionTier
): ModuleAccessLevel {
  if (isModuleEnabledForTier(moduleId, tier)) {
    return 'full';
  }
  if (isModuleReadOnlyForTier(moduleId, tier)) {
    return 'readonly';
  }
  return 'disabled';
}
