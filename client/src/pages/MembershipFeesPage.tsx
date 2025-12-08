import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Upload,
  Settings,
  Search,
  Download,
  Add,
  Delete,
  Receipt,
  CloudUpload
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { UpgradeCTA } from '../components/UpgradeCTA';
import * as XLSX from 'xlsx';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface MembershipSettings {
  id: string;
  tenantId: string;
  feeType: string;
  monthlyAmount: string;
  yearlyAmount: string;
  currentFiscalYear: number;
  currency: string;
  updatedAt: string | null;
  updatedById: string | null;
}

interface GridMember {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  total: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];

export default function MembershipFeesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation(['membershipFees', 'common']);
  const featureAccess = useFeatureAccess('membership-fees');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    userId: '',
    amount: '',
    coverageYear: new Date().getFullYear(),
    coverageMonth: 1
  });
  const [editSettings, setEditSettings] = useState({
    feeType: 'monthly'
  });

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="membership-fees" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  const settingsQuery = useQuery<MembershipSettings>({
    queryKey: ['/api/membership-fees/settings'],
    enabled: !!currentUser,
  });

  const gridQuery = useQuery<GridMember[]>({
    queryKey: ['/api/membership-fees/members-grid', selectedYear],
    enabled: !!currentUser?.isAdmin,
  });

  const usersQuery = useQuery<any[]>({
    queryKey: ['/api/users'],
    enabled: !!currentUser?.isAdmin,
  });

  const uploadLogsQuery = useQuery<any[]>({
    queryKey: ['/api/membership-fees/upload-logs'],
    enabled: !!currentUser?.isAdmin,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<MembershipSettings>) => {
      return await apiRequest('/api/membership-fees/settings', 'PATCH', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/settings'] });
      setSettingsDialogOpen(false);
      toast({ title: 'Postavke uspješno sačuvane', variant: 'default' });
    },
    onError: () => {
      toast({ title: 'Greška pri čuvanju postavki', variant: 'destructive' });
    }
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/membership-fees/payments', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/members-grid', selectedYear] });
      setAddPaymentDialogOpen(false);
      setNewPayment({ userId: '', amount: '', coverageYear: currentYear, coverageMonth: 1 });
      toast({ title: 'Uplata uspješno dodana', variant: 'default' });
    },
    onError: () => {
      toast({ title: 'Greška pri dodavanju uplate', variant: 'destructive' });
    }
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/membership-fees/payments/bulk-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/members-grid', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/upload-logs'] });
      setUploadResult(data);
      toast({ title: data.message, variant: 'default' });
    },
    onError: () => {
      toast({ title: 'Greška pri uploadu fajla', variant: 'destructive' });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFileMutation.mutate(file);
    }
  };

  const settings = settingsQuery.data;
  const gridData = gridQuery.data || [];
  const users = usersQuery.data || [];

  const filteredGrid = gridData.filter(member => {
    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  const openSettingsDialog = () => {
    if (settings) {
      setEditSettings({
        feeType: settings.feeType
      });
    }
    setSettingsDialogOpen(true);
  };

  const handleSaveSettings = () => {
    updateSettingsMutation.mutate({
      feeType: editSettings.feeType
    });
  };

  const handleAddPayment = () => {
    if (!newPayment.userId || !newPayment.amount) {
      toast({ title: 'Popunite sva polja', variant: 'destructive' });
      return;
    }
    createPaymentMutation.mutate(newPayment);
  };

  const downloadTemplate = () => {
    const templateData = [
      { 'Ime i Prezime': 'Mujo Mujić', 'Iznos': 30, 'Godina': selectedYear, 'Mjesec': 1 },
      { 'Ime i Prezime': 'Mujo Mujić', 'Iznos': 30, 'Godina': selectedYear, 'Mjesec': 2 },
      { 'Ime i Prezime': 'Mujo Mujić', 'Iznos': 30, 'Godina': selectedYear, 'Mjesec': 3 },
      { 'Ime i Prezime': 'Haso Hasić', 'Iznos': 50, 'Godina': selectedYear, 'Mjesec': 1 },
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Članarina');
    
    XLSX.writeFile(workbook, `clanarina_template_${selectedYear}.xlsx`);
  };

  if (!currentUser?.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Samo administratori mogu pristupiti ovoj stranici.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
          Članarina
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={openSettingsDialog}
            data-testid="button-membership-settings"
          >
            Postavke
          </Button>
          <Button
            variant="contained"
            startIcon={<Upload />}
            onClick={() => setUploadDialogOpen(true)}
            data-testid="button-bulk-upload"
          >
            Bulk Upload
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                placeholder="Pretraži po imenu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
                data-testid="input-search-members"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Godina</InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value as number)}
                  label="Godina"
                  data-testid="select-year"
                >
                  {yearOptions.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setAddPaymentDialogOpen(true)}
                fullWidth
                data-testid="button-add-payment"
              >
                Dodaj uplatu
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              {settings && (
                <Chip 
                  label={settings.feeType === 'monthly' ? 'Mjesečna naplata' : 'Godišnja naplata'} 
                  color="primary"
                  variant="outlined"
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Pregled uplatnica" data-testid="tab-payments-grid" />
        <Tab label="Historija upload-a" data-testid="tab-upload-history" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {gridQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredGrid.length === 0 ? (
          <Alert severity="info">Nema članova za prikaz.</Alert>
        ) : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    Član
                  </TableCell>
                  {MONTHS.map((month, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                      {month}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white' }}>
                    Ukupno
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGrid.map((member) => (
                  <TableRow key={member.userId} hover>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {member.firstName} {member.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.phone}
                      </Typography>
                    </TableCell>
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((monthNum) => {
                      const amount = member[monthNum as keyof GridMember] as string;
                      const isPaid = parseFloat(amount) > 0;
                      return (
                        <TableCell 
                          key={monthNum} 
                          align="center"
                          sx={{ 
                            bgcolor: isPaid ? 'success.light' : 'grey.100',
                            color: isPaid ? 'success.dark' : 'text.disabled',
                            fontWeight: isPaid ? 'bold' : 'normal'
                          }}
                        >
                          {amount}
                        </TableCell>
                      );
                    })}
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: 'primary.main', 
                        color: 'white' 
                      }}
                    >
                      {member.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {uploadLogsQuery.isLoading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Card}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Datum</TableCell>
                  <TableCell>Fajl</TableCell>
                  <TableCell align="center">Obrađeno</TableCell>
                  <TableCell align="center">Uspješno</TableCell>
                  <TableCell align="center">Neuspješno</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(uploadLogsQuery.data || []).map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.uploadDate).toLocaleDateString('bs-BA')}
                    </TableCell>
                    <TableCell>{log.fileName}</TableCell>
                    <TableCell align="center">{log.recordsProcessed}</TableCell>
                    <TableCell align="center">
                      <Chip label={log.recordsSuccessful} color="success" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={log.recordsFailed} color={log.recordsFailed > 0 ? 'error' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Postavke članarine</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tip naplate</InputLabel>
            <Select
              value={editSettings.feeType}
              onChange={(e) => setEditSettings({ ...editSettings, feeType: e.target.value })}
              label="Tip naplate"
            >
              <MenuItem value="monthly">Mjesečno</MenuItem>
              <MenuItem value="yearly">Godišnje</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            Valuta se definiše u podešavanjima organizacije.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Otkaži</Button>
          <Button variant="contained" onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
            Sačuvaj
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => { setUploadDialogOpen(false); setUploadResult(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload Uplata</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" paragraph>
              Uploadajte Excel ili CSV fajl sa uplatama.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Kolone: <strong>Ime i Prezime, Iznos, Godina, Mjesec</strong>
            </Typography>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={downloadTemplate}
              >
                Preuzmi template
              </Button>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFileMutation.isPending}
              >
                {uploadFileMutation.isPending ? 'Učitavanje...' : 'Izaberi fajl'}
              </Button>
            </Box>

            {uploadResult && (
              <Alert severity={uploadResult.failed > 0 ? 'warning' : 'success'} sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>Rezultat:</strong> {uploadResult.successful} od {uploadResult.processed} uplata uspješno uneseno.
                </Typography>
                {uploadResult.errors?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="error">Greške:</Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {uploadResult.errors.slice(0, 5).map((err: string, idx: number) => (
                        <li key={idx}><Typography variant="caption">{err}</Typography></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialogOpen(false); setUploadResult(null); }}>Zatvori</Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialogOpen} onClose={() => setAddPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Dodaj pojedinačnu uplatu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Član</InputLabel>
                <Select
                  value={newPayment.userId}
                  onChange={(e) => setNewPayment({ ...newPayment, userId: e.target.value })}
                  label="Član"
                >
                  {users.filter(u => u.status === 'aktivan' && !u.isAdmin).map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Iznos"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Godina</InputLabel>
                <Select
                  value={newPayment.coverageYear}
                  onChange={(e) => setNewPayment({ ...newPayment, coverageYear: e.target.value as number })}
                  label="Godina"
                >
                  {yearOptions.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>Mjesec</InputLabel>
                <Select
                  value={newPayment.coverageMonth}
                  onChange={(e) => setNewPayment({ ...newPayment, coverageMonth: e.target.value as number })}
                  label="Mjesec"
                >
                  {MONTHS.map((month, idx) => (
                    <MenuItem key={idx + 1} value={idx + 1}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentDialogOpen(false)}>Otkaži</Button>
          <Button variant="contained" onClick={handleAddPayment} disabled={createPaymentMutation.isPending}>
            Dodaj
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
