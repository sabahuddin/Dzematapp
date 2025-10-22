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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { insertProjectSchema, type Project } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Only admins can manage projects
  const isAdmin = user?.isAdmin || false;

  // Fetch projects
  const projectsQuery = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Form schema - custom validation for frontend
  const formSchema = z.object({
    name: z.string().min(1, 'Naziv je obavezan'),
    description: z.string().min(1, 'Opis je obavezan'),
    goalAmount: z.string().min(1, 'Ciljani iznos je obavezan').refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      'Ciljani iznos mora biti veći od 0'
    ),
    currentAmount: z.string().refine(
      (val) => val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Trenutni iznos mora biti pozitivan broj'
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
      toast({ title: 'Uspjeh', description: selectedProject ? 'Projekat uspješno ažuriran' : 'Projekat uspješno kreiran' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri spremanju projekta', variant: 'destructive' });
    }
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/projects/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Uspjeh', description: 'Projekat uspješno obrisan' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju projekta', variant: 'destructive' });
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
    if (confirm('Da li ste sigurni da želite obrisati ovaj projekat?')) {
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
        Greška pri učitavanju projekata. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  const projects = projectsQuery.data || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Projekti
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            data-testid="button-add-project"
          >
            Dodaj Projekat
          </Button>
        )}
      </Box>

      {projects.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Nema definisanih projekata. {isAdmin && 'Dodajte novi projekat koristeći dugme "Dodaj Projekat".'}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {projects.map((project) => {
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
                          Prikupljeno:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} data-testid={`text-project-progress-${project.id}`}>
                          {parseFloat(project.currentAmount).toFixed(2)} CHF / {parseFloat(project.goalAmount).toFixed(2)} CHF ({progress.toFixed(1)}%)
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
                        <Chip label="Aktivan" color="success" size="small" data-testid={`status-active-${project.id}`} />
                      ) : (
                        <Chip label="Zatvoren" color="default" size="small" data-testid={`status-inactive-${project.id}`} />
                      )}
                    </Box>
                  </Box>

                  {isAdmin && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(project)}
                        sx={{ color: '#1976d2' }}
                        data-testid={`button-edit-${project.id}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(project.id)}
                        sx={{ color: '#d32f2f' }}
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
              {selectedProject ? 'Uredi Projekat' : 'Dodaj Novi Projekat'}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField
                  fullWidth
                  label="Naziv projekta"
                  {...form.register('name')}
                  error={!!form.formState.errors.name}
                  helperText={form.formState.errors.name?.message}
                  required
                  data-testid="input-name"
                />
                <TextField
                  fullWidth
                  label="Opis"
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
                  label="Ciljani iznos (CHF)"
                  type="text"
                  inputProps={{ step: '0.01', min: 0 }}
                  {...form.register('goalAmount')}
                  error={!!form.formState.errors.goalAmount}
                  helperText={form.formState.errors.goalAmount?.message || 'Ukupan iznos koji je potrebno prikupiti'}
                  required
                  data-testid="input-goal-amount"
                />
                <TextField
                  fullWidth
                  label="Trenutno prikupljeno (CHF)"
                  type="text"
                  inputProps={{ step: '0.01', min: 0 }}
                  {...form.register('currentAmount')}
                  error={!!form.formState.errors.currentAmount}
                  helperText={form.formState.errors.currentAmount?.message || 'Iznos već prikupljen za ovaj projekat'}
                  required
                  data-testid="input-current-amount"
                />
                <TextField
                  select
                  fullWidth
                  label="Status"
                  {...form.register('status')}
                  error={!!form.formState.errors.status}
                  helperText={form.formState.errors.status?.message || 'Status projekta'}
                  SelectProps={{ native: true }}
                  required
                  data-testid="select-status"
                >
                  <option value="active">Aktivan</option>
                  <option value="closed">Zatvoren</option>
                </TextField>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} data-testid="button-cancel">
                Otkaži
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={saveProjectMutation.isPending}
                data-testid="button-save"
              >
                {saveProjectMutation.isPending ? 'Spremanje...' : 'Spremi'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
