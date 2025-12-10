import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, Visibility, CheckCircle, Cancel, PersonOff, Extension } from '@mui/icons-material';
import { ALL_MODULES } from '../contexts/ModuleContext';

const DEFAULT_MODULES = ['dashboard', 'announcements', 'events', 'vaktija', 'users'];
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Tenant } from "@shared/schema";

interface TenantStats {
  userCount: number;
  storageUsed: number;
  activeSubscription: boolean;
}

export default function SuperAdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [selectedTenantStats, setSelectedTenantStats] = useState<TenantStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is Super Admin
  if (!user?.isSuperAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Nemate pristup ovoj stranici. Samo Super Admin može pristupiti tenant management panelu.
        </Alert>
      </Box>
    );
  }

  // Fetch all tenants
  const { data: tenants = [], isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"]
  });

  // Fetch subscription plans
  const { data: subscriptionPlans = [] } = useQuery({
    queryKey: ["/api/subscription/plans"]
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    tenantCode: "",
    subdomain: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "Switzerland",
    subscriptionTier: "basic",
    subscriptionStatus: "trial",
    locale: "bs",
    currency: "CHF",
    isActive: true,
    enabledModules: DEFAULT_MODULES as string[]
  });

  const handleModuleToggle = (moduleId: string) => {
    setFormData(prev => {
      const modules = prev.enabledModules.includes(moduleId)
        ? prev.enabledModules.filter(m => m !== moduleId)
        : [...prev.enabledModules, moduleId];
      return { ...prev, enabledModules: modules };
    });
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

  // Create tenant mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/tenants", "POST", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      if (data.adminCredentials) {
        toast({ 
          title: "Tenant kreiran uspješno!", 
          description: `Admin login: ${data.adminCredentials.username} / ${data.adminCredentials.password}`,
        });
      } else {
        toast({ 
          title: "Tenant kreiran uspješno!", 
          description: "Tenant je kreiran."
        });
      }
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjelo kreiranje tenant-a",
        variant: "destructive" 
      });
    }
  });

  // Update tenant mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/tenants/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({ title: "Tenant ažuriran uspješno!" });
      setDialogOpen(false);
      resetForm();
      setSelectedTenant(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjelo ažuriranje tenant-a",
        variant: "destructive" 
      });
    }
  });

  // Toggle tenant status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiRequest(`/api/tenants/${id}/status`, "PATCH", { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({ title: "Status promijenjen uspješno!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjela promjena statusa",
        variant: "destructive" 
      });
    }
  });

  // Delete tenant mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tenants/${id}`, "DELETE", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({ title: "Tenant obrisan uspješno!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjelo brisanje tenant-a",
        variant: "destructive" 
      });
    }
  });

  // Delete all tenant users mutation
  const deleteAllUsersMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/tenants/${id}/users`, "DELETE", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({ title: data.message || "Svi korisnici obrisani!" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjelo brisanje korisnika",
        variant: "destructive" 
      });
    }
  });

  // Clean duplicate admin users mutation
  const cleanDuplicatesMutation = useMutation({
    mutationFn: () => apiRequest("/api/tenants/clean-duplicates", "POST", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      const count = data.results?.reduce((sum: number, r: any) => sum + (r.deleted || 0), 0) || 0;
      toast({ 
        title: "Čišćenje završeno!", 
        description: `Obrisano ${count} duplikata admin korisnika.`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjelo čišćenje duplikata",
        variant: "destructive" 
      });
    }
  });

  // Purge demo users from all tenants mutation
  const purgeDemoUsersMutation = useMutation({
    mutationFn: () => apiRequest("/api/tenants/purge-demo-users", "POST", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      const count = data.results?.reduce((sum: number, r: any) => sum + (r.deleted || 0), 0) || 0;
      toast({ 
        title: "Čišćenje završeno!", 
        description: `Obrisano ${count} demo korisnika iz svih tenanta.`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Greška", 
        description: error.message || "Neuspjelo čišćenje demo korisnika",
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      tenantCode: "",
      subdomain: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "Switzerland",
      subscriptionTier: "basic",
      subscriptionStatus: "trial",
      locale: "bs",
      currency: "CHF",
      isActive: true,
      enabledModules: DEFAULT_MODULES
    });
  };

  const handleOpenDialog = (tenant?: Tenant) => {
    if (tenant) {
      setSelectedTenant(tenant);
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        tenantCode: tenant.tenantCode,
        subdomain: tenant.subdomain || "",
        email: tenant.email,
        phone: tenant.phone || "",
        address: tenant.address || "",
        city: tenant.city || "",
        country: tenant.country,
        subscriptionTier: tenant.subscriptionTier,
        subscriptionStatus: tenant.subscriptionStatus,
        locale: tenant.locale,
        currency: tenant.currency,
        isActive: tenant.isActive,
        enabledModules: (tenant as any).enabledModules || DEFAULT_MODULES
      });
    } else {
      setSelectedTenant(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (selectedTenant) {
      updateMutation.mutate({ id: selectedTenant.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleViewStats = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/stats`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const stats = await response.json();
      setSelectedTenantStats(stats);
      setStatsDialogOpen(true);
    } catch (error) {
      toast({ 
        title: "Greška", 
        description: "Neuspjelo učitavanje statistike",
        variant: "destructive" 
      });
    }
  };

  const handleToggleStatus = (tenant: Tenant) => {
    toggleStatusMutation.mutate({ id: tenant.id, isActive: !tenant.isActive });
  };

  const handleDelete = (tenant: Tenant) => {
    if (window.confirm(`Da li ste sigurni da želite obrisati tenant "${tenant.name}"? Ova akcija je nepovratna.`)) {
      deleteMutation.mutate(tenant.id);
    }
  };

  const handleDeleteAllUsers = (tenant: Tenant) => {
    if (window.confirm(`Da li ste sigurni da želite obrisati SVE korisnike iz "${tenant.name}"? Ova akcija je nepovratna!`)) {
      deleteAllUsersMutation.mutate(tenant.id);
    }
  };

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.tenantCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'info';
      case 'suspended': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100%' }}>
      <Typography variant="h5" data-testid="text-page-title" sx={{ mb: 2, fontSize: { xs: '1.25rem', md: '2rem' } }}>
        Super Admin Panel
      </Typography>

      {/* Tenant Management */}
      <Box sx={{ mb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<Add />} 
              onClick={() => handleOpenDialog()}
              data-testid="button-create-tenant"
              sx={{ order: { xs: -1, sm: 0 } }}
            >
              Novi Tenant
            </Button>
            <Button 
              variant="outlined"
              size="small"
              color="warning"
              onClick={() => cleanDuplicatesMutation.mutate()}
              disabled={cleanDuplicatesMutation.isPending}
              data-testid="button-clean-duplicate-admins"
            >
              {cleanDuplicatesMutation.isPending ? <CircularProgress size={16} /> : 'Duplikati'}
            </Button>
            <Button 
              variant="outlined"
              size="small"
              color="error"
              onClick={() => {
                if (window.confirm('Obrisati sve demo korisnike iz svih tenanta osim Demo Džemata?')) {
                  purgeDemoUsersMutation.mutate();
                }
              }}
              disabled={purgeDemoUsersMutation.isPending}
              data-testid="button-purge-demo-users"
            >
              {purgeDemoUsersMutation.isPending ? <CircularProgress size={16} /> : 'Demo'}
            </Button>
          </Box>

          <Card sx={{ p: 1, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Pretraži..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </Card>

          <TableContainer component={Card} sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Naziv</strong></TableCell>
              <TableCell><strong>Kod</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Pretplata</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Aktivnost</strong></TableCell>
              <TableCell><strong>Kreiran</strong></TableCell>
              <TableCell align="center"><strong>Akcije</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">
                    Nema tenant-a za prikaz
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants.map((tenant) => (
                <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>
                    <Chip label={tenant.tenantCode} size="small" />
                  </TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={tenant.subscriptionTier} 
                      size="small" 
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={tenant.subscriptionStatus} 
                      size="small" 
                      color={getStatusColor(tenant.subscriptionStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={tenant.isActive ? <CheckCircle /> : <Cancel />}
                      label={tenant.isActive ? 'Aktivan' : 'Neaktivan'}
                      size="small"
                      color={tenant.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(tenant.createdAt), 'dd.MM.yyyy')}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      size="small" 
                      onClick={() => handleViewStats(tenant.id)}
                      data-testid={`button-stats-${tenant.id}`}
                      title="Prikaži statistiku"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(tenant)}
                      data-testid={`button-edit-${tenant.id}`}
                      title="Uredi"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleToggleStatus(tenant)}
                      data-testid={`button-toggle-${tenant.id}`}
                      title={tenant.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                    >
                      {tenant.isActive ? <Cancel /> : <CheckCircle />}
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteAllUsers(tenant)}
                      color="warning"
                      data-testid={`button-delete-users-${tenant.id}`}
                      title="Obriši sve korisnike"
                    >
                      <PersonOff />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(tenant)}
                      color="error"
                      data-testid={`button-delete-${tenant.id}`}
                      title="Obriši tenant"
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTenant ? 'Uredi Tenant' : 'Novi Tenant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Naziv"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-name"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Slug (URL-friendly)"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
                data-testid="input-slug"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Tenant Kod"
                value={formData.tenantCode}
                onChange={(e) => setFormData({ ...formData, tenantCode: e.target.value })}
                required
                data-testid="input-tenantCode"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                data-testid="input-subdomain"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="input-email"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Telefon"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-phone"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Adresa"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                data-testid="input-address"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Grad"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                data-testid="input-city"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Subscription Tier</InputLabel>
                <Select
                  value={formData.subscriptionTier}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                  label="Subscription Tier"
                  data-testid="select-subscriptionTier"
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="standard">Standard</MenuItem>
                  <MenuItem value="full">Full</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Subscription Status</InputLabel>
                <Select
                  value={formData.subscriptionStatus}
                  onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                  label="Subscription Status"
                  data-testid="select-subscriptionStatus"
                >
                  <MenuItem value="trial">Trial</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Jezik</InputLabel>
                <Select
                  value={formData.locale}
                  onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                  label="Jezik"
                  data-testid="select-locale"
                >
                  <MenuItem value="bs">Bosanski</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="sq">Shqip</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Valuta</InputLabel>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  label="Valuta"
                  data-testid="select-currency"
                >
                  <MenuItem value="CHF">CHF</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} data-testid="button-cancel">
            Otkaži
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit"
          >
            {createMutation.isPending || updateMutation.isPending ? <CircularProgress size={20} /> : (selectedTenant ? 'Ažuriraj' : 'Kreiraj')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onClose={() => setStatsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Statistika Tenant-a</DialogTitle>
        <DialogContent>
          {selectedTenantStats && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Broj korisnika:</strong> {selectedTenantStats.userCount}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Storage korišten:</strong> {selectedTenantStats.storageUsed} MB
              </Typography>
              <Typography variant="body1">
                <strong>Aktivna pretplata:</strong> {selectedTenantStats.activeSubscription ? 'Da' : 'Ne'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialogOpen(false)}>Zatvori</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
