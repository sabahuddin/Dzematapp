import { useState } from 'react';
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
} from '@mui/material';
import { Upload, Schedule } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { PrayerTime } from '@shared/schema';

export default function VaktijaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      return apiRequest('POST', '/api/prayer-times/upload', formData);
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
    mutationFn: () => apiRequest('DELETE', '/api/prayer-times'),
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
            Današnje vaktije - {todayPrayerTime.date}
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

      {/* All Prayer Times Table */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Kalendar vaktija
        </Typography>
        {allLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : allPrayerTimes && allPrayerTimes.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
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
                {allPrayerTimes.map((pt) => (
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
