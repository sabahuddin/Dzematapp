import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type Announcement } from '@shared/schema';
import { Campaign } from '@mui/icons-material';
import { format } from 'date-fns';
import { normalizeImageUrl } from '@/lib/imageUtils';

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%' };

interface AnnouncementsWidgetProps {
  size?: { w: number; h: number };
}

export default function AnnouncementsWidget({ size }: AnnouncementsWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  const itemCount = size?.h === 3 ? 4 : size?.h === 2 ? 3 : 2;
  const latestAnnouncements = announcements.slice(0, itemCount);

  const formatDate = (dateString: Date | null | string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Campaign fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Obavještenja</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/announcements')}
          >
            Vidi sve
          </Typography>
        </Box>
        {isLoading ? (
          <CircularProgress size={20} />
        ) : latestAnnouncements.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nema obavještenja</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, overflow: 'hidden' }}>
            {latestAnnouncements.map((ann) => {
              const imageUrl = ann.photoUrl ? normalizeImageUrl(ann.photoUrl) : null;
              return (
                <Box 
                  key={ann.id}
                  onClick={() => setLocation(`/announcements`)}
                  sx={{ 
                    display: 'flex', 
                    gap: 2,
                    p: 1,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  {imageUrl && (
                    <Box
                      component="img"
                      src={imageUrl}
                      alt={ann.title}
                      sx={{ width: 60, height: 45, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{ann.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(ann.publishDate)}
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
