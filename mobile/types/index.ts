export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  isAdmin: boolean;
  tenantId: string;
  phoneNumber?: string;
  address?: string;
  profileImage?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  attachments?: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location?: string;
  rsvpCount: number;
  userRsvped?: boolean;
}

export interface TaskGroup {
  id: string;
  name: string;
  description?: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  assignees: User[];
  dueDate?: string;
  points?: number;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  createdAt: string;
  relatedEntityId?: string;
}

export interface DashboardStats {
  userCount: number;
  upcomingEventsCount: number;
  tasksCount: number;
  announcements: number;
}
