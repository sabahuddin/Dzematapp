import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  Typography,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Stack
} from '@mui/material';
import {
  Timeline,
  CheckCircle,
  Person,
  Event,
  Campaign,
  AttachMoney,
  EmojiEvents,
  Work,
  ReceiptLong,
  BadgeOutlined,
  TrendingUp,
  Visibility
} from '@mui/icons-material';
import { ActivityLog, FinancialContribution, UserCertificate } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from '../contexts/CurrencyContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function MyActivitiesPage() {
  const { t } = useTranslation(['activity', 'common']);
  const { user: currentUser } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState(0);

  const activityLogsQuery = useQuery({
    queryKey: [`/api/activity-logs/user/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  const contributionsQuery = useQuery({
    queryKey: [`/api/financial-contributions/user/${currentUser?.id}`],
    enabled: !!currentUser?.id,
  });

  const badgesQuery = useQuery({ queryKey: ['/api/badges'], enabled: !!currentUser });
  const userBadgesQuery = useQuery({
    queryKey: ['/api/user-badges', currentUser?.id],
    enabled: !!currentUser?.id,
  });

  const certificatesQuery = useQuery({
    queryKey: ['/api/certificates/user'],
    enabled: !!currentUser?.id,
  });

  const activities = (activityLogsQuery.data as ActivityLog[]) || [];
  const contributions = (contributionsQuery.data as FinancialContribution[]) || [];
  const allBadges = (badgesQuery.data as any[]) || [];
  const userBadges = (userBadgesQuery.data as any[]) || [];
  const certificates = (certificatesQuery.data as UserCertificate[]) || [];

  const earnedBadges = userBadges.map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    return { ...badge, earnedAt: ub.earnedAt };
  }).filter(Boolean);

  const totalPoints = activities.reduce((sum, a) => sum + (a.points || 0), 0) + 
                     contributions.reduce((sum, c) => sum + (c.pointsValue || 0), 0);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed': return <CheckCircle />;
      case 'event_rsvp': return <Event />;
      case 'event_attendance': return <Event />;
      case 'announcement_read': return <Campaign />;
      case 'contribution_made': return <AttachMoney />;
      case 'badge_earned': return <EmojiEvents />;
      case 'profile_updated': return <Person />;
      case 'project_contribution': return <Work />;
      default: return <Timeline />;
    }
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, any> = {
      'task_completed': 'success',
      'event_rsvp': 'primary',
      'event_attendance': 'primary',
      'announcement_read': 'info',
      'contribution_made': 'success',
      'badge_earned': 'warning',
      'profile_updated': 'default',
      'project_contribution': 'secondary',
    };
    return colors[type] || 'default';
  };

  const getActivityLabel = (type: string) => {
    return t(`activityLabels.${type}`, { defaultValue: type });
  };

  const allItemsSorted = [
    ...activities.filter(a => a.activityType !== 'profile_updated').map(a => ({ type: 'activity' as const, data: a, date: new Date(a.createdAt) })),
    ...contributions.map(c => ({ type: 'contribution' as const, data: c, date: new Date(c.paymentDate || c.createdAt) })),
    ...earnedBadges.map(b => ({ type: 'badge' as const, data: b, date: new Date(b.earnedAt) })),
    ...certificates.map(c => ({ type: 'certificate' as const, data: c, date: new Date(c.issuedAt) })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const isLoading = activityLogsQuery.isLoading || contributionsQuery.isLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Timeline sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={600}>{t('myActivities')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('myActivitiesDescription')}
          </Typography>
        </Box>
      </Box>

      <Card sx={{ mb: 3, p: 2, bgcolor: 'hsl(36 100% 94%)', borderLeft: '4px solid hsl(14 100% 45%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TrendingUp sx={{ fontSize: 40, color: 'hsl(14 100% 45%)' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'hsl(14 100% 45%)' }}>
              {totalPoints} {t('summary.pointsSuffix')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('summary.badgesCount', { count: earnedBadges.length })} • {t('summary.paymentsCount', { count: contributions.length })} • {t('summary.certificatesCount', { count: certificates.length })}
            </Typography>
          </Box>
        </Box>
      </Card>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('tabs.all')} icon={<Timeline />} iconPosition="start" />
          <Tab label={t('tabs.payments')} icon={<AttachMoney />} iconPosition="start" />
          <Tab label={t('tabs.points')} icon={<EmojiEvents />} iconPosition="start" />
          <Tab label={t('tabs.badges')} icon={<BadgeOutlined />} iconPosition="start" />
          <Tab label={t('tabs.certificates')} icon={<ReceiptLong />} iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('tableHeaders.type')}</TableCell>
                  <TableCell>{t('tableHeaders.description')}</TableCell>
                  <TableCell>{t('tableHeaders.points')}</TableCell>
                  <TableCell>{t('tableHeaders.date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allItemsSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">{t('emptyStates.noActivities')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  allItemsSorted.slice(0, 50).map((item, idx) => {
                    if (item.type === 'activity') {
                      const activity = item.data as ActivityLog;
                      return (
                        <TableRow key={`activity-${activity.id}`}>
                          <TableCell>
                            <Chip 
                              icon={getActivityIcon(activity.activityType)} 
                              label={getActivityLabel(activity.activityType)} 
                              color={getActivityColor(activity.activityType) as any}
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{activity.description}</TableCell>
                          <TableCell>
                            {activity.points && activity.points > 0 ? (
                              <Chip icon={<EmojiEvents />} label={`+${activity.points}`} color="warning" size="small" />
                            ) : '-'}
                          </TableCell>
                          <TableCell>{item.date.toLocaleDateString('hr-HR')}</TableCell>
                        </TableRow>
                      );
                    } else if (item.type === 'contribution') {
                      const contrib = item.data as FinancialContribution;
                      return (
                        <TableRow key={`contrib-${contrib.id}`}>
                          <TableCell>
                            <Chip icon={<AttachMoney />} label={t('labels.payment')} color="success" size="small" />
                          </TableCell>
                          <TableCell>{contrib.purpose} - {formatPrice(contrib.amount)}</TableCell>
                          <TableCell>
                            {contrib.pointsValue && contrib.pointsValue > 0 ? (
                              <Chip icon={<EmojiEvents />} label={`+${contrib.pointsValue}`} color="warning" size="small" />
                            ) : '-'}
                          </TableCell>
                          <TableCell>{item.date.toLocaleDateString('hr-HR')}</TableCell>
                        </TableRow>
                      );
                    } else if (item.type === 'badge') {
                      const badge = item.data as any;
                      return (
                        <TableRow key={`badge-${badge.id}-${idx}`}>
                          <TableCell>
                            <Chip icon={<BadgeOutlined />} label={t('labels.badge')} color="warning" size="small" />
                          </TableCell>
                          <TableCell>{t('labels.earnedBadge', { name: badge.name })}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{item.date.toLocaleDateString('hr-HR')}</TableCell>
                        </TableRow>
                      );
                    } else {
                      const cert = item.data as UserCertificate;
                      return (
                        <TableRow key={`cert-${cert.id}`}>
                          <TableCell>
                            <Chip icon={<ReceiptLong />} label={t('labels.certificate')} color="info" size="small" />
                          </TableCell>
                          <TableCell>{cert.customMessage || t('labels.certificate')}</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>{item.date.toLocaleDateString('hr-HR')}</TableCell>
                        </TableRow>
                      );
                    }
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('tableHeaders.amount')}</TableCell>
                  <TableCell>{t('tableHeaders.purpose')}</TableCell>
                  <TableCell>{t('tableHeaders.points')}</TableCell>
                  <TableCell>{t('tableHeaders.date')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contributions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">{t('emptyStates.noPayments')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  contributions.map((contrib) => (
                    <TableRow key={contrib.id}>
                      <TableCell>
                        <Chip icon={<AttachMoney />} label={formatPrice(contrib.amount)} color="success" size="small" />
                      </TableCell>
                      <TableCell>{contrib.purpose}</TableCell>
                      <TableCell>
                        {contrib.pointsValue && contrib.pointsValue > 0 ? (
                          <Chip icon={<EmojiEvents />} label={`+${contrib.pointsValue}`} color="warning" size="small" />
                        ) : '-'}
                      </TableCell>
                      <TableCell>{contrib.paymentDate ? new Date(contrib.paymentDate).toLocaleDateString('hr-HR') : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <EmojiEvents sx={{ fontSize: 48, color: 'hsl(14 100% 45%)' }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: 'hsl(14 100% 45%)' }}>
                {totalPoints}
              </Typography>
              <Typography variant="body2" color="text.secondary">{t('summary.totalPoints')}</Typography>
            </Box>
          </Box>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
            {t('summary.pointsByActivity')}
          </Typography>
          
          <Stack spacing={1}>
            {activities.length === 0 ? (
              <Alert severity="info">{t('emptyStates.noPointsYet')}</Alert>
            ) : (
              <>
                {activities.filter(a => a.points && a.points > 0).map((activity) => (
                  <Box key={activity.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getActivityIcon(activity.activityType)}
                      <Typography variant="body2">{activity.description}</Typography>
                    </Box>
                    <Chip icon={<EmojiEvents />} label={`+${activity.points}`} color="warning" size="small" />
                  </Box>
                ))}
                {contributions.filter(c => c.pointsValue && c.pointsValue > 0).map((contrib) => (
                  <Box key={`contrib-${contrib.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney sx={{ fontSize: 20 }} />
                      <Typography variant="body2">{contrib.purpose} - {formatPrice(contrib.amount)}</Typography>
                    </Box>
                    <Chip icon={<EmojiEvents />} label={`+${contrib.pointsValue}`} color="warning" size="small" />
                  </Box>
                ))}
              </>
            )}
          </Stack>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Card sx={{ p: 3 }}>
          {earnedBadges.length === 0 ? (
            <Alert severity="info">{t('emptyStates.noBadgesYet')}</Alert>
          ) : (
            <Stack spacing={2}>
              {earnedBadges.map((badge: any, idx) => (
                <Box key={`${badge.id}-${idx}`} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                    <EmojiEvents sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{badge.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{badge.description}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('labels.earned')}: {new Date(badge.earnedAt).toLocaleDateString('hr-HR')}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <Card sx={{ p: 3 }}>
          {certificates.length === 0 ? (
            <Alert severity="info">{t('emptyStates.noCertificatesYet')}</Alert>
          ) : (
            <Stack spacing={2}>
              {certificates.map((cert: UserCertificate) => (
                <Box key={cert.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <ReceiptLong sx={{ fontSize: 32 }} />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{t('labels.certificate')}</Typography>
                    <Typography variant="body2" color="text.secondary">{cert.customMessage || t('labels.thankYouMessage')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('labels.issued')}: {new Date(cert.issuedAt).toLocaleDateString('hr-HR')}
                    </Typography>
                  </Box>
                  {cert.generatedPdfPath && (
                    <a href={cert.generatedPdfPath} target="_blank" rel="noopener noreferrer">
                      <Chip icon={<Visibility />} label={t('labels.view')} clickable color="primary" size="small" />
                    </a>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Card>
      </TabPanel>
    </Box>
  );
}
