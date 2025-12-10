import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Store } from '@mui/icons-material';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface ShopItem {
  id: number;
  name: string;
  price: string;
  photos?: string[];
  itemType: 'product' | 'marketplace';
  createdAt?: Date;
}

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function ShopWidget() {
  const [, setLocation] = useLocation();
  const { formatPrice } = useCurrency();

  const { data: shopItems = [], isLoading } = useQuery<ShopItem[]>({
    queryKey: ['/api/dashboard/recent-shop'],
  });

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Store fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Zadnji oglasi</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/shop')}
          >
            Vidi sve
          </Typography>
        </Box>

        {isLoading ? (
          <CircularProgress size={20} />
        ) : shopItems.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nema oglasa</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {shopItems.slice(0, 5).map((item) => {
              const imageUrl = item.photos?.[0] ? (normalizeImageUrl(item.photos[0]) || '/placeholder.png') : '/placeholder.png';
              return (
                <Box 
                  key={`${item.itemType}-${item.id}`}
                  onClick={() => setLocation('/shop')}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    p: 1,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box
                    component="img"
                    src={imageUrl}
                    alt={item.name}
                    sx={{ width: 56, height: 56, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {item.name}
                    </Typography>
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      {formatPrice(parseFloat(item.price || '0'))}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
