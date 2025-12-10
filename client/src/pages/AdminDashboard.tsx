import { Box, Typography, Card, CardContent, CircularProgress, Chip, Avatar, Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type Announcement, type Event, type Message, type UserBadge, type UserCertificate } from '@shared/schema';
import { People, Groups, FamilyRestroom, Campaign, CalendarMonth, Receipt, EmojiEvents, WorkspacePremium, Mail, Store, ArrowForward } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface DashboardStats {
  totalUsers: number;
  members: number;
  familyMembers: number;
}

interface ShopItem {
  id: number;
  name: string;
  price: string;
  photos?: string[];
  itemType: 'product' | 'marketplace';
  createdAt?: Date;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation(['dashboard', 'common']);
  const { formatPrice } = useCurrency();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: announcements = [], isLoading: announcementsLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<(Message & { sender?: { firstName: string; lastName: string } })[]>({
    queryKey: ['/api/messages'],
  });

  const { data: shopItems = [], isLoading: shopLoading } = useQuery<ShopItem[]>({
    queryKey: ['/api/dashboard/recent-shop'],
  });

  const { data: badges = [] } = useQuery<UserBadge[]>({
    queryKey: ['/api/user-badges'],
  });

  const { data: certificates = [] } = useQuery<UserCertificate[]>({
    queryKey: ['/api/user-certificates'],
  });

  const latestAnnouncement = announcements[0];
  const nextEvent = events.find(e => new Date(e.dateTime!) >= new Date()) || events[0];

  const formatDate = (dateString: Date | null | string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const StatCard = ({ icon, label, value, color = 'primary' }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Box sx={{ 
          bgcolor: `${color}.light`, 
          color: `${color}.main`,
          p: 1.5, 
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
        <Box>
          <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const CompactCard = ({ title, subtitle, onClick, icon }: { title: string; subtitle?: string; onClick?: () => void; icon?: React.ReactNode }) => (
    <Card 
      onClick={onClick}
      sx={{ 
        height: '100%', 
        borderRadius: 3, 
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': onClick ? { boxShadow: '0 8px 12px -2px rgba(0,0,0,0.1)' } : {}
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {icon}
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        {subtitle && (
          <Typography variant="body1" fontWeight={600} sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  if (statsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        Admin Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Column 1: Statistics */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <StatCard 
              icon={<People />} 
              label="Ukupan broj korisnika" 
              value={stats?.totalUsers || 0}
              color="primary"
            />
            <StatCard 
              icon={<Groups />} 
              label="Broj članova" 
              value={stats?.members || 0}
              color="info"
            />
            <StatCard 
              icon={<FamilyRestroom />} 
              label="Broj članova porodice" 
              value={stats?.familyMembers || 0}
              color="secondary"
            />
          </Box>
        </Grid>

        {/* Column 2: Announcements, Events, Fees, Badges */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Row 1: Announcement + Event side by side */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <CompactCard 
                  title="Zadnja obavijest"
                  subtitle={latestAnnouncement?.title || 'Nema obavijesti'}
                  onClick={() => latestAnnouncement && setLocation(`/announcements?id=${latestAnnouncement.id}`)}
                  icon={<Campaign fontSize="small" color="primary" />}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <CompactCard 
                  title="Sljedeći događaj"
                  subtitle={nextEvent?.name || 'Nema događaja'}
                  onClick={() => nextEvent && setLocation(`/events?id=${nextEvent.id}`)}
                  icon={<CalendarMonth fontSize="small" color="primary" />}
                />
              </Box>
            </Box>

            {/* Row 2: Membership Fee Info */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Receipt fontSize="small" color="primary" />
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Uplata članarine
                  </Typography>
                </Box>
                <Box 
                  onClick={() => setLocation('/membership-fees')}
                  sx={{ 
                    cursor: 'pointer',
                    p: 1.5,
                    bgcolor: 'success.light',
                    borderRadius: 2,
                    '&:hover': { bgcolor: 'success.main', '& *': { color: 'white !important' } }
                  }}
                >
                  <Typography variant="body2" color="success.dark">
                    Upravljaj članarinama
                  </Typography>
                  <Typography variant="caption" color="success.dark">
                    Klikni za pregled svih uplata
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Row 3: Badges and Certificates */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Box 
                      onClick={() => setLocation('/badges')}
                      sx={{ 
                        cursor: 'pointer',
                        p: 1.5,
                        bgcolor: 'warning.light',
                        borderRadius: 2,
                        textAlign: 'center',
                        '&:hover': { bgcolor: 'warning.main' }
                      }}
                    >
                      <EmojiEvents sx={{ fontSize: 32, color: 'warning.dark', mb: 0.5 }} />
                      <Typography variant="body2" fontWeight={600} color="warning.dark">
                        Značke
                      </Typography>
                      <Typography variant="caption" color="warning.dark">
                        {badges.length} dodijeljeno
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box 
                      onClick={() => setLocation('/certificates')}
                      sx={{ 
                        cursor: 'pointer',
                        p: 1.5,
                        bgcolor: 'info.light',
                        borderRadius: 2,
                        textAlign: 'center',
                        '&:hover': { bgcolor: 'info.main' }
                      }}
                    >
                      <WorkspacePremium sx={{ fontSize: 32, color: 'info.dark', mb: 0.5 }} />
                      <Typography variant="body2" fontWeight={600} color="info.dark">
                        Zahvalnice
                      </Typography>
                      <Typography variant="caption" color="info.dark">
                        {certificates.length} izdato
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Column 3: Messages and Shop */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Recent Messages */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Mail fontSize="small" color="primary" />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Zadnje poruke
                    </Typography>
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

                {messagesLoading ? (
                  <CircularProgress size={20} />
                ) : messages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nema poruka</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {messages.slice(0, 3).map((message) => (
                      <Box 
                        key={message.id}
                        onClick={() => setLocation('/messages')}
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5,
                          p: 1,
                          borderRadius: 2,
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

            {/* Recent Shop Items */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Store fontSize="small" color="primary" />
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Zadnji oglasi iz shopa
                    </Typography>
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

                {shopLoading ? (
                  <CircularProgress size={20} />
                ) : shopItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nema oglasa</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {shopItems.slice(0, 3).map((item) => {
                      const imageUrl = item.photos?.[0] ? (normalizeImageUrl(item.photos[0]) || '/placeholder.png') : '/placeholder.png';
                      return (
                        <Box 
                          key={`${item.itemType}-${item.id}`}
                          onClick={() => setLocation('/shop')}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1.5,
                            p: 1,
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Box
                            component="img"
                            src={imageUrl}
                            alt={item.name}
                            sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover' }}
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
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
