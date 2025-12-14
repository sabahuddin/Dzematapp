import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { Receipt, CheckCircle, Cancel } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from 'react-i18next';

export default function MyClanarinaPage() {
  const { user } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const { t } = useTranslation(['membershipFees']);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const { data: myData, isLoading } = useQuery<{
    payments: any[];
    membershipFeeAmount: number | null;
    feeType: string;
  }>({
    queryKey: ['/api/membership-fees/my-status'],
  });

  const payments = myData?.payments || [];
  const monthlyFee = myData?.membershipFeeAmount || 0;
  const feeType = myData?.feeType || 'monthly';

  const yearPayments = payments.filter((p: any) => p.coverageYear === selectedYear);
  
  const paidMonths = new Set(yearPayments.map((p: any) => p.coverageMonth));
  const totalPaidThisYear = yearPayments.reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);
  
  const expectedTotal = feeType === 'monthly' ? monthlyFee * 12 : monthlyFee;
  const owedThisYear = Math.max(0, expectedTotal - totalPaidThisYear);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Receipt color="primary" />
        {t('membershipFees:myPayments.title')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('membershipFees:myPayments.monthlyFee')}
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {monthlyFee > 0 ? formatPrice(monthlyFee) : t('membershipFees:myPayments.notSet')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {feeType === 'monthly' ? t('membershipFees:myPayments.monthlyPayment') : t('membershipFees:myPayments.yearlyPayment')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('membershipFees:myPayments.paidIn')} ({selectedYear})
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {formatPrice(totalPaidThisYear)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {paidMonths.size} {t('membershipFees:myPayments.monthsOf')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t('membershipFees:myPayments.owes')} ({selectedYear})
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={owedThisYear > 0 ? 'error.main' : 'success.main'}>
                {formatPrice(owedThisYear)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {owedThisYear > 0 ? `${12 - paidMonths.size} ${t('membershipFees:myPayments.monthsUnpaid')}` : t('membershipFees:myPayments.allPaid')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('membershipFees:myPayments.monthlyOverview')}</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>{t('membershipFees:year')}</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as number)}
                label={t('membershipFees:year')}
              >
                {yearOptions.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {monthlyFee === 0 ? (
            <Alert severity="info">
              {t('membershipFees:myPayments.feeNotSet')}
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('membershipFees:month')}</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('membershipFees:myPayments.status')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('membershipFees:amount')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('membershipFees:myPayments.paymentDate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((monthNum) => {
                    const payment = yearPayments.find((p: any) => p.coverageMonth === monthNum);
                    const isPaid = !!payment;
                    
                    return (
                      <TableRow key={monthNum} hover>
                        <TableCell>{t(`membershipFees:months.${monthNum}`)}</TableCell>
                        <TableCell align="center">
                          {isPaid ? (
                            <Chip 
                              icon={<CheckCircle />} 
                              label={t('membershipFees:myPayments.paid')} 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              icon={<Cancel />} 
                              label={t('membershipFees:myPayments.unpaid')} 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isPaid ? formatPrice(parseFloat(payment.amount)) : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {isPaid && payment.paidAt 
                            ? new Date(payment.paidAt).toLocaleDateString('bs-BA')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>{t('membershipFees:myPayments.allPaymentsHistory')}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('membershipFees:year')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('membershipFees:month')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('membershipFees:amount')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('membershipFees:myPayments.paymentDate')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments
                    .sort((a: any, b: any) => {
                      if (b.coverageYear !== a.coverageYear) return b.coverageYear - a.coverageYear;
                      return b.coverageMonth - a.coverageMonth;
                    })
                    .map((payment: any) => (
                      <TableRow key={payment.id} hover>
                        <TableCell>{payment.coverageYear}</TableCell>
                        <TableCell>{t(`membershipFees:months.${payment.coverageMonth}`)}</TableCell>
                        <TableCell align="right">{formatPrice(parseFloat(payment.amount))}</TableCell>
                        <TableCell align="right">
                          {payment.paidAt 
                            ? new Date(payment.paidAt).toLocaleDateString('bs-BA')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
