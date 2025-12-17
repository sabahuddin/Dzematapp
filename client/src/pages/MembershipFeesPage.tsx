import { useState, useRef, useEffect } from 'react';
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
  TablePagination,
  Chip,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import {
  Upload,
  Search,
  Download,
  Add,
  Delete,
  Receipt,
  CloudUpload,
  Edit
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
  monthlyAmount: string;
  yearlyAmount: string;
  currentFiscalYear: number;
  currency: string;
  updatedAt: string | null;
  updatedById: string | null;
}

interface OrganizationSettings {
  id: string;
  name: string;
  currency: string;
  membershipFeeType: string;
}

interface GridMember {
  userId: string;
  registryNumber: number | null;
  firstName: string;
  lastName: string;
  phone: string;
  membershipFeeAmount: string | null;
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
  paid: string;
  owed: string;
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
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(new Date().getFullYear());
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [addPaymentDialogOpen, setAddPaymentDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    userId: '',
    amount: '',
    coverageYear: new Date().getFullYear(),
    coverageMonth: 1,
    autoDistribute: true
  });
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [gridPage, setGridPage] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const rowsPerPage = 20;

  if (featureAccess.upgradeRequired) {
    return <UpgradeCTA moduleId="membership-fees" requiredPlan={featureAccess.requiredPlan || 'standard'} currentPlan={featureAccess.currentPlan || 'basic'} />;
  }

  const currentYear = new Date().getFullYear();
  const yearOptions: (number | 'all')[] = ['all', ...Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i)];

  const settingsQuery = useQuery<MembershipSettings>({
    queryKey: ['/api/membership-fees/settings'],
    enabled: !!currentUser,
  });

  const orgSettingsQuery = useQuery<OrganizationSettings>({
    queryKey: ['/api/organization-settings'],
    enabled: !!currentUser,
  });

  const gridQuery = useQuery<GridMember[]>({
    queryKey: ['/api/membership-fees/members-grid', selectedYear],
    queryFn: async () => {
      const url = selectedYear === 'all' 
        ? '/api/membership-fees/members-grid?year=all'
        : `/api/membership-fees/members-grid?year=${selectedYear}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch grid');
      return res.json();
    },
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

  const allPaymentsQuery = useQuery<any[]>({
    queryKey: ['/api/membership-fees/payments', selectedYear],
    queryFn: async () => {
      const url = selectedYear === 'all'
        ? '/api/membership-fees/payments'
        : `/api/membership-fees/payments?year=${selectedYear}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: !!currentUser?.isAdmin,
  });

  const createPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/membership-fees/payments', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/members-grid', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/payments'] });
      setAddPaymentDialogOpen(false);
      setNewPayment({ userId: '', amount: '', coverageYear: currentYear, coverageMonth: 1, autoDistribute: true });
      toast({ title: t('membershipFees:messages.paymentAdded'), variant: 'default' });
    },
    onError: () => {
      toast({ title: t('membershipFees:messages.paymentError'), variant: 'destructive' });
    }
  });

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/membership-fees/payments/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/members-grid', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/payments'] });
      setEditPaymentDialogOpen(false);
      setEditingPayment(null);
      toast({ title: t('membershipFees:messages.paymentUpdated'), variant: 'default' });
    },
    onError: () => {
      toast({ title: t('membershipFees:messages.paymentUpdateError'), variant: 'destructive' });
    }
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/membership-fees/payments/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/members-grid', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['/api/membership-fees/payments'] });
      toast({ title: t('membershipFees:messages.paymentDeleted'), variant: 'default' });
    },
    onError: () => {
      toast({ title: t('membershipFees:messages.paymentDeleteError'), variant: 'destructive' });
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
      toast({ title: t('membershipFees:uploadResult.successMessage', { successful: data.successful, processed: data.processed }), variant: 'default' });
    },
    onError: () => {
      toast({ title: t('membershipFees:messages.uploadError'), variant: 'destructive' });
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
    const regNum = member.registryNumber ? `#${member.registryNumber}` : '';
    return fullName.includes(searchTerm.toLowerCase()) || regNum.includes(searchTerm);
  });

  const orgSettings = orgSettingsQuery.data;
  const allPayments = allPaymentsQuery.data || [];

  useEffect(() => {
    const maxGridPage = Math.max(0, Math.ceil(filteredGrid.length / rowsPerPage) - 1);
    if (gridPage > maxGridPage) setGridPage(maxGridPage);
  }, [filteredGrid.length, gridPage, rowsPerPage]);

  useEffect(() => {
    const maxPaymentsPage = Math.max(0, Math.ceil(allPayments.length / rowsPerPage) - 1);
    if (paymentsPage > maxPaymentsPage) setPaymentsPage(maxPaymentsPage);
  }, [allPayments.length, paymentsPage, rowsPerPage]);

  const handleAddPayment = () => {
    if (!newPayment.userId || !newPayment.amount) {
      toast({ title: t('membershipFees:messages.fillAllFields'), variant: 'destructive' });
      return;
    }
    createPaymentMutation.mutate(newPayment);
  };

  const downloadTemplate = (templateType?: 'monthly' | 'yearly') => {
    const templateYear = selectedYear === 'all' ? currentYear : selectedYear;
    const regNumCol = t('membershipFees:templateColumns.registryNumber');
    const fullNameCol = t('membershipFees:templateColumns.fullName');
    const amountCol = t('membershipFees:templateColumns.amount');
    const yearCol = t('membershipFees:templateColumns.year');
    const monthCol = t('membershipFees:templateColumns.month');
    
    const isMonthly = templateType === 'monthly' || (!templateType && orgSettings?.membershipFeeType === 'monthly');
    
    let templateData: any[];
    let cols: { wch: number }[];
    let filename: string;
    
    if (isMonthly) {
      templateData = [
        { [regNumCol]: 1, [fullNameCol]: 'Samir Halilović', [amountCol]: 30, [yearCol]: templateYear, [monthCol]: 1 },
        { [regNumCol]: 1, [fullNameCol]: 'Samir Halilović', [amountCol]: 30, [yearCol]: templateYear, [monthCol]: 2 },
        { [regNumCol]: 1, [fullNameCol]: 'Samir Halilović', [amountCol]: 30, [yearCol]: templateYear, [monthCol]: 3 },
        { [regNumCol]: 2, [fullNameCol]: 'Samira Halilović', [amountCol]: 50, [yearCol]: templateYear, [monthCol]: 1 },
      ];
      cols = [{ wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
      filename = `membership_fees_template_monthly_${templateYear}.xlsx`;
    } else {
      templateData = [
        { [regNumCol]: 1, [fullNameCol]: 'Samir Halilović', [amountCol]: 360, [yearCol]: templateYear },
        { [regNumCol]: 2, [fullNameCol]: 'Samira Halilović', [amountCol]: 600, [yearCol]: templateYear },
      ];
      cols = [{ wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 10 }];
      filename = `membership_fees_template_yearly_${templateYear}.xlsx`;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    worksheet['!cols'] = cols;
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t('membershipFees:title'));
    
    XLSX.writeFile(workbook, filename);
  };

  if (!currentUser?.isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          {t('membershipFees:messages.adminOnly')}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('membershipFees:title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Upload />}
          onClick={() => setUploadDialogOpen(true)}
          data-testid="button-bulk-upload"
        >
          {t('membershipFees:bulkUpload')}
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                placeholder={t('membershipFees:searchMembers')}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setGridPage(0); setPaymentsPage(0); }}
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
                <Select
                  value={selectedYear}
                  onChange={(e) => { setSelectedYear(e.target.value as number | 'all'); setGridPage(0); setPaymentsPage(0); }}
                  displayEmpty
                  data-testid="select-year"
                >
                  <MenuItem value="all">{t('membershipFees:allYears')}</MenuItem>
                  {yearOptions.filter(y => y !== 'all').map(year => (
                    <MenuItem key={String(year)} value={year}>{year}</MenuItem>
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
                {t('membershipFees:addPayment')}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              {settings && (
                <Chip 
                  label={orgSettings?.membershipFeeType === 'monthly' ? t('membershipFees:monthlyFee') : t('membershipFees:yearlyFee')} 
                  color="primary"
                  variant="outlined"
                />
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label={t('membershipFees:paymentsOverview')} data-testid="tab-payments-grid" />
        <Tab label={t('membershipFees:allPayments')} data-testid="tab-all-payments" />
        <Tab label={t('membershipFees:uploadHistory')} data-testid="tab-upload-history" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {gridQuery.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredGrid.length === 0 ? (
          <Alert severity="info">{t('membershipFees:noMembers')}</Alert>
        ) : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    {t('membershipFees:member')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 80 }}>
                    {t('membershipFees:title')}
                  </TableCell>
                  {selectedYear !== 'all' && orgSettings?.membershipFeeType === 'monthly' && MONTHS.map((month, idx) => (
                    <TableCell key={idx} align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>
                      {month}
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'success.main', color: 'white' }}>
                    {t('membershipFees:paid')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'error.main', color: 'white' }}>
                    {t('membershipFees:owed')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGrid
                  .slice(gridPage * rowsPerPage, gridPage * rowsPerPage + rowsPerPage)
                  .map((member) => (
                  <TableRow key={member.userId} hover>
                    <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {member.registryNumber && <span style={{ color: '#3949AB' }}>#{member.registryNumber} </span>}
                        {member.firstName} {member.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {member.phone}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'medium' }}>
                      {member.membershipFeeAmount ? `${member.membershipFeeAmount}` : '-'}
                    </TableCell>
                    {selectedYear !== 'all' && orgSettings?.membershipFeeType === 'monthly' && [1,2,3,4,5,6,7,8,9,10,11,12].map((monthNum) => {
                      const amount = member[monthNum as keyof GridMember] as string;
                      const isPaid = parseFloat(amount) > 0;
                      return (
                        <TableCell 
                          key={monthNum} 
                          align="center"
                          sx={{ 
                            bgcolor: isPaid ? 'success.main' : 'grey.100',
                            color: isPaid ? 'white' : 'text.disabled',
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
                        bgcolor: 'success.main', 
                        color: 'white' 
                      }}
                    >
                      {member.paid}
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontWeight: 'bold', 
                        bgcolor: parseFloat(member.owed) > 0 ? 'error.main' : 'grey.100', 
                        color: parseFloat(member.owed) > 0 ? 'white' : 'text.secondary' 
                      }}
                    >
                      {member.owed}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredGrid.length}
              page={gridPage}
              onPageChange={(_, newPage) => setGridPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[20]}
              labelDisplayedRows={({ from, to, count }) => t('membershipFees:pagination.displayedRows', { from, to, count })}
            />
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {allPaymentsQuery.isLoading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Card}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('membershipFees:member')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('membershipFees:amount')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('membershipFees:year')}</TableCell>
                  {orgSettings?.membershipFeeType === 'monthly' && (
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('membershipFees:month')}</TableCell>
                  )}
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('membershipFees:paymentDate')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('membershipFees:actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(allPaymentsQuery.data || [])
                  .slice(paymentsPage * rowsPerPage, paymentsPage * rowsPerPage + rowsPerPage)
                  .map((payment: any) => {
                  const user = users.find(u => u.id === payment.userId);
                  return (
                    <TableRow key={payment.id} hover>
                      <TableCell>
                        {user ? `${user.registryNumber ? `#${user.registryNumber} - ` : ''}${user.firstName} ${user.lastName}` : t('membershipFees:unknown')}
                      </TableCell>
                      <TableCell align="center">{payment.amount}</TableCell>
                      <TableCell align="center">{payment.coverageYear}</TableCell>
                      {orgSettings?.membershipFeeType === 'monthly' && (
                        <TableCell align="center">{payment.coverageMonth ? MONTHS[payment.coverageMonth - 1] : '-'}</TableCell>
                      )}
                      <TableCell align="center">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('bs-BA') : '-'}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setEditingPayment(payment);
                            setEditPaymentDialogOpen(true);
                          }}
                          data-testid={`button-edit-payment-${payment.id}`}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (confirm(t('membershipFees:messages.deleteConfirmPayment'))) {
                              deletePaymentMutation.mutate(payment.id);
                            }
                          }}
                          data-testid={`button-delete-payment-${payment.id}`}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={(allPaymentsQuery.data || []).length}
              page={paymentsPage}
              onPageChange={(_, newPage) => setPaymentsPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[20]}
              labelDisplayedRows={({ from, to, count }) => t('membershipFees:pagination.displayedRows', { from, to, count })}
            />
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {uploadLogsQuery.isLoading ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Card}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('membershipFees:uploadLog.date')}</TableCell>
                  <TableCell>{t('membershipFees:uploadLog.fileName')}</TableCell>
                  <TableCell align="center">{t('membershipFees:uploadLog.processed')}</TableCell>
                  <TableCell align="center">{t('membershipFees:uploadLog.successful')}</TableCell>
                  <TableCell align="center">{t('membershipFees:uploadLog.failed')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(uploadLogsQuery.data || []).map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {new Date(log.uploadedAt).toLocaleDateString('bs-BA')}
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

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => { setUploadDialogOpen(false); setUploadResult(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>{t('membershipFees:bulkUploadDialog.title')}</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CloudUpload sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" paragraph>
              {t('membershipFees:bulkUploadDialog.description')}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {t('membershipFees:bulkUploadDialog.columns')}
            </Typography>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('monthly')}
                  size="small"
                >
                  {t('membershipFees:bulkUploadDialog.downloadTemplateMonthly')}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => downloadTemplate('yearly')}
                  size="small"
                >
                  {t('membershipFees:bulkUploadDialog.downloadTemplateYearly')}
                </Button>
              </Box>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadFileMutation.isPending}
              >
                {uploadFileMutation.isPending ? t('membershipFees:bulkUploadDialog.uploading') : t('membershipFees:bulkUploadDialog.selectFile')}
              </Button>
            </Box>

            {uploadResult && (
              <Alert severity={uploadResult.failed > 0 ? 'warning' : 'success'} sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="body2">
                  <strong>{t('membershipFees:uploadResult.result')}:</strong> {t('membershipFees:uploadResult.successMessage', { successful: uploadResult.successful, processed: uploadResult.processed })}
                </Typography>
                {uploadResult.errors?.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="error">{t('membershipFees:uploadResult.errors')}:</Typography>
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
          <Button onClick={() => { setUploadDialogOpen(false); setUploadResult(null); }}>{t('membershipFees:bulkUploadDialog.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={addPaymentDialogOpen} onClose={() => setAddPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('membershipFees:addPaymentDialog.title')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>{t('membershipFees:addPaymentDialog.selectMember')}</InputLabel>
                <Select
                  value={newPayment.userId}
                  onChange={(e) => setNewPayment({ ...newPayment, userId: e.target.value })}
                  label={t('membershipFees:addPaymentDialog.selectMember')}
                >
                  {users.filter(u => u.status === 'aktivan' && !u.isAdmin).map((user: any) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.registryNumber ? `#${user.registryNumber} - ` : ''}{user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={t('membershipFees:addPaymentDialog.amount')}
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('membershipFees:addPaymentDialog.year')}</InputLabel>
                <Select
                  value={newPayment.coverageYear}
                  onChange={(e) => setNewPayment({ ...newPayment, coverageYear: e.target.value as number })}
                  label={t('membershipFees:addPaymentDialog.year')}
                >
                  {yearOptions.filter(y => y !== 'all').map(year => (
                    <MenuItem key={String(year)} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {orgSettings?.membershipFeeType === 'monthly' && (
              <>
                <Grid size={{ xs: 12 }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('membershipFees:addPaymentDialog.month')}</InputLabel>
                    <Select
                      value={newPayment.coverageMonth}
                      onChange={(e) => setNewPayment({ ...newPayment, coverageMonth: e.target.value as number })}
                      label={t('membershipFees:addPaymentDialog.month')}
                    >
                      {MONTHS.map((month, idx) => (
                        <MenuItem key={idx + 1} value={idx + 1}>{month}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={newPayment.autoDistribute}
                        onChange={(e) => setNewPayment({ ...newPayment, autoDistribute: e.target.checked })}
                        color="primary"
                      />
                    }
                    label={t('membershipFees:addPaymentDialog.autoDistribute')}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddPaymentDialogOpen(false)}>{t('membershipFees:addPaymentDialog.cancel')}</Button>
          <Button variant="contained" onClick={handleAddPayment} disabled={createPaymentMutation.isPending}>
            {t('membershipFees:addPaymentDialog.add')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog open={editPaymentDialogOpen} onClose={() => setEditPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('membershipFees:editPaymentDialog.title')}</DialogTitle>
        <DialogContent>
          {editingPayment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary">
                  {t('membershipFees:editPaymentDialog.member')}: {users.find(u => u.id === editingPayment.userId)?.firstName} {users.find(u => u.id === editingPayment.userId)?.lastName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  label={t('membershipFees:editPaymentDialog.amount')}
                  type="number"
                  value={editingPayment.amount || ''}
                  onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('membershipFees:editPaymentDialog.year')}</InputLabel>
                  <Select
                    value={editingPayment.coverageYear || currentYear}
                    onChange={(e) => setEditingPayment({ ...editingPayment, coverageYear: e.target.value as number })}
                    label={t('membershipFees:editPaymentDialog.year')}
                  >
                    {yearOptions.filter(y => y !== 'all').map(year => (
                      <MenuItem key={String(year)} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('membershipFees:editPaymentDialog.month')}</InputLabel>
                  <Select
                    value={editingPayment.coverageMonth || 1}
                    onChange={(e) => setEditingPayment({ ...editingPayment, coverageMonth: e.target.value as number })}
                    label={t('membershipFees:editPaymentDialog.month')}
                  >
                    {MONTHS.map((month, idx) => (
                      <MenuItem key={idx + 1} value={idx + 1}>{month}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditPaymentDialogOpen(false)}>{t('membershipFees:editPaymentDialog.cancel')}</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (editingPayment) {
                updatePaymentMutation.mutate({
                  id: editingPayment.id,
                  data: {
                    amount: editingPayment.amount,
                    coverageYear: editingPayment.coverageYear,
                    coverageMonth: editingPayment.coverageMonth
                  }
                });
              }
            }} 
            disabled={updatePaymentMutation.isPending}
          >
            {t('membershipFees:editPaymentDialog.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
