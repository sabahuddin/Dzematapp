import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type WorkGroup } from '@shared/schema';
import { Groups } from '@mui/icons-material';

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%' };

interface WorkGroupsWidgetProps {
  size?: { w: number; h: number };
}

export default function WorkGroupsWidget({ size }: WorkGroupsWidgetProps) {
  const [, setLocation] = useLocation();

  const { data: workGroups = [] } = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
  });

  const isCompact = size?.w === 1 && size?.h === 1;
  const displayCount = size?.h === 2 ? 6 : size?.w === 2 ? 4 : 2;

  if (isCompact) {
    return (
      <Card sx={cardStyle} onClick={() => setLocation('/work-groups')} style={{ cursor: 'pointer' }}>
        <CardContent sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Groups sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
          <Typography variant="h5" fontWeight="bold">{workGroups.length}</Typography>
          <Typography variant="caption" color="text.secondary">Sekcija</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Groups fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Sekcije</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/work-groups')}
          >
            Vidi sve
          </Typography>
        </Box>
        {workGroups.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nema sekcija</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
            {workGroups.slice(0, displayCount).map((wg) => (
              <Chip
                key={wg.id}
                label={wg.name}
                size="small"
                onClick={() => setLocation('/work-groups')}
                sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'primary.dark',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'primary.main', color: 'white' }
                }}
              />
            ))}
            {workGroups.length > displayCount && (
              <Chip
                label={`+${workGroups.length - displayCount}`}
                size="small"
                variant="outlined"
                onClick={() => setLocation('/work-groups')}
                sx={{ cursor: 'pointer' }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
