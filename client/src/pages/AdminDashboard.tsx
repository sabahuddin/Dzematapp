import { Box, Typography, Card, CardContent, CircularProgress, Avatar, Grid, LinearProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { type Announcement, type Event, type Message, type WorkGroup, type Task } from '@shared/schema';
import { People, Groups, FamilyRestroom, Campaign, CalendarMonth, Receipt, Mail, Store, Assignment, GroupWork, AccessTime, TrendingUp } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { normalizeImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/contexts/CurrencyContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

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

interface MembershipFee {
  id: number;
  amount: string;
  paidAt: Date;
  userId: number;
}

interface PrayerTime {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: string;
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

  const { data: membershipFees = [] } = useQuery<MembershipFee[]>({
    queryKey: ['/api/membership-fees'],
  });

  const { data: workGroups = [] } = useQuery<WorkGroup[]>({
    queryKey: ['/api/work-groups'],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  const { data: todayPrayerTime } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
  });

  const latestAnnouncements = announcements.slice(0, 3);
  const upcomingEvents = events
    .filter(e => new Date(e.dateTime!) >= new Date())
    .sort((a, b) => new Date(a.dateTime!).getTime() - new Date(b.dateTime!).getTime())
    .slice(0, 3);

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').slice(0, 5);

  const formatDate = (dateString: Date | null | string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd.MM.yyyy');
  };

  const formatTime = (dateString: Date | null | string | undefined) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'HH:mm');
  };

  // Prepare membership fee chart data (last 6 months)
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

  const cardStyle = { borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

  const StatCard = ({ icon, label, value, color = 'primary' }: { icon: React.ReactNode; label: string; value: number | string; color?: string }) => (
    <Card sx={{ ...cardStyle, height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
        <Box sx={{ 
          bgcolor: `${color}.light`, 
          color: `${color}.main`,
          p: 1.5, 
          borderRadius: '8px',
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

      <Grid container spacing={2}>
        {/* Column 1: Statistics + Vaktija + Tasks */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <StatCard 
              icon={<People />} 
              label="Ukupno korisnika" 
              value={stats?.totalUsers || 0}
              color="primary"
            />
            <StatCard 
              icon={<Groups />} 
              label="Članovi" 
              value={stats?.members || 0}
              color="info"
            />
            <StatCard 
              icon={<FamilyRestroom />} 
              label="Članovi porodice" 
              value={stats?.familyMembers || 0}
              color="secondary"
            />

            {/* Vaktija - Prayer Times */}
            {todayPrayerTime && (
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AccessTime fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight={600}>Vaktija</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <Typography variant="caption">Sabah: <strong>{todayPrayerTime.fajr}</strong></Typography>
                    <Typography variant="caption">Izl. sunca: <strong>{todayPrayerTime.sunrise}</strong></Typography>
                    <Typography variant="caption">Podne: <strong>{todayPrayerTime.dhuhr}</strong></Typography>
                    <Typography variant="caption">Ikindija: <strong>{todayPrayerTime.asr}</strong></Typography>
                    <Typography variant="caption">Akšam: <strong>{todayPrayerTime.maghrib}</strong></Typography>
                    <Typography variant="caption">Jacija: <strong>{todayPrayerTime.isha}</strong></Typography>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Tasks */}
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assignment fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight={600}>Zadaci</Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setLocation('/tasks')}
                  >
                    Vidi sve
                  </Typography>
                </Box>
                {pendingTasks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nema aktivnih zadataka</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {pendingTasks.map((task) => (
                      <Box key={task.id} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: '6px' }}>
                        <Typography variant="body2" noWrap>{task.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {task.status === 'in_progress' ? 'U toku' : 'Na čekanju'}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Column 2: Announcements, Events, Work Groups */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Announcements with images */}
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 2 }}>
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
                {announcementsLoading ? (
                  <CircularProgress size={20} />
                ) : latestAnnouncements.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nema obavještenja</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {latestAnnouncements.map((ann) => {
                      const imageUrl = ann.photoUrl ? normalizeImageUrl(ann.photoUrl) : null;
                      return (
                        <Box 
                          key={ann.id}
                          onClick={() => setLocation(`/announcements`)}
                          sx={{ 
                            display: 'flex', 
                            gap: 2,
                            p: 1.5,
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
                              sx={{ width: 80, height: 60, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
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

            {/* Events with images */}
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarMonth fontSize="small" color="primary" />
                    <Typography variant="subtitle2" fontWeight={600}>Događaji</Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="primary" 
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => setLocation('/events')}
                  >
                    Vidi sve
                  </Typography>
                </Box>
                {eventsLoading ? (
                  <CircularProgress size={20} />
                ) : upcomingEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Nema nadolazećih događaja</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {upcomingEvents.map((event) => {
                      const imageUrl = event.photoUrl ? normalizeImageUrl(event.photoUrl) : null;
                      return (
                        <Box 
                          key={event.id}
                          onClick={() => setLocation(`/events`)}
                          sx={{ 
                            display: 'flex', 
                            gap: 2,
                            p: 1.5,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          {imageUrl && (
                            <Box
                              component="img"
                              src={imageUrl}
                              alt={event.name}
                              sx={{ width: 80, height: 60, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                            />
                          )}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{event.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(event.dateTime)} u {formatTime(event.dateTime)}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Work Groups (Sekcije) */}
            <Card sx={cardStyle}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupWork fontSize="small" color="primary" />
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
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {workGroups.slice(0, 6).map((wg) => (
                      <Box 
                        key={wg.id}
                        onClick={() => setLocation('/work-groups')}
                        sx={{ 
                          px: 2,
                          py: 1,
                          bgcolor: 'primary.light',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'primary.main', color: 'white' }
                        }}
                      >
                        <Typography variant="body2" fontWeight={500}>{wg.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Column 3: Membership Fees Chart, Messages, Shop */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Membership Fees Chart */}
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

            {/* Recent Messages */}
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

                {messagesLoading ? (
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

            {/* Recent Shop Items */}
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

                {shopLoading ? (
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
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
