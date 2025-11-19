import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  CheckCircle,
  AccessTime,
  HourglassEmpty,
  Cancel,
  Archive,
  Assignment
} from '@mui/icons-material';
import { Task, WorkGroup } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useLocation } from 'wouter';

type TaskWithWorkGroup = Task & { workGroup: WorkGroup };

const getStatusLabel = (status: string, t: any): string => {
  const statusMap: Record<string, string> = {
    u_toku: t('tasks:dashboard.inProgress'),
    na_cekanju: t('tasks:dashboard.pending'),
    završeno: t('tasks:dashboard.completed'),
    otkazano: t('tasks:dashboard.cancelled'),
    arhiva: t('tasks:dashboard.archived')
  };
  return statusMap[status] || status;
};

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  u_toku: 'primary',
  na_cekanju: 'warning',
  završeno: 'success',
  otkazano: 'error',
  arhiva: 'default'
};

const statusIcons: Record<string, JSX.Element> = {
  u_toku: <AccessTime />,
  na_cekanju: <HourglassEmpty />,
  završeno: <CheckCircle />,
  otkazano: <Cancel />,
  arhiva: <Archive />
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  onClick: () => void;
  active: boolean;
}

function StatCard({ icon, label, count, color, onClick, active }: StatCardProps) {
  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: active ? `2px solid ${color}` : '2px solid transparent',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
      onClick={onClick}
      data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
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
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {count}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

interface TaskCardProps {
  task: TaskWithWorkGroup;
}

function TaskCard({ task }: TaskCardProps) {
  const { t } = useTranslation(['tasks']);
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/tasks?taskId=${task.id}&workGroupId=${task.workGroup.id}`);
  };

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
      onClick={handleClick}
      data-testid={`task-card-${task.id}`}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
            {task.title}
          </Typography>
          <Chip
            label={getStatusLabel(task.status, t)}
            color={statusColors[task.status]}
            size="small"
            icon={statusIcons[task.status]}
            data-testid={`chip-status-${task.id}`}
          />
        </Box>
        
        {task.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 1.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {task.description}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip
            label={task.workGroup.name}
            size="small"
            variant="outlined"
            data-testid={`chip-workgroup-${task.id}`}
          />
          {task.dueDate && (
            <Typography variant="caption" color="text.secondary">
              {t('tasks:dashboard.deadlineLabel')} {new Date(task.dueDate).toLocaleDateString('hr-HR')}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function TasksDashboard() {
  const { t } = useTranslation(['tasks']);
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const tasksQuery = useQuery<TaskWithWorkGroup[]>({
    queryKey: ['/api/tasks/dashboard'],
    retry: 1,
  });

  if (tasksQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (tasksQuery.error) {
    return (
      <Alert severity="error">
        {t('tasks:dashboard.loadingError')}
      </Alert>
    );
  }

  const allTasks = tasksQuery.data || [];
  
  const taskStats = {
    all: allTasks.length,
    u_toku: allTasks.filter(t => t.status === 'u_toku').length,
    na_cekanju: allTasks.filter(t => t.status === 'na_cekanju').length,
    završeno: allTasks.filter(t => t.status === 'završeno').length,
    otkazano: allTasks.filter(t => t.status === 'otkazano').length,
    arhiva: allTasks.filter(t => t.status === 'arhiva').length
  };

  const filteredTasks = selectedStatus === 'all'
    ? allTasks
    : allTasks.filter(task => task.status === selectedStatus);

  const tasksByWorkGroup = filteredTasks.reduce((acc, task) => {
    const groupId = task.workGroup.id;
    if (!acc[groupId]) {
      acc[groupId] = {
        workGroup: task.workGroup,
        tasks: []
      };
    }
    acc[groupId].tasks.push(task);
    return acc;
  }, {} as Record<string, { workGroup: WorkGroup; tasks: TaskWithWorkGroup[] }>);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('tasks:dashboard.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.isAdmin ? t('tasks:dashboard.adminView') : t('tasks:dashboard.moderatorView')}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            icon={<Assignment />}
            label={t('tasks:dashboard.all')}
            count={taskStats.all}
            color="#757575"
            onClick={() => setSelectedStatus('all')}
            active={selectedStatus === 'all'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            icon={<AccessTime />}
            label={t('tasks:dashboard.inProgress')}
            count={taskStats.u_toku}
            color="#1976d2"
            onClick={() => setSelectedStatus('u_toku')}
            active={selectedStatus === 'u_toku'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            icon={<HourglassEmpty />}
            label={t('tasks:dashboard.pending')}
            count={taskStats.na_cekanju}
            color="#ed6c02"
            onClick={() => setSelectedStatus('na_cekanju')}
            active={selectedStatus === 'na_cekanju'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            icon={<CheckCircle />}
            label={t('tasks:dashboard.completed')}
            count={taskStats.završeno}
            color="#2e7d32"
            onClick={() => setSelectedStatus('završeno')}
            active={selectedStatus === 'završeno'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            icon={<Cancel />}
            label={t('tasks:dashboard.cancelled')}
            count={taskStats.otkazano}
            color="#d32f2f"
            onClick={() => setSelectedStatus('otkazano')}
            active={selectedStatus === 'otkazano'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <StatCard
            icon={<Archive />}
            label={t('tasks:dashboard.archived')}
            count={taskStats.arhiva}
            color="#616161"
            onClick={() => setSelectedStatus('arhiva')}
            active={selectedStatus === 'arhiva'}
          />
        </Grid>
      </Grid>

      {Object.keys(tasksByWorkGroup).length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {selectedStatus === 'all' 
              ? t('tasks:task.noTasks')
              : t('tasks:dashboard.noTasksWithStatus', { status: getStatusLabel(selectedStatus, t) })}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.values(tasksByWorkGroup).map(({ workGroup, tasks }) => (
            <Box key={workGroup.id} data-testid={`workgroup-section-${workGroup.id}`}>
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexWrap: 'wrap'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                  {workGroup.name}
                </Typography>
                <Chip
                  label={t('tasks:dashboard.taskCount', { count: tasks.length })}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>
              {workGroup.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                  {workGroup.description}
                </Typography>
              )}
              <Grid container spacing={2}>
                {tasks.map(task => (
                  <Grid size={{ xs: 12, md: 4 }} key={task.id}>
                    <TaskCard task={task} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
