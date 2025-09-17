// This file contains mock data for prototype demonstration purposes
// In a production app, this would be replaced by real API calls

export const mockStatistics = {
  userCount: 1247,
  newAnnouncementsCount: 15,
  upcomingEventsCount: 8,
  activeTasksCount: 42
};

export const mockRecentActivities = [
  {
    id: "1",
    type: "registration",
    description: "Novi korisnik registrovan: Marko Petrović",
    userId: "user1",
    createdAt: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
  },
  {
    id: "2", 
    type: "announcement",
    description: 'Nova obavijest objavljena: "Mjesečni izvještaj"',
    userId: "admin1",
    createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
  },
  {
    id: "3",
    type: "event", 
    description: 'Događaj kreiran: "Skupština džamije"',
    userId: "admin1",
    createdAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
  },
  {
    id: "4",
    type: "task",
    description: 'Zadatak završen: "Priprema programa"',
    userId: "user2", 
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
  }
];

export const getActivityTypeChip = (type: string) => {
  switch (type) {
    case "registration":
      return { label: "Registracija", color: "success" as const };
    case "announcement": 
      return { label: "Obavijest", color: "info" as const };
    case "event":
      return { label: "Događaj", color: "warning" as const };
    case "task":
      return { label: "Zadatak", color: "success" as const };
    default:
      return { label: "Aktivnost", color: "default" as const };
  }
};

export const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? "1 minutu temu" : `${diffInMinutes} minuta temu`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return hours === 1 ? "1 sat temu" : `${hours} sata temu`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return days === 1 ? "1 dan temu" : `${days} dana temu`;
  }
};
