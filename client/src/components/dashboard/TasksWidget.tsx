import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type Task } from '@shared/schema';
import { Assignment } from '@mui/icons-material';

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function TasksWidget() {
  const [, setLocation] = useLocation();

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress': return 'warning';
      case 'pending': return 'default';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'U toku';
      case 'pending': return 'Na čekanju';
      case 'completed': return 'Završeno';
      default: return status;
    }
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assignment fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Zadaci</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/tasks')}
          >
            Vidi sve
          </Typography>
        </Box>
        {pendingTasks.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nema aktivnih zadataka</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pendingTasks.map((task) => (
              <Box 
                key={task.id} 
                onClick={() => setLocation('/tasks')}
                sx={{ 
                  p: 1.5, 
                  bgcolor: 'action.hover', 
                  borderRadius: '6px',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.selected' }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                  <Typography variant="body2" sx={{ flex: 1 }} noWrap>{task.title}</Typography>
                  <Chip 
                    label={getStatusLabel(task.status)} 
                    size="small" 
                    color={getStatusColor(task.status) as any}
                    sx={{ fontSize: '0.65rem', height: 20 }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
