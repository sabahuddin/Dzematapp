// Widget Registry - defines all available widgets and their size options

export interface WidgetSize {
  w: number; // width in grid units (1-5)
  h: number; // height in grid units
  label: string; // display name like "1x1", "2x2"
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  component: string; // component name to render
}

// All available widgets
export const widgetRegistry: WidgetDefinition[] = [
  // Large widgets with multiple size options
  {
    id: 'events',
    name: 'Događaji',
    description: 'Nadolazeći događaji sa slikama',
    icon: 'CalendarDays',
    sizes: [
      { w: 1, h: 2, label: '1x2' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 2, h: 2, label: '2x2' },
    component: 'EventsWidget',
  },
  {
    id: 'membership-fees',
    name: 'Članarina',
    description: 'Pregled članarina sa grafom',
    icon: 'TrendingUp',
    sizes: [
      { w: 1, h: 2, label: '1x2' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 2, h: 2, label: '2x2' },
    component: 'MembershipFeeWidget',
  },
  {
    id: 'tasks',
    name: 'Zadaci',
    description: 'Aktivni zadaci',
    icon: 'ListTodo',
    sizes: [
      { w: 1, h: 2, label: '1x2' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 1, h: 2, label: '1x2' },
    component: 'TasksWidget',
  },
  {
    id: 'activity',
    name: 'Aktivnosti',
    description: 'Bodovi, značke i zahvalnice',
    icon: 'Trophy',
    sizes: [
      { w: 1, h: 3, label: '1x3' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 1, h: 3, label: '1x3' },
    component: 'ActivityWidget',
  },
  {
    id: 'messages',
    name: 'Poruke',
    description: 'Zadnje poruke',
    icon: 'Mail',
    sizes: [
      { w: 1, h: 2, label: '1x2' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 1, h: 2, label: '1x2' },
    component: 'MessagesWidget',
  },
  {
    id: 'shop',
    name: 'Shop',
    description: 'Zadnji oglasi iz shopa',
    icon: 'ShoppingBag',
    sizes: [
      { w: 1, h: 2, label: '1x2' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 1, h: 2, label: '1x2' },
    component: 'ShopWidget',
  },
  {
    id: 'announcements',
    name: 'Obavještenja',
    description: 'Zadnja obavještenja',
    icon: 'Megaphone',
    sizes: [
      { w: 1, h: 2, label: '1x2' },
      { w: 2, h: 2, label: '2x2' },
      { w: 2, h: 3, label: '2x3' },
    ],
    defaultSize: { w: 2, h: 2, label: '2x2' },
    component: 'AnnouncementsWidget',
  },
  {
    id: 'users-stats',
    name: 'Korisnici',
    description: 'Statistika korisnika',
    icon: 'Users',
    sizes: [
      { w: 1, h: 1, label: '1x1' },
      { w: 2, h: 1, label: '2x1' },
      { w: 1, h: 2, label: '1x2' },
    ],
    defaultSize: { w: 2, h: 1, label: '2x1' },
    component: 'UsersStatsWidget',
  },
  {
    id: 'prayer-times',
    name: 'Vaktija',
    description: 'Današnja vaktija',
    icon: 'Clock',
    sizes: [
      { w: 1, h: 1, label: '1x1' },
      { w: 2, h: 1, label: '2x1' },
      { w: 1, h: 2, label: '1x2' },
    ],
    defaultSize: { w: 1, h: 2, label: '1x2' },
    component: 'PrayerTimesWidget',
  },
  {
    id: 'work-groups',
    name: 'Sekcije',
    description: 'Radne grupe',
    icon: 'Users2',
    sizes: [
      { w: 1, h: 1, label: '1x1' },
      { w: 2, h: 1, label: '2x1' },
      { w: 2, h: 2, label: '2x2' },
    ],
    defaultSize: { w: 2, h: 1, label: '2x1' },
    component: 'WorkGroupsWidget',
  },
  // Small widgets (1x1 only)
  {
    id: 'documents',
    name: 'Dokumenti',
    description: 'Brzi pristup dokumentima',
    icon: 'FileText',
    sizes: [{ w: 1, h: 1, label: '1x1' }],
    defaultSize: { w: 1, h: 1, label: '1x1' },
    component: 'DocumentsWidget',
  },
  {
    id: 'settings',
    name: 'Podešavanja',
    description: 'Brzi pristup podešavanjima',
    icon: 'Settings',
    sizes: [{ w: 1, h: 1, label: '1x1' }],
    defaultSize: { w: 1, h: 1, label: '1x1' },
    component: 'SettingsWidget',
  },
  {
    id: 'guide',
    name: 'Vodič',
    description: 'Pomoć i vodič',
    icon: 'HelpCircle',
    sizes: [{ w: 1, h: 1, label: '1x1' }],
    defaultSize: { w: 1, h: 1, label: '1x1' },
    component: 'GuideWidget',
  },
  {
    id: 'imam-qa',
    name: 'Pitaj imama',
    description: 'Pitanja za imama',
    icon: 'MessageCircleQuestion',
    sizes: [{ w: 1, h: 1, label: '1x1' }],
    defaultSize: { w: 1, h: 1, label: '1x1' },
    component: 'ImamQAWidget',
  },
];

export const getWidgetById = (id: string): WidgetDefinition | undefined => {
  return widgetRegistry.find(w => w.id === id);
};

export const getDefaultLayout = (): Array<{ i: string; x: number; y: number; w: number; h: number }> => {
  // Default layout for new users - 5 column grid
  return [
    { i: 'events', x: 0, y: 0, w: 2, h: 2 },
    { i: 'membership-fees', x: 2, y: 0, w: 2, h: 2 },
    { i: 'users-stats', x: 4, y: 0, w: 1, h: 1 },
    { i: 'prayer-times', x: 4, y: 1, w: 1, h: 2 },
    { i: 'tasks', x: 0, y: 2, w: 1, h: 2 },
    { i: 'activity', x: 1, y: 2, w: 1, h: 3 },
    { i: 'messages', x: 2, y: 2, w: 1, h: 2 },
    { i: 'shop', x: 3, y: 2, w: 2, h: 2 },
  ];
};
