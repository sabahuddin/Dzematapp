import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  EmojiEvents
} from '@mui/icons-material';
import { Badge, insertBadgeSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';

export default function BadgesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  // Check admin access
  if (!currentUser?.isAdmin) {
    return (
      <Alert severity="error">
        Nemate dozvolu za pristup ovoj stranici.
      </Alert>
    );
  }

  // Fetch badges
  const badgesQuery = useQuery({
    queryKey: ['/api/badges'],
  });

  // Form schema
  const formSchema = insertBadgeSchema.extend({
    name: z.string().min(1, 'Naziv je obavezan'),
    description: z.string().min(1, 'Opis je obavezan'),
    criteriaType: z.string().min(1, 'Tip kriterija je obavezan'),
    criteriaValue: z.number().min(0, 'Vrijednost mora biti pozitivna'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      criteriaType: '',
      criteriaValue: 0,
      icon: null,
    }
  });

  // Create/Update badge mutation
  const saveBadgeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (selectedBadge) {
        const response = await apiRequest(`/api/badges/${selectedBadge.id}`, 'PUT', data);
        return response.json();
      } else {
        const response = await apiRequest('/api/badges', 'POST', data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: 'Uspjeh', description: selectedBadge ? 'Značka je ažurirana' : 'Značka je kreirana' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri spremanju značke', variant: 'destructive' });
    }
  });

  // Delete badge mutation
  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/badges/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/badges'] });
      toast({ title: 'Uspjeh', description: 'Značka je obrisana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju značke', variant: 'destructive' });
    }
  });

  const handleOpenDialog = (badge?: Badge) => {
    if (badge) {
      setSelectedBadge(badge);
      form.reset({
        name: badge.name,
        description: badge.description,
        criteriaType: badge.criteriaType,
        criteriaValue: badge.criteriaValue,
        icon: badge.icon,
      });
    } else {
      setSelectedBadge(null);
      form.reset({
        name: '',
        description: '',
        criteriaType: '',
        criteriaValue: 0,
        icon: null,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedBadge(null);
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    saveBadgeMutation.mutate(data);
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovu značku?')) {
      deleteBadgeMutation.mutate(id);
    }
  };

  if (badgesQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (badgesQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju znački. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  const badges = (badgesQuery.data as Badge[]) || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Značke (Badges)
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          data-testid="button-add-badge"
        >
          Dodaj Značku
        </Button>
      </Box>

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600 }}>Naziv</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Opis</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tip kriterija</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vrijednost</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {badges.map((badge: Badge) => (
                <TableRow key={badge.id}>
                  <TableCell>
                    <Chip
                      icon={<EmojiEvents />}
                      label={badge.name}
                      color="warning"
                      data-testid={`badge-name-${badge.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" data-testid={`badge-desc-${badge.id}`}>
                      {badge.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" data-testid={`badge-type-${badge.id}`}>
                      {badge.criteriaType}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={badge.criteriaValue} size="small" data-testid={`badge-value-${badge.id}`} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(badge)}
                        sx={{ color: '#1976d2' }}
                        data-testid={`button-edit-${badge.id}`}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(badge.id)}
                        sx={{ color: '#d32f2f' }}
                        data-testid={`button-delete-${badge.id}`}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {badges.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema definisanih znački. Dodajte novu značku koristeći dugme "Dodaj Značku".
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedBadge ? 'Uredi Značku' : 'Dodaj Novu Značku'}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Naziv značke"
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
                rows={2}
                {...form.register('description')}
                error={!!form.formState.errors.description}
                helperText={form.formState.errors.description?.message}
                required
                data-testid="input-description"
              />
              <TextField
                select
                fullWidth
                label="Tip kriterija"
                {...form.register('criteriaType')}
                error={!!form.formState.errors.criteriaType}
                helperText={form.formState.errors.criteriaType?.message || 'Tip aktivnosti potreban za dobijanje značke'}
                SelectProps={{ native: true }}
                required
                data-testid="select-criteria-type"
              >
                <option value="">-- Odaberi tip --</option>
                <option value="points">Ukupni bodovi</option>
                <option value="tasks_completed">Broj izvršenih zadataka</option>
                <option value="contributions_amount">Ukupan iznos uplate</option>
                <option value="events_attended">Broj posjećenih događaja</option>
              </TextField>
              <TextField
                fullWidth
                label="Vrijednost"
                type="number"
                {...form.register('criteriaValue', { valueAsNumber: true })}
                error={!!form.formState.errors.criteriaValue}
                helperText={form.formState.errors.criteriaValue?.message || 'Minimalna vrijednost potrebna za dobijanje značke'}
                required
                data-testid="input-criteria-value"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} data-testid="button-cancel">
              Otkaži
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saveBadgeMutation.isPending}
              data-testid="button-save"
            >
              {saveBadgeMutation.isPending ? 'Spremanje...' : 'Spremi'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
