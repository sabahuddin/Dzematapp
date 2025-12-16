import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { insertProjectSchema, type Project } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { UpgradeCTA } from '@/components/UpgradeCTA';

export default function ProjectsPage() {
  const { t } = useTranslation(['projects']);
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // Only admins can manage projects
  const isAdmin = user?.isAdmin || false;

  // Fetch projects
  const projectsQuery = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Form schema - custom validation for frontend
  const formSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    description: z.string().min(1, t('validation.descriptionRequired')),
    goalAmount: z.string().min(1, t('validation.goalAmountRequired')).refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      t('validation.goalAmountPositive')
    ),
    currentAmount: z.string().refine(
      (val) => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      t('validation.currentAmountPositive')
    ).optional().default('0'),
    status: z.enum(['active', 'closed']).default('active'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      goalAmount: '',
      currentAmount: '0',
      status: 'active',
    }
  });

  // Create/Update project mutation
  const saveProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (selectedProject) {
        return apiRequest(`/api/projects/${selectedProject.id}`, 'PATCH', data);
      } else {
        return apiRequest('/api/projects', 'POST', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: t('toast.success'), description: selectedProject ? t('toast.projectUpdated') : t('toast.projectCreated') });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: t('toast.error'), description: t('toast.saveError'), variant: 'destructive' });
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/projects/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: t('toast.success'), description: t('toast.projectDeleted') });
    },
    onError: () => {
      toast({ title: t('toast.error'), description: t('toast.deleteError'), variant: 'destructive' });
    }
  });

  const handleSubmit = form.handleSubmit(
    (data) => {
      console.log('Form submitted successfully with data:', data);
      saveProjectMutation.mutate(data);
    },
    (errors) => {
      console.error('Form validation errors:', errors);
    }
  );

  const handleOpenDialog = (project?: Project) => {
    if (project) {
      setSelectedProject(project);
      form.reset({
        name: project.name,
        description: project.description,
        goalAmount: project.goalAmount,
        currentAmount: project.currentAmount,
        status: project.status as 'active' | 'closed',
      });
    } else {
      setSelectedProject(null);
      form.reset({
        name: '',
        description: '',
        goalAmount: '',
        currentAmount: '0',
        status: 'active',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProject(null);
    form.reset();
  };

  const handleDelete = (id: string) => {
    if (confirm(t('confirmDelete'))) {
      deleteProjectMutation.mutate(id);
    }
  };

  const calculateProgress = (currentAmount: string, goalAmount: string): number => {
    const current = parseFloat(currentAmount) || 0;
    const goal = parseFloat(goalAmount) || 1;
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const getProgressColor = (percentage: number): 'success' | 'warning' | 'error' => {
    if (percentage >= 75) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (projectsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (projectsQuery.error) {
    return (
      <Alert severity="error">
        {t('toast.loadError')}
      </Alert>
    );
  }

  const projects = projectsQuery.data || [];
  
  // Filter projects based on active tab
  const filteredProjects = projects.filter(project => {
    if (activeTab === 'active') {
      return project.status === 'active';
    } else {
      return project.status === 'closed';
    }
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('title')}
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            data-testid="button-add-project"
          >
            {t('addProject')}
          </Button>
        )}
      </Box>

      {/* Tabs for Active and Archived projects */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          data-testid="tabs-projects"
        >
          <Tab 
            label={t('tabs.active')} 
            value="active" 
            data-testid="tab-active"
          />
          <Tab 
            label={t('tabs.archived')} 
            value="archived" 
            data-testid="tab-archived"
          />
        </Tabs>
      </Box>

      {filteredProjects.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {activeTab === 'active' ? t('noActiveProjects') : t('noArchivedProjects')}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {filteredProjects.map((project) => {
            const progress = calculateProgress(project.currentAmount, project.goalAmount);
            const progressColor = getProgressColor(progress);
            
            return (
              <Card key={project.id} sx={{ p: 3 }} data-testid={`card-project-${project.id}`}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }} data-testid={`text-project-name-${project.id}`}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} data-testid={`text-project-desc-${project.id}`}>
                      {project.description}
                    </Typography>
                    
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('collected')}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} data-testid={`text-project-progress-${project.id}`}>
                          {parseFloat(project.currentAmount).toFixed(2)} {t('currency')} / {parseFloat(project.goalAmount).toFixed(2)} {t('currency')} ({progress.toFixed(1)}%)
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={progress} 
                        color={progressColor}
                        sx={{ height: 8, borderRadius: 4 }}
                        data-testid={`progress-bar-${project.id}`}
                      />
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      {project.status === 'active' ? (
                        <Chip label={t('status.active')} color="success" size="small" data-testid={`status-active-${project.id}`} />
                      ) : (
                        <Chip label={t('status.closed')} color="default" size="small" data-testid={`status-inactive-${project.id}`} />
                      )}
                    </Box>
                  </Box>

                  {isAdmin && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(project)}
                        sx={{ color: 'hsl(207 88% 55%)' }}
                        data-testid={`button-edit-${project.id}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(project.id)}
                        sx={{ color: 'hsl(4 90% 58%)' }}
                        data-testid={`button-delete-${project.id}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Card>
            );
          })}
        </Stack>
      )}

      {/* Add/Edit Dialog (Admin Only) */}
      {isAdmin && (
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {selectedProject ? t('editProject') : t('addNewProject')}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label={t('projectName')}
                  {...form.register('name')}
                  error={!!form.formState.errors.name}
                  helperText={form.formState.errors.name?.message}
                  required
                  data-testid="input-name"
                />
                <TextField
                  fullWidth
                  label={t('description')}
                  multiline
                  rows={3}
                  {...form.register('description')}
                  error={!!form.formState.errors.description}
                  helperText={form.formState.errors.description?.message}
                  required
                  data-testid="input-description"
                />
                <TextField
                  fullWidth
                  label={t('goalAmount')}
                  type="text"
                  inputProps={{ step: '0.01', min: 0 }}
                  {...form.register('goalAmount')}
                  error={!!form.formState.errors.goalAmount}
                  helperText={form.formState.errors.goalAmount?.message || t('goalAmountHelper')}
                  required
                  data-testid="input-goal-amount"
                />
                <TextField
                  fullWidth
                  label={t('currentAmount')}
                  type="text"
                  inputProps={{ step: '0.01', min: 0 }}
                  {...form.register('currentAmount')}
                  error={!!form.formState.errors.currentAmount}
                  helperText={form.formState.errors.currentAmount?.message || t('currentAmountHelper')}
                  required
                  data-testid="input-current-amount"
                />
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!form.formState.errors.status}>
                      <InputLabel>{t('status.label')}</InputLabel>
                      <Select
                        {...field}
                        label={t('status.label')}
                        data-testid="select-status"
                      >
                        <MenuItem value="active">{t('status.active')}</MenuItem>
                        <MenuItem value="closed">{t('status.closed')}</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} data-testid="button-cancel">
                {t('buttons.cancel')}
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={saveProjectMutation.isPending}
                data-testid="button-save"
              >
                {saveProjectMutation.isPending ? t('buttons.saving') : t('buttons.save')}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
