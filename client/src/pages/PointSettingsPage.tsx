import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Button,
  Card,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  CardContent,
  Divider,
  Stack
} from '@mui/material';
import {
  Save,
  EmojiEvents
} from '@mui/icons-material';
import { PointsSettings, insertPointsSettingsSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';

export default function PointSettingsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Check admin access
  if (!currentUser?.isAdmin) {
    return (
      <Alert severity="error">
        Nemate dozvolu za pristup ovoj stranici.
      </Alert>
    );
  }

  // Fetch point settings (single row)
  const pointSettingsQuery = useQuery({
    queryKey: ['/api/point-settings'],
  });

  // Form schema
  const formSchema = insertPointsSettingsSchema.extend({
    pointsPerChf: z.number().min(0, 'Bodovi moraju biti pozitivni'),
    pointsPerTask: z.number().min(0, 'Bodovi moraju biti pozitivni'),
    pointsPerEvent: z.number().min(0, 'Bodovi moraju biti pozitivni'),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pointsPerChf: 0,
      pointsPerTask: 0,
      pointsPerEvent: 0,
    }
  });

  // Update form when data is loaded
  useEffect(() => {
    if (pointSettingsQuery.data && !form.formState.isDirty) {
      const settings = pointSettingsQuery.data as PointsSettings;
      form.reset({
        pointsPerChf: settings.pointsPerChf,
        pointsPerTask: settings.pointsPerTask,
        pointsPerEvent: settings.pointsPerEvent,
      });
    }
  }, [pointSettingsQuery.data, form]);

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const settings = pointSettingsQuery.data as PointsSettings | undefined;
      if (!settings || !settings.id) {
        throw new Error('Postavke bodova nisu učitane');
      }
      return await apiRequest(`/api/point-settings/${settings.id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/point-settings'] });
      toast({ title: 'Uspjeh', description: 'Postavke bodova su ažurirane' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri spremanju postavki', variant: 'destructive' });
    }
  });

  const handleSubmit = form.handleSubmit((data) => {
    updateSettingsMutation.mutate(data);
  });

  if (pointSettingsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (pointSettingsQuery.error) {
    return (
      <Alert severity="error">
        Greška pri učitavanju postavki bodova. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Postavke Bodova
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <EmojiEvents color="warning" fontSize="large" />
            <Box>
              <Typography variant="h6">
                Konfiguracija Sistema Bodova
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Definirajte koliko bodova članovi zarađuju za različite aktivnosti
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label="Bodovi po CHF donaciji"
                    type="number"
                    {...form.register('pointsPerChf', { valueAsNumber: true })}
                    error={!!form.formState.errors.pointsPerChf}
                    helperText={form.formState.errors.pointsPerChf?.message || 'Broj bodova koji član dobija za svaki CHF doniran'}
                    required
                    data-testid="input-points-per-chf"
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label="Bodovi po završenom zadatku"
                    type="number"
                    {...form.register('pointsPerTask', { valueAsNumber: true })}
                    error={!!form.formState.errors.pointsPerTask}
                    helperText={form.formState.errors.pointsPerTask?.message || 'Broj bodova koji član dobija za svaki završen zadatak'}
                    required
                    data-testid="input-points-per-task"
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label="Bodovi po RSVP događaju"
                    type="number"
                    {...form.register('pointsPerEvent', { valueAsNumber: true })}
                    error={!!form.formState.errors.pointsPerEvent}
                    helperText={form.formState.errors.pointsPerEvent?.message || 'Broj bodova koji član dobija za svaki potvr jedinožen prisustvo na događaju'}
                    required
                    data-testid="input-points-per-event"
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={updateSettingsMutation.isPending || pointSettingsQuery.isLoading || !pointSettingsQuery.data}
                  data-testid="button-save"
                >
                  {updateSettingsMutation.isPending ? 'Spremanje...' : 'Spremi Postavke'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
