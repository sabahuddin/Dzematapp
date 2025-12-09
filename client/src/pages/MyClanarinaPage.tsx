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

const MONTHS = [
  'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
  'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
];

export default function MyClanarinaPage() {
  const { user } = useAuth();
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
        Moja članarina
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Mjesečna članarina
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {monthlyFee > 0 ? `${monthlyFee.toFixed(2)} KM` : 'Nije postavljeno'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {feeType === 'monthly' ? 'Mjesečno plaćanje' : 'Godišnje plaćanje'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Uplaćeno ({selectedYear})
              </Typography>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {totalPaidThisYear.toFixed(2)} KM
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {paidMonths.size} od 12 mjeseci
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Duguje ({selectedYear})
              </Typography>
              <Typography variant="h4" fontWeight="bold" color={owedThisYear > 0 ? 'error.main' : 'success.main'}>
                {owedThisYear.toFixed(2)} KM
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {owedThisYear > 0 ? `${12 - paidMonths.size} mjeseci neplaćeno` : 'Sve izmireno'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Pregled po mjesecima</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Godina</InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value as number)}
                label="Godina"
              >
                {yearOptions.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {monthlyFee === 0 ? (
            <Alert severity="info">
              Vaša članarina još nije postavljena. Kontaktirajte administratora za više informacija.
            </Alert>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mjesec</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Iznos</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Datum uplate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {MONTHS.map((month, idx) => {
                    const monthNum = idx + 1;
                    const payment = yearPayments.find((p: any) => p.coverageMonth === monthNum);
                    const isPaid = !!payment;
                    
                    return (
                      <TableRow key={monthNum} hover>
                        <TableCell>{month}</TableCell>
                        <TableCell align="center">
                          {isPaid ? (
                            <Chip 
                              icon={<CheckCircle />} 
                              label="Plaćeno" 
                              color="success" 
                              size="small" 
                              variant="outlined"
                            />
                          ) : (
                            <Chip 
                              icon={<Cancel />} 
                              label="Neplaćeno" 
                              color="error" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isPaid ? `${parseFloat(payment.amount).toFixed(2)} KM` : '-'}
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
            <Typography variant="h6" sx={{ mb: 2 }}>Historija svih uplata</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Godina</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mjesec</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Iznos</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Datum uplate</TableCell>
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
                        <TableCell>{MONTHS[payment.coverageMonth - 1]}</TableCell>
                        <TableCell align="right">{parseFloat(payment.amount).toFixed(2)} KM</TableCell>
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
