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
  Grid,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachMoney
} from '@mui/icons-material';
import { FinancialContribution, User, insertFinancialContributionSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';

export default function FinancesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<FinancialContribution | null>(null);

  // Fetch contributions
  const contributionsQuery = useQuery({
    queryKey: currentUser?.isAdmin 
      ? ['/api/financial-contributions'] 
      : ['/api/financial-contributions/user', currentUser?.id],
    enabled: !!currentUser,
  });

  // Fetch users (for admin)
  const usersQuery = useQuery({
    queryKey: ['/api/users'],
    enabled: currentUser?.isAdmin || false,
  });

  // Extended schema for client-side form
  const formSchema = insertFinancialContributionSchema.extend({
    userId: currentUser?.isAdmin 
      ? z.string().min(1, 'Korisnik je obavezan')
      : z.string().optional(),
    paymentDate: z.string().min(1, 'Datum je obavezan'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: currentUser?.id || '',
      amount: '0',
      paymentDate: new Date().toISOString().split('T')[0],
      purpose: 'Članarina',
      paymentMethod: 'Gotovina',
      notes: '',
      createdById: currentUser?.id || ''
    }
  });

  // Create/Update contribution mutation
  const saveContributionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Ensure userId is set for non-admins
      const payload = currentUser?.isAdmin ? data : { ...data, userId: currentUser?.id || '' };
      
      if (selectedContribution) {
        return await apiRequest(`/api/financial-contributions/${selectedContribution.id}`, 'PATCH', payload);
      } else {
        return await apiRequest('/api/financial-contributions', 'POST', payload);
      }
    },
    onSuccess: () => {
      // Invalidate both admin and member query keys
      queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions'] });
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions/user', currentUser.id] });
      }
      toast({ title: 'Uspjeh', description: selectedContribution ? 'Uplata je ažurirana' : 'Uplata je kreirana' });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri spremanju uplate', variant: 'destructive' });
    }
  });

  // Delete contribution mutation
  const deleteContributionMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/financial-contributions/${id}`, 'DELETE');
    },
    onSuccess: () => {
      // Invalidate both query keys
      queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions'] });
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/financial-contributions/user', currentUser.id] });
      }
      toast({ title: 'Uspjeh', description: 'Uplata je obrisana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju uplate', variant: 'destructive' });
    }
  });

  const handleOpenDialog = (contribution?: FinancialContribution) => {
    if (contribution) {
      setSelectedContribution(contribution);
      form.reset({
        userId: contribution.userId,
        amount: contribution.amount,
        paymentDate: contribution.paymentDate ? new Date(contribution.paymentDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        purpose: contribution.purpose,
        paymentMethod: contribution.paymentMethod,
        notes: contribution.notes || '',
        createdById: contribution.createdById
      });
    } else {
      setSelectedContribution(null);
      form.reset({
        userId: currentUser?.id || '',
        amount: '0',
        paymentDate: new Date().toISOString().split('T')[0],
        purpose: 'Članarina',
        paymentMethod: 'Gotovina',
        notes: '',
        createdById: currentUser?.id || ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedContribution(null);
    form.reset();
  };

  const handleSubmit = form.handleSubmit((data) => {
    saveContributionMutation.mutate(data);
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Jeste li sigurni da želite obrisati ovu uplatu?')) {
      deleteContributionMutation.mutate(id);
    }
  };

  const filteredContributions = ((contributionsQuery.data as FinancialContribution[]) || []).filter((contribution: FinancialContribution) => {
    // Category filter
    if (categoryFilter && contribution.purpose !== categoryFilter) {
      return false;
    }
    
    // Search filter
    if (!searchTerm) return true;
    
    const user = (usersQuery.data as User[] || []).find(u => u.id === contribution.userId);
    const matchesSearch = 
      (user && `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contribution.notes ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      contribution.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getUserName = (userId: string) => {
    if (!usersQuery.data) return 'Nepoznato';
    const user = (usersQuery.data as User[]).find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Nepoznato';
  };

  if (contributionsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (contributionsQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju finansijskih uplate. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {currentUser?.isAdmin ? 'Finansije' : 'Moje Uplate'}
        </Typography>
        {currentUser?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            data-testid="button-add-contribution"
          >
            Dodaj Uplatu
          </Button>
        )}
      </Box>

      <Card>
        {currentUser?.isAdmin && (
          <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                variant="outlined"
                placeholder="Pretraži po korisniku, opisu ili tipu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                fullWidth
                data-testid="input-search"
              />
              <TextField
                select
                variant="outlined"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ minWidth: 200 }}
                SelectProps={{ native: true }}
                data-testid="select-category-filter"
              >
                <option value="">Sve kategorije</option>
                <option value="Članarina">Članarina</option>
                <option value="Donacija">Donacija</option>
                <option value="Vakuf">Vakuf</option>
                <option value="Sergija">Sergija</option>
                <option value="Ostalo">Ostalo</option>
              </TextField>
            </Box>
          </Box>
        )}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                {currentUser?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>Korisnik</TableCell>}
                <TableCell sx={{ fontWeight: 600 }}>Iznos</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Svrha</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Napomena</TableCell>
                {currentUser?.isAdmin && <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContributions.map((contribution: FinancialContribution) => (
                <TableRow key={contribution.id}>
                  {currentUser?.isAdmin && (
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {getUserName(contribution.userId)}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip
                      icon={<AttachMoney />}
                      label={`${contribution.amount} CHF`}
                      color="success"
                      size="small"
                      data-testid={`amount-${contribution.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={contribution.purpose}
                      size="small"
                      variant="outlined"
                      data-testid={`purpose-${contribution.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    {contribution.paymentDate ? new Date(contribution.paymentDate).toLocaleDateString('hr-HR') : '-'}
                  </TableCell>
                  <TableCell>{contribution.notes || '-'}</TableCell>
                  {currentUser?.isAdmin && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(contribution)}
                          sx={{ color: '#1976d2' }}
                          data-testid={`button-edit-${contribution.id}`}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(contribution.id)}
                          sx={{ color: '#d32f2f' }}
                          data-testid={`button-delete-${contribution.id}`}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {filteredContributions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={currentUser?.isAdmin ? 6 : 5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema finansijskih uplate
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
            {selectedContribution ? 'Uredi Uplatu' : 'Dodaj Novu Uplatu'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {currentUser?.isAdmin && (
                <Grid size={{ xs: 12 }}>
                  <Autocomplete
                    options={(usersQuery.data as User[]) || []}
                    getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
                    value={(usersQuery.data as User[] || []).find(u => u.id === form.watch('userId')) || null}
                    onChange={(event, newValue) => {
                      form.setValue('userId', newValue?.id || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Korisnik"
                        required
                        error={!!form.formState.errors.userId}
                        helperText={form.formState.errors.userId?.message}
                        data-testid="input-user"
                      />
                    )}
                    data-testid="autocomplete-user"
                  />
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Iznos (CHF)"
                  type="number"
                  {...form.register('amount')}
                  error={!!form.formState.errors.amount}
                  helperText={form.formState.errors.amount?.message}
                  required
                  data-testid="input-amount"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Datum uplate"
                  type="date"
                  {...form.register('paymentDate')}
                  error={!!form.formState.errors.paymentDate}
                  helperText={form.formState.errors.paymentDate?.message}
                  InputLabelProps={{ shrink: true }}
                  required
                  data-testid="input-date"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Svrha uplate"
                  {...form.register('purpose')}
                  error={!!form.formState.errors.purpose}
                  helperText={form.formState.errors.purpose?.message}
                  SelectProps={{ native: true }}
                  data-testid="select-purpose"
                >
                  <option value="Članarina">Članarina</option>
                  <option value="Donacija">Donacija</option>
                  <option value="Vakuf">Vakuf</option>
                  <option value="Sergija">Sergija</option>
                  <option value="Ostalo">Ostalo</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Način plaćanja"
                  {...form.register('paymentMethod')}
                  error={!!form.formState.errors.paymentMethod}
                  helperText={form.formState.errors.paymentMethod?.message}
                  SelectProps={{ native: true }}
                  data-testid="select-payment-method"
                >
                  <option value="Gotovina">Gotovina</option>
                  <option value="Banka">Banka</option>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Napomena"
                  multiline
                  rows={3}
                  {...form.register('notes')}
                  data-testid="input-notes"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} data-testid="button-cancel">
              Otkaži
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={saveContributionMutation.isPending}
              data-testid="button-save"
            >
              {saveContributionMutation.isPending ? 'Spremanje...' : 'Spremi'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
