import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Checkbox,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Block,
  CheckCircle,
  Extension
} from '@mui/icons-material';
import { ALL_MODULES, ModuleId } from '../contexts/ModuleContext';
import { Tenant } from '@shared/schema';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { formatDateForDisplay } from '../utils/dateUtils';

const DEFAULT_MODULES = ['dashboard', 'announcements', 'events', 'vaktija', 'users'];

interface TenantFormData {
  name: string;
  slug: string;
  tenantCode: string;
  subdomain: string;
  email: string;
  subscriptionTier: string;
  enabledModules: string[];
  currency?: string;
}

export default function TenantManagementPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantFormData>({
    name: '',
    slug: '',
    tenantCode: '',
    subdomain: '',
    email: '',
    subscriptionTier: 'basic',
    enabledModules: DEFAULT_MODULES,
    currency: 'CHF'
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);

  const tenantsQuery = useQuery({
    queryKey: ['/api/tenants'],
    retry: 1,
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await apiRequest('/api/tenants', 'POST', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      toast({ title: 'Uspjeh', description: 'Tenant uspješno kreiran' });
      handleCloseModal();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Nije moguće kreirati tenant', variant: 'destructive' });
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Tenant> & { id: string }) => {
      const response = await apiRequest(`/api/tenants/${id}`, 'PATCH', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      toast({ title: 'Uspjeh', description: 'Tenant uspješno ažuriran' });
      handleCloseModal();
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Nije moguće ažurirati tenant', variant: 'destructive' });
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await apiRequest(`/api/tenants/${id}/status`, 'PATCH', { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      toast({ title: 'Uspjeh', description: 'Status tenanta promijenjen' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Nije moguće promijeniti status', variant: 'destructive' });
    }
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest(`/api/tenants/${id}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      toast({ title: 'Uspjeh', description: 'Tenant uspješno obrisan' });
      setDeleteConfirmOpen(false);
      setTenantToDelete(null);
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Nije moguće obrisati tenant', variant: 'destructive' });
    }
  });

  const handleOpenModal = (tenant?: Tenant) => {
    if (tenant) {
      setSelectedTenant(tenant);
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        tenantCode: tenant.tenantCode || '',
        subdomain: tenant.subdomain || '',
        email: tenant.email,
        subscriptionTier: tenant.subscriptionTier,
        enabledModules: (tenant as any).enabledModules || DEFAULT_MODULES,
        currency: (tenant as any).defaultCurrency || 'CHF'
      });
    } else {
      setSelectedTenant(null);
      setFormData({
        name: '',
        slug: '',
        tenantCode: '',
        subdomain: '',
        email: '',
        subscriptionTier: 'basic',
        enabledModules: DEFAULT_MODULES,
        currency: 'CHF'
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTenant(null);
    setFormData({
      name: '',
      slug: '',
      tenantCode: '',
      subdomain: '',
      email: '',
      subscriptionTier: 'basic',
      enabledModules: DEFAULT_MODULES
    });
  };

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      enabledModules: prev.enabledModules.includes(moduleId)
        ? prev.enabledModules.filter(m => m !== moduleId)
        : [...prev.enabledModules, moduleId]
    }));
  };

  const handleSelectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      enabledModules: Object.keys(ALL_MODULES)
    }));
  };

  const handleDeselectAllModules = () => {
    setFormData(prev => ({
      ...prev,
      enabledModules: ['dashboard']
    }));
  };

  const handleSubmit = () => {
    if (selectedTenant) {
      updateTenantMutation.mutate({ id: selectedTenant.id, ...formData });
    } else {
      createTenantMutation.mutate(formData);
    }
  };

  const handleToggleStatus = (tenant: Tenant) => {
    toggleStatusMutation.mutate({ id: tenant.id, isActive: !tenant.isActive });
  };

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (tenantToDelete) {
      deleteTenantMutation.mutate(tenantToDelete.id);
    }
  };

  const getSubscriptionLabel = (tier: string) => {
    switch (tier) {
      case 'basic': return 'Basic (€29/mj)';
      case 'standard': return 'Standard (€79/mj)';
      case 'full': return 'Full (€149/mj)';
      default: return tier;
    }
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'default';
      case 'standard': return 'primary';
      case 'full': return 'secondary';
      default: return 'default';
    }
  };

  if (tenantsQuery.isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress data-testid="loading-spinner" />
      </Box>
    );
  }

  if (tenantsQuery.error) {
    return (
      <Box p={3}>
        <Alert severity="error" data-testid="error-alert">
          Greška pri učitavanju tenants: {(tenantsQuery.error as Error).message}
        </Alert>
      </Box>
    );
  }

  const tenants = (tenantsQuery.data as Tenant[]) || [];

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" data-testid="page-title">
          Upravljanje Tenantima
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
          data-testid="button-create-tenant"
        >
          Novi Tenant
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table data-testid="tenants-table">
            <TableHead>
              <TableRow>
                <TableCell>Naziv</TableCell>
                <TableCell>Subdomen</TableCell>
                <TableCell>Pretplata</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Kreiran</TableCell>
                <TableCell>Ažuriran</TableCell>
                <TableCell align="right">Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" data-testid="no-tenants">
                    Nema tenants
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                    <TableCell data-testid={`text-name-${tenant.id}`}>
                      {tenant.name}
                    </TableCell>
                    <TableCell data-testid={`text-subdomain-${tenant.id}`}>
                      {tenant.subdomain}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getSubscriptionLabel(tenant.subscriptionTier)}
                        color={getSubscriptionColor(tenant.subscriptionTier) as any}
                        size="small"
                        data-testid={`chip-subscription-${tenant.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.isActive ? 'Aktivan' : 'Neaktivan'}
                        color={tenant.isActive ? 'success' : 'error'}
                        size="small"
                        icon={tenant.isActive ? <CheckCircle /> : <Block />}
                        data-testid={`chip-status-${tenant.id}`}
                      />
                    </TableCell>
                    <TableCell data-testid={`text-created-${tenant.id}`}>
                      {formatDateForDisplay(tenant.createdAt)}
                    </TableCell>
                    <TableCell data-testid={`text-updated-${tenant.id}`}>
                      {formatDateForDisplay(tenant.updatedAt)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleOpenModal(tenant)}
                        color="primary"
                        size="small"
                        data-testid={`button-edit-${tenant.id}`}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        onClick={() => handleToggleStatus(tenant)}
                        color={tenant.isActive ? 'error' : 'success'}
                        size="small"
                        data-testid={`button-toggle-${tenant.id}`}
                      >
                        {tenant.isActive ? <Block /> : <CheckCircle />}
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteClick(tenant)}
                        color="error"
                        size="small"
                        data-testid={`button-delete-${tenant.id}`}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle data-testid="dialog-title">
          {selectedTenant ? 'Uredi Tenant' : 'Kreiraj Novi Tenant'}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Naziv organizacije"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              data-testid="input-name"
            />
            <TextField
              label="Slug (URL identifier)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              fullWidth
              required
              disabled={!!selectedTenant}
              helperText={selectedTenant ? 'Slug se ne može mijenjati' : 'Npr: iz-zurich (lowercase, bez razmaka)'}
              data-testid="input-slug"
            />
            <TextField
              label="Tenant Code (Kod za login)"
              value={formData.tenantCode}
              onChange={(e) => setFormData({ ...formData, tenantCode: e.target.value.toUpperCase() })}
              fullWidth
              required
              disabled={!!selectedTenant}
              helperText={selectedTenant ? 'Tenant code se ne može mijenjati' : 'Npr: IZBERN2024 (uppercase, bez razmaka)'}
              data-testid="input-tenant-code"
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
              helperText="Kontakt email za organizaciju"
              data-testid="input-email"
            />
            <TextField
              label="Subdomen"
              value={formData.subdomain}
              onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
              fullWidth
              disabled={!!selectedTenant}
              helperText={selectedTenant ? 'Subdomen se ne može mijenjati' : 'Npr: moja-dzamija (opciono)'}
              data-testid="input-subdomain"
            />
            <TextField
              label="Paket pretplate"
              value={formData.subscriptionTier}
              onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value as any })}
              select
              fullWidth
              required
              data-testid="select-subscription"
            >
              <MenuItem value="basic" data-testid="option-basic">Basic - €29/mjesečno</MenuItem>
              <MenuItem value="standard" data-testid="option-standard">Standard - €79/mjesečno</MenuItem>
              <MenuItem value="full" data-testid="option-full">Full - €149/mjesečno</MenuItem>
            </TextField>

            <TextField
              label="Zadana valuta"
              value={formData.currency || 'CHF'}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              select
              fullWidth
              helperText="Valuta koja će biti zadana pri kreiranju organizacijskih podataka"
              data-testid="select-currency"
            >
              <MenuItem value="BAM" data-testid="option-bam">BAM (Bosanska marka)</MenuItem>
              <MenuItem value="CHF" data-testid="option-chf">CHF (Švicarski franak)</MenuItem>
              <MenuItem value="EUR" data-testid="option-eur">EUR (Euro)</MenuItem>
              <MenuItem value="USD" data-testid="option-usd">USD (Američki dolar)</MenuItem>
            </TextField>

            <Divider sx={{ my: 2 }} />
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Extension color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Uključeni Moduli ({formData.enabledModules.length}/{Object.keys(ALL_MODULES).length})
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={handleSelectAllModules} data-testid="button-select-all">
                    Sve
                  </Button>
                  <Button size="small" onClick={handleDeselectAllModules} data-testid="button-deselect-all">
                    Minimum
                  </Button>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                {Object.entries(ALL_MODULES).map(([id, module]) => (
                  <Box key={id} sx={{ width: '50%' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.enabledModules.includes(id)}
                          onChange={() => handleModuleToggle(id)}
                          disabled={id === 'dashboard'}
                          size="small"
                          data-testid={`checkbox-module-${id}`}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: id === 'dashboard' ? 'text.secondary' : 'text.primary' }}>
                          {module.name}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  </Box>
                ))}
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Dashboard je uvijek uključen. Odabrani moduli će biti dostupni korisnicima ovog tenanta.
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} data-testid="button-cancel">
            Otkaži
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={!formData.name || !formData.subdomain || createTenantMutation.isPending || updateTenantMutation.isPending}
            data-testid="button-submit"
          >
            {createTenantMutation.isPending || updateTenantMutation.isPending ? 'Čuvam...' : selectedTenant ? 'Sačuvaj' : 'Kreiraj'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle data-testid="delete-dialog-title">Potvrda brisanja</DialogTitle>
        <DialogContent>
          <Typography data-testid="delete-dialog-text">
            Da li ste sigurni da želite obrisati tenant "{tenantToDelete?.name}"?
            Ova akcija je nepovratna i obrisaće sve podatke vezane za ovog tenanta.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} data-testid="button-cancel-delete">
            Otkaži
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            disabled={deleteTenantMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteTenantMutation.isPending ? 'Brišem...' : 'Obriši'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
