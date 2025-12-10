import { Box, Typography, Card, CardContent, CircularProgress, Avatar } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type Message } from '@shared/schema';
import { Mail } from '@mui/icons-material';

const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

export default function MessagesWidget() {
  const [, setLocation] = useLocation();

  const { data: messages = [], isLoading } = useQuery<(Message & { sender?: { firstName: string; lastName: string } })[]>({
    queryKey: ['/api/messages'],
  });

  return (
    <Card sx={cardStyle}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Mail fontSize="small" color="primary" />
            <Typography variant="subtitle2" fontWeight={600}>Zadnje poruke</Typography>
          </Box>
          <Typography 
            variant="caption" 
            color="primary" 
            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            onClick={() => setLocation('/messages')}
          >
            Vidi sve
          </Typography>
        </Box>

        {isLoading ? (
          <CircularProgress size={20} />
        ) : messages.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nema poruka</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {messages.slice(0, 5).map((message) => (
              <Box 
                key={message.id}
                onClick={() => setLocation('/messages')}
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  p: 1,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main' }}>
                  {message.sender?.firstName?.charAt(0) || 'P'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={message.isRead ? 400 : 600} noWrap>
                    {message.subject || 'Poruka'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {message.sender?.firstName} {message.sender?.lastName}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
