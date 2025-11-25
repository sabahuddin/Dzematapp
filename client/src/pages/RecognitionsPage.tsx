import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
} from '@mui/material';
import {
  Card as ShadcnCard,
  CardContent as ShadcnCardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, Download, Eye, Calendar, TrendingUp } from "lucide-react";
import { EmojiEvents } from '@mui/icons-material';
import { format } from "date-fns";
import { useAuth } from '../hooks/useAuth';

interface UserCertificate {
  id: string;
  userId: string;
  templateId: string;
  recipientName: string;
  certificateImagePath: string;
  message: string | null;
  issuedById: string;
  issuedAt: Date | null;
  viewed: boolean | null;
}

interface ActivityLogEntry {
  id: string;
  activityType: string;
  description: string;
  points: number;
  createdAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`recognition-tabpanel-${index}`}
      aria-labelledby={`recognition-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function RecognitionsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [selectedCertificate, setSelectedCertificate] = useState<UserCertificate | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const { data: certificates = [], isLoading: certificatesLoading } = useQuery<UserCertificate[]>({
    queryKey: ['/api/certificates/user'],
  });

  const markViewedMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return apiRequest(`/api/certificates/${certificateId}/viewed`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/unviewed-count'] });
    },
  });

  const handleViewCertificate = (certificate: UserCertificate) => {
    setSelectedCertificate(certificate);
    setViewModalOpen(true);
    
    if (!certificate.viewed) {
      markViewedMutation.mutate(certificate.id);
    }
  };

  const handleDownload = (certificate: UserCertificate) => {
    const link = document.createElement('a');
    link.href = certificate.certificateImagePath;
    link.download = `zahvalnica-${certificate.recipientName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Preuzimanje",
      description: "Zahvalnica je preuzeta",
    });
  };

  const badgesQuery = useQuery({
    queryKey: ['/api/badges'],
  });

  const userBadgesQuery = useQuery({
    queryKey: ['/api/user-badges', user?.id],
    enabled: !!user?.id,
  });

  const activityLogQuery = useQuery({
    queryKey: ['/api/activity-logs/user', user?.id],
    enabled: !!user?.id,
  });

  const allBadges = (badgesQuery.data as any[]) || [];
  const userBadges = (userBadgesQuery.data as any[]) || [];
  const activityLogs = (activityLogQuery.data as any[]) || [];

  const earnedBadges = userBadges.map((ub: any) => {
    const badge = allBadges.find((b: any) => b.id === ub.badgeId);
    
    const earnedDate = new Date(ub.earnedAt);
    const logsBeforeEarning = activityLogs.filter((log: any) => 
      new Date(log.createdAt) <= earnedDate
    );
    const pointsAtEarning = logsBeforeEarning.reduce((sum: number, log: any) => 
      sum + (log.points || 0), 0
    );
    
    return {
      ...badge,
      earnedAt: ub.earnedAt,
      pointsAtEarning
    };
  }).filter(Boolean);

  const getBadgeColor = (criteriaType: string) => {
    switch (criteriaType) {
      case 'points_total': return { bg: 'var(--semantic-award-bg)', text: 'var(--semantic-award-text)', border: 'var(--semantic-award-border)' };
      case 'contributions_amount': return { bg: 'var(--semantic-success-bg)', text: 'var(--semantic-success-text)', border: 'var(--semantic-success-border)' };
      case 'tasks_completed': return { bg: 'var(--semantic-info-bg)', text: 'var(--semantic-info-text)', border: 'var(--semantic-info-border)' };
      case 'events_attended': return { bg: 'var(--semantic-celebration-bg)', text: 'var(--semantic-celebration-text)', border: 'var(--semantic-celebration-border)' };
      default: return { bg: 'hsl(0 0% 96%)', text: '#616161', border: 'hsl(0 0% 74%)' };
    }
  };

  const totalPoints = activityLogs?.reduce((sum: number, entry: any) => sum + (entry.points || 0), 0) || 0;

  const getActivityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'task_completed': 'Završen zadatak',
      'contribution_made': 'Finansijska uplata',
      'bonus_points': 'Bonus bodovi',
      'event_attendance': 'Prisustvo događaju',
      'project_contribution': 'Doprinos projektu',
    };
    return labels[type] || type;
  };

  const getActivityTypeColor = (type: string): "default" | "primary" | "secondary" | "success" | "warning" | "error" => {
    const colors: Record<string, "default" | "primary" | "secondary" | "success" | "warning" | "error"> = {
      'task_completed': 'primary',
      'contribution_made': 'success',
      'bonus_points': 'warning',
      'event_attendance': 'secondary',
      'project_contribution': 'success',
    };
    return colors[type] || 'default';
  };

  const filteredActivityLogs = (activityLogs || []).filter((activity: any) => {
    const matchesType = filterType === 'all' || activity.activityType === filterType;
    
    if (!matchesType) return false;
    if (!searchTerm) return true;
    
    const matchesSearch = 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const isLoading = certificatesLoading || badgesQuery.isLoading || userBadgesQuery.isLoading || activityLogQuery.isLoading;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Priznanja
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Vaše zahvale, značke i bodovi
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          data-testid="tabs-recognitions"
        >
          <Tab label="Moje aktivnosti" data-testid="tab-activities" />
          <Tab label="Moje zahvale" data-testid="tab-certificates" />
          <Tab label="Moje značke" data-testid="tab-badges" />
          <Tab label="Moji bodovi" data-testid="tab-points" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Typography sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.1)' }}>DEBUG: Aktivnosti Tab</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Pretraži aktivnosti..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            data-testid="input-search-activities"
          />
          <FormControl fullWidth>
            <InputLabel>Filtriraj po tipu</InputLabel>
            <Select
              value={filterType}
              label="Filtriraj po tipu"
              onChange={(e) => setFilterType(e.target.value)}
              data-testid="select-filter-activity-type"
            >
              <MenuItem value="all">Sve aktivnosti</MenuItem>
              <MenuItem value="task_completed">Završen zadatak</MenuItem>
              <MenuItem value="contribution_made">Finansijska uplata</MenuItem>
              <MenuItem value="bonus_points">Bonus bodovi</MenuItem>
              <MenuItem value="event_attendance">Prisustvo događaju</MenuItem>
              <MenuItem value="project_contribution">Doprinos projektu</MenuItem>
            </Select>
          </FormControl>
          
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Tip Aktivnosti</strong></TableCell>
                  <TableCell><strong>Opis</strong></TableCell>
                  <TableCell align="center"><strong>Bodovi</strong></TableCell>
                  <TableCell><strong>Datum</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivityLogs && filteredActivityLogs.length > 0 ? (
                  filteredActivityLogs
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((entry: any) => (
                      <TableRow key={entry.id} hover data-testid={`row-activity-${entry.id}`}>
                        <TableCell>
                          <Chip 
                            label={getActivityTypeLabel(entry.activityType)} 
                            color={getActivityTypeColor(entry.activityType)}
                            size="small"
                            data-testid={`chip-activity-type-${entry.id}`}
                          />
                        </TableCell>
                        <TableCell data-testid={`text-activity-description-${entry.id}`}>{entry.description}</TableCell>
                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 600, color: (entry.points || 0) > 0 ? 'hsl(122 60% 20%)' : 'inherit' }} data-testid={`text-activity-points-${entry.id}`}>
                            +{entry.points || 0}
                          </Typography>
                        </TableCell>
                        <TableCell data-testid={`text-activity-date-${entry.id}`}>
                          {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary" data-testid="text-no-activities">
                        Nema aktivnosti za prikaz
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ShadcnCard>
          <CardHeader>
            <CardTitle data-testid="text-page-title">Moje Zahvale</CardTitle>
            <CardDescription>
              Pregled svih primljenih zahvalnica
            </CardDescription>
          </CardHeader>
          <ShadcnCardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-12" data-testid="text-no-certificates">
                <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nema zahvalnica</h3>
                <p className="text-muted-foreground">
                  Još niste primili nijednu zahvalnicu
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((certificate) => (
                  <ShadcnCard
                    key={certificate.id}
                    className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                      !certificate.viewed ? 'border-primary' : ''
                    }`}
                    onClick={() => handleViewCertificate(certificate)}
                    data-testid={`card-certificate-${certificate.id}`}
                  >
                    <div className="relative">
                      {!certificate.viewed && (
                        <Badge
                          className="absolute top-2 right-2 z-10"
                          variant="default"
                          data-testid={`badge-new-${certificate.id}`}
                        >
                          Novo
                        </Badge>
                      )}
                      <img
                        src={certificate.certificateImagePath}
                        alt={`Zahvalnica za ${certificate.recipientName}`}
                        className="w-full h-48 object-cover"
                        data-testid={`img-certificate-${certificate.id}`}
                      />
                    </div>
                    <ShadcnCardContent className="p-4">
                      <h3
                        className="font-semibold mb-2"
                        data-testid={`text-recipient-${certificate.id}`}
                      >
                        {certificate.recipientName}
                      </h3>
                      {certificate.message && (
                        <p
                          className="text-sm text-muted-foreground mb-3 line-clamp-2"
                          data-testid={`text-message-${certificate.id}`}
                        >
                          {certificate.message}
                        </p>
                      )}
                      <div
                        className="flex items-center text-xs text-muted-foreground mb-3"
                        data-testid={`text-date-${certificate.id}`}
                      >
                        <Calendar className="mr-1 h-3 w-3" />
                        {certificate.issuedAt
                          ? format(new Date(certificate.issuedAt), 'dd.MM.yyyy')
                          : 'N/A'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCertificate(certificate);
                          }}
                          data-testid={`button-view-${certificate.id}`}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Pogledaj
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(certificate);
                          }}
                          data-testid={`button-download-${certificate.id}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </ShadcnCardContent>
                  </ShadcnCard>
                ))}
              </div>
            )}
          </ShadcnCardContent>
        </ShadcnCard>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              Moje značke
            </Typography>
            <Chip 
              icon={<EmojiEvents />}
              label={`${earnedBadges.length} ${earnedBadges.length === 1 ? 'značka' : 'značke/a'}`}
              color="primary"
              sx={{ fontWeight: 600 }}
              data-testid="chip-badges-count"
            />
          </Box>

          {earnedBadges.length === 0 ? (
            <Alert severity="info" data-testid="alert-no-badges">
              Još niste osvojili nijednu značku. Nastavite sa aktivnostima u džematu da zaradite značke!
            </Alert>
          ) : (
            <Stack spacing={2}>
              {earnedBadges.map((badge: any) => {
                const colors = getBadgeColor(badge.criteriaType);
                return (
                  <Card 
                    key={badge.id}
                    sx={{ 
                      bgcolor: colors.bg,
                      border: `2px solid ${colors.border}`,
                      boxShadow: 2
                    }}
                    data-testid={`card-badge-${badge.id}`}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                        <Box
                          sx={{
                            fontSize: '4rem',
                            lineHeight: 1,
                            minWidth: 80,
                            textAlign: 'center'
                          }}
                          data-testid={`icon-badge-${badge.id}`}
                        >
                          {badge.icon || '🏆'}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.text, mb: 1 }} data-testid={`text-badge-name-${badge.id}`}>
                            {badge.name}
                          </Typography>
                          <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }} data-testid={`text-badge-description-${badge.id}`}>
                            {badge.description}
                          </Typography>
                          <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                            <Chip
                              label={`Osvojeno: ${format(new Date(badge.earnedAt), 'dd.MM.yyyy HH:mm')}`}
                              size="small"
                              sx={{ fontWeight: 600 }}
                              data-testid={`chip-badge-earned-${badge.id}`}
                            />
                            <Chip
                              label={`Bodova tog dana: ${badge.pointsAtEarning.toLocaleString()}`}
                              size="small"
                              color="primary"
                              sx={{ fontWeight: 600 }}
                              data-testid={`chip-badge-points-${badge.id}`}
                            />
                            <Chip
                              label={`Kriterij: ${badge.criteriaValue.toLocaleString()}`}
                              size="small"
                              variant="outlined"
                              data-testid={`chip-badge-criteria-${badge.id}`}
                            />
                          </Stack>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ 
              width: 40, 
              height: 40, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'hsl(14 100% 45%)'
            }}>
              <TrendingUp size={32} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Vaši Bodovi
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Detaljan pregled svih bodova koje ste zaradili
              </Typography>
            </Box>
          </Box>

          <Card sx={{ mb: 3, p: 3, bgcolor: 'hsl(36 100% 94%)', borderLeft: '4px solid hsl(14 100% 45%)' }} data-testid="card-total-points">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                width: 48, 
                height: 48, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'hsl(14 100% 45%)'
              }}>
                <TrendingUp size={40} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'hsl(14 100% 45%)' }} data-testid="text-total-points">
                  {totalPoints}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Ukupno bodova
                </Typography>
              </Box>
            </Box>
          </Card>

          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Tip Aktivnosti</strong></TableCell>
                    <TableCell><strong>Opis</strong></TableCell>
                    <TableCell align="center"><strong>Bodovi</strong></TableCell>
                    <TableCell><strong>Datum</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activityLogs && activityLogs.length > 0 ? (
                    activityLogs
                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((entry: any) => (
                        <TableRow key={entry.id} hover data-testid={`row-activity-${entry.id}`}>
                          <TableCell>
                            <Chip 
                              label={getActivityTypeLabel(entry.activityType)} 
                              color={getActivityTypeColor(entry.activityType)}
                              size="small"
                              data-testid={`chip-activity-type-${entry.id}`}
                            />
                          </TableCell>
                          <TableCell data-testid={`text-activity-description-${entry.id}`}>{entry.description}</TableCell>
                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 600, color: (entry.points || 0) > 0 ? 'hsl(122 60% 20%)' : 'inherit' }} data-testid={`text-activity-points-${entry.id}`}>
                              +{entry.points || 0}
                            </Typography>
                          </TableCell>
                          <TableCell data-testid={`text-activity-date-${entry.id}`}>
                            {format(new Date(entry.createdAt), 'dd.MM.yyyy HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary" data-testid="text-no-activities">
                          Nema aktivnosti za prikaz
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      </TabPanel>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle data-testid="text-modal-title">
              Zahvalnica
            </DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <img
                src={selectedCertificate.certificateImagePath}
                alt={`Zahvalnica za ${selectedCertificate.recipientName}`}
                className="w-full h-auto rounded-lg border"
                data-testid="img-modal-certificate"
              />
              {selectedCertificate.message && (
                <div
                  className="p-4 bg-muted rounded-lg"
                  data-testid="text-modal-message"
                >
                  <p className="text-sm font-medium mb-1">Poruka:</p>
                  <p className="text-sm">{selectedCertificate.message}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewModalOpen(false)}
                  data-testid="button-modal-close"
                >
                  Zatvori
                </Button>
                <Button
                  onClick={() => handleDownload(selectedCertificate)}
                  data-testid="button-modal-download"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Preuzmi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
