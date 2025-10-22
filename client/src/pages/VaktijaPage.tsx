import { useState, type SyntheticEvent } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { Upload, Schedule, ExpandMore } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { PrayerTime } from '@shared/schema';

export default function VaktijaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | false>(false);

  const { data: todayPrayerTime, isLoading: todayLoading } = useQuery<PrayerTime>({
    queryKey: ['/api/prayer-times/today'],
    retry: false,
  });

  const { data: allPrayerTimes, isLoading: allLoading } = useQuery<PrayerTime[]>({
    queryKey: ['/api/prayer-times'],
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csv', file);
      
      const res = await fetch('/api/prayer-times/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload CSV');
      }

      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-times'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-times/today'] });
      toast({
        title: 'Uspjeh',
        description: data.message || 'Vaktije su uspješno učitane',
      });
      setUploadDialogOpen(false);
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Greška',
        description: error.message || 'Greška pri učitavanju CSV fajla',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest('/api/prayer-times', 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-times'] });
      queryClient.invalidateQueries({ queryKey: ['/api/prayer-times/today'] });
      toast({
        title: 'Uspjeh',
        description: 'Sve vaktije su obrisane',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Greška',
        description: error.message || 'Greška pri brisanju vaktija',
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm('Da li ste sigurni da želite obrisati sve vaktije?')) {
      deleteMutation.mutate();
    }
  };

  const prayerTimeNames = {
    fajr: 'Zora',
    sunrise: 'Izlazak sunca',
    dhuhr: 'Podne',
    asr: 'Ikindija',
    maghrib: 'Akšam',
    isha: 'Jacija',
  };

  const handleAccordionChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
    setExpandedMonth(isExpanded ? panel : false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Schedule /> Vaktija
        </Typography>
        {user?.isAdmin && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteAll}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-all-prayer-times"
            >
              Obriši sve
            </Button>
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={() => setUploadDialogOpen(true)}
              data-testid="button-upload-csv"
            >
              Učitaj CSV
            </Button>
          </Box>
        )}
      </Box>

      {/* Today's Prayer Times */}
      {todayLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : todayPrayerTime ? (
        <Paper sx={{ p: 3, mb: 4, bgcolor: '#e3f2fd' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
            Današnja vaktija - {todayPrayerTime.date}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 150px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Zora
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {todayPrayerTime.fajr}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            {todayPrayerTime.sunrise && (
              <Box sx={{ flex: '1 1 150px' }}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Izlazak
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {todayPrayerTime.sunrise}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            )}
            <Box sx={{ flex: '1 1 150px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Podne
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {todayPrayerTime.dhuhr}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Ikindija
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {todayPrayerTime.asr}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Akšam
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {todayPrayerTime.maghrib}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Box sx={{ flex: '1 1 150px' }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Jacija
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {todayPrayerTime.isha}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mb: 4 }}>
          Nema podataka o vaktijama za danas.
        </Alert>
      )}

      {/* Monthly Prayer Times Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Mjesečne vaktije
        </Typography>
        {allLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : allPrayerTimes && allPrayerTimes.length > 0 ? (
          (() => {
            // Group prayer times by month
            const monthGroups: { [key: string]: PrayerTime[] } = {};
            allPrayerTimes.forEach((pt) => {
              // Parse date (format dd.mm.yyyy)
              const parts = pt.date.split('.');
              if (parts.length === 3) {
                const monthYear = `${parts[1]}.${parts[2]}`; // mm.yyyy
                if (!monthGroups[monthYear]) {
                  monthGroups[monthYear] = [];
                }
                monthGroups[monthYear].push(pt);
              }
            });

            // Sort month groups by date
            const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
              const [monthA, yearA] = a.split('.');
              const [monthB, yearB] = b.split('.');
              const dateA = new Date(parseInt(yearA), parseInt(monthA) - 1);
              const dateB = new Date(parseInt(yearB), parseInt(monthB) - 1);
              return dateA.getTime() - dateB.getTime();
            });

            const monthNames = [
              'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Juni',
              'Juli', 'August', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
            ];

            return sortedMonthKeys.map((monthYear) => {
              const [month, year] = monthYear.split('.');
              const monthName = monthNames[parseInt(month) - 1];
              const prayerTimes = monthGroups[monthYear];

              return (
                <Accordion
                  key={monthYear}
                  expanded={expandedMonth === monthYear}
                  onChange={handleAccordionChange(monthYear)}
                  sx={{ mb: 1 }}
                  data-testid={`accordion-month-${monthYear}`}
                >
                  <AccordionSummary 
                    expandIcon={<ExpandMore />}
                    sx={{ bgcolor: '#f5f5f5' }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1976d2' }}>
                      {monthName} {year}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#fafafa' }}>
                            <TableCell sx={{ fontWeight: 600 }}>Datum</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Zora</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Izlazak</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Podne</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Ikindija</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Akšam</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Jacija</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {prayerTimes.map((pt) => (
                            <TableRow key={pt.id} data-testid={`row-prayer-time-${pt.date}`}>
                              <TableCell>{pt.date}</TableCell>
                              <TableCell>{pt.fajr}</TableCell>
                              <TableCell>{pt.sunrise || '-'}</TableCell>
                              <TableCell>{pt.dhuhr}</TableCell>
                              <TableCell>{pt.asr}</TableCell>
                              <TableCell>{pt.maghrib}</TableCell>
                              <TableCell>{pt.isha}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              );
            });
          })()
        ) : (
          <Alert severity="info">
            Nema učitanih vaktija. {user?.isAdmin && 'Učitajte CSV fajl sa vaktijama.'}
          </Alert>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Učitaj vaktije iz CSV fajla</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              CSV fajl mora sadržavati kolone: Datum, Dan, Zora, Izlazak sunca, Podne, Ikindija, Akšam, Jacija
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Format datuma: dd.mm.yyyy (npr. 21.10.2025)
            </Typography>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'block', marginTop: 16 }}
              data-testid="input-csv-file"
            />
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 2 }}>
                Odabrani fajl: {selectedFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} data-testid="button-cancel-upload">
            Otkaži
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || uploadMutation.isPending}
            data-testid="button-confirm-upload"
          >
            {uploadMutation.isPending ? 'Učitavam...' : 'Učitaj'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
