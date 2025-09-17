import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People,
  Campaign,
  Event,
  TaskAlt
} from '@mui/icons-material';
import { 
  mockStatistics, 
  mockRecentActivities, 
  getActivityTypeChip, 
  formatTimeAgo 
} from '../data/mockData';

const StatCard = ({ icon, title, value, color }: {
  icon: React.ReactNode;
  title: string;
  value: number;
  color: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
          {value.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

export default function DashboardHome() {
  // In a real app, these would be actual API calls
  const statisticsQuery = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockStatistics;
    }
  });

  const activitiesQuery = useQuery({
    queryKey: ['/api/activities'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      return mockRecentActivities;
    }
  });

  if (statisticsQuery.isLoading || activitiesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (statisticsQuery.error || activitiesQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju podataka. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  const statistics = statisticsQuery.data;
  const activities = activitiesQuery.data;

  return (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<People />}
            title="Ukupan Broj Korisnika"
            value={statistics?.userCount || 0}
            color="#1976d2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Campaign />}
            title="Nove Obavijesti (7 dana)"
            value={statistics?.newAnnouncementsCount || 0}
            color="#2e7d32"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Event />}
            title="Nadolazeći Događaji"
            value={statistics?.upcomingEventsCount || 0}
            color="#ed6c02"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TaskAlt />}
            title="Aktivni Zadaci"
            value={statistics?.activeTasksCount || 0}
            color="#0097a7"
          />
        </Grid>
      </Grid>

      {/* Recent Activities Table */}
      <Card>
        <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Posljednje Aktivnosti
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600 }}>Tip</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Opis</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Korisnik</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vrijeme</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities?.map((activity, index) => {
                const chipData = getActivityTypeChip(activity.type);
                return (
                  <TableRow key={activity.id || index}>
                    <TableCell>
                      <Chip 
                        label={chipData.label}
                        color={chipData.color}
                        size="small"
                        sx={{ 
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell>{activity.description}</TableCell>
                    <TableCell>
                      {activity.userId ? 'Korisnik' : 'System'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatTimeAgo(new Date(activity.createdAt))}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!activities || activities.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema nedavnih aktivnosti
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
