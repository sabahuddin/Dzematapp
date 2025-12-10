import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  Alert,
  Chip
} from '@mui/material';
import { AttachMoney, CalendarMonth, Category } from '@mui/icons-material';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../contexts/CurrencyContext';
import { FinancialContribution } from '@shared/schema';

export default function MyContributionsPage() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { t } = useTranslation(['finances', 'common']);

  const contributionsQuery = useQuery<FinancialContribution[]>({
    queryKey: ['/api/financial-contributions/user', user?.id],
    enabled: !!user?.id,
  });

  if (contributionsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (contributionsQuery.error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Greška pri učitavanju vaših uplata. Pokušajte ponovo.
      </Alert>
    );
  }

  const contributions = contributionsQuery.data || [];
  const totalAmount = contributions.reduce((sum, c) => sum + parseFloat(c.amount || '0'), 0);
  const totalPoints = contributions.reduce((sum, c) => sum + (c.pointsValue || 0), 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: '#0D1B2A' }}>
        Moje uplate
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <Card sx={{ bgcolor: '#E8EAF6', borderRadius: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AttachMoney sx={{ fontSize: 40, color: '#3949AB' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Ukupno uplaćeno</Typography>
              <Typography variant="h5" fontWeight={700} color="#3949AB">
                {formatPrice(totalAmount)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: '#E3F2FD', borderRadius: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Category sx={{ fontSize: 40, color: '#1E88E5' }} />
            <Box>
              <Typography variant="body2" color="text.secondary">Osvojeni bodovi</Typography>
              <Typography variant="h5" fontWeight={700} color="#1E88E5">
                {totalPoints}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {contributions.length === 0 ? (
        <Card sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
          <AttachMoney sx={{ fontSize: 60, color: '#B0BEC5', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Nemate evidentiranih uplata
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Kada izvršite donaciju ili uplatu, ona će se prikazati ovdje.
          </Typography>
        </Card>
      ) : (
        <TableContainer component={Card} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: '#F5F5F5' }}>
              <TableRow>
                <TableCell><strong>Datum</strong></TableCell>
                <TableCell><strong>Svrha</strong></TableCell>
                <TableCell align="right"><strong>Iznos</strong></TableCell>
                <TableCell align="right"><strong>Bodovi</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contributions.map((contribution) => (
                <TableRow key={contribution.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarMonth fontSize="small" color="action" />
                      {contribution.paymentDate 
                        ? format(new Date(contribution.paymentDate), 'dd. MMMM yyyy.', { locale: bs })
                        : '-'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={contribution.purpose || 'Donacija'} 
                      size="small" 
                      sx={{ bgcolor: '#E8EAF6', color: '#3949AB' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600} color="#26A69A">
                      {formatPrice(parseFloat(contribution.amount || '0'))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    {contribution.pointsValue ? (
                      <Chip 
                        label={`+${contribution.pointsValue}`} 
                        size="small" 
                        sx={{ bgcolor: '#E3F2FD', color: '#1E88E5' }}
                      />
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
