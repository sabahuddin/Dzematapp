import { Box, Typography, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { TrendingUp } from '@mui/icons-material';
import { format } from 'date-fns';
import { useCurrency } from '@/contexts/CurrencyContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MembershipFee {
  id: number;
  amount: string;
  paidAt: Date;
  userId: number;
}

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function MembershipFeeWidget() {
  const [, setLocation] = useLocation();
  const { formatPrice } = useCurrency();

  const { data: membershipFees = [] } = useQuery<MembershipFee[]>({
    queryKey: ['/api/membership-fees'],
  });

  const feeChartData = (() => {
    const months: { [key: string]: number } = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, 'MMM');
      months[key] = 0;
    }
    membershipFees.forEach(fee => {
      if (fee.paidAt) {
        const key = format(new Date(fee.paidAt), 'MMM');
        if (months[key] !== undefined) {
          months[key] += parseFloat(fee.amount || '0');
        }
      }
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  })();

  const totalFeesThisMonth = membershipFees
    .filter(f => {
      if (!f.paidAt) return false;
      const d = new Date(f.paidAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, f) => sum + parseFloat(f.amount || '0'), 0);

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Članarina</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/membership-fees')}
          >
            Upravljaj
          </Typography>
        </Box>
        <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ mb: 1 }}>
          {formatPrice(totalFeesThisMonth)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Ovaj mjesec
        </Typography>
        <Box sx={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={feeChartData}>
              <defs>
                <linearGradient id="colorFee" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3949AB" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3949AB" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => formatPrice(value)} />
              <Area type="monotone" dataKey="value" stroke="#3949AB" fillOpacity={1} fill="url(#colorFee)" />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
