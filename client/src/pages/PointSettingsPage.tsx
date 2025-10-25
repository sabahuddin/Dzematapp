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
import { useTranslation } from 'react-i18next';
import { PointsSettings, insertPointsSettingsSchema } from '@shared/schema';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest, queryClient } from '../lib/queryClient';

export default function PointSettingsPage() {
  const { t } = useTranslation('settings');
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  // Check admin access
  if (!currentUser?.isAdmin) {
    return (
      <Alert severity="error">
        {t('points.noPermission')}
      </Alert>
    );
  }

  // Fetch point settings (single row)
  const pointSettingsQuery = useQuery({
    queryKey: ['/api/point-settings'],
  });

  // Form schema
  const formSchema = insertPointsSettingsSchema.extend({
    pointsPerChf: z.number().min(0, t('points.toast.error')),
    pointsPerTask: z.number().min(0, t('points.toast.error')),
    pointsPerEvent: z.number().min(0, t('points.toast.error')),
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
        throw new Error(t('points.toast.loadError'));
      }
      return await apiRequest(`/api/point-settings/${settings.id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/point-settings'] });
      toast({ title: t('points.toast.success'), description: t('points.toast.successDescription') });
    },
    onError: () => {
      toast({ title: t('points.toast.error'), description: t('points.toast.errorDescription'), variant: 'destructive' });
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
        {t('points.toast.loadError')}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('points.title')}
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <EmojiEvents color="warning" fontSize="large" />
            <Box>
              <Typography variant="h6">
                {t('points.configTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('points.configDescription')}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Points Explanation Section */}
          <Box sx={{ mb: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Kako se Bodovi Dodjeljuju
            </Typography>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  1. Finansijske Uplate (Članarine, Donacije)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bodovi se dodjeljuju prema iznosu uplate. Svaki uloženi CHF donosi određeni broj bodova (definirano u "Bodova po CHF" polju ispod). Primjer: Ako je postavljeno 1 bod po CHF, uplata od 50 CHF = 50 bodova.
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  2. Završeni Zadaci (Sekcije)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Varijabilni Bodovi:</strong> Admin ili moderator može dodijeliti različite vrijednosti bodova za svaki zadatak (10, 20, 30, ili 50 bodova) ovisno o težini i trajanju zadatka. Bodovi se dodjeljuju kada član završi zadatak i admin ga odobri.
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  3. Prisustvo na Događajima (RSVP)
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Varijabilni Bodovi:</strong> Admin može dodijeliti različite vrijednosti bodova za svaki događaj (10, 20, 30, ili 50 bodova) ovisno o važnosti događaja. Bodovi se dodjeljuju automatski nakon što član potvrdi prisustvo (RSVP) i događaj se završi.
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  4. Doprinosi Projektima
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Kada član uplati novac za specifičan projekat, dodjeljuju se bodovi prema "Bodova po CHF" postavci, plus se aktivnost bilježi kao doprinos projektu u Activity Log-u.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label={t('points.fields.pointsPerChf')}
                    type="number"
                    {...form.register('pointsPerChf', { valueAsNumber: true })}
                    error={!!form.formState.errors.pointsPerChf}
                    helperText={form.formState.errors.pointsPerChf?.message || t('points.fields.pointsPerChfHelper')}
                    required
                    data-testid="input-points-per-chf"
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label={t('points.fields.pointsPerTask')}
                    type="number"
                    {...form.register('pointsPerTask', { valueAsNumber: true })}
                    error={!!form.formState.errors.pointsPerTask}
                    helperText={form.formState.errors.pointsPerTask?.message || t('points.fields.pointsPerTaskHelper')}
                    required
                    data-testid="input-points-per-task"
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField
                    fullWidth
                    label={t('points.fields.pointsPerEvent')}
                    type="number"
                    {...form.register('pointsPerEvent', { valueAsNumber: true })}
                    error={!!form.formState.errors.pointsPerEvent}
                    helperText={form.formState.errors.pointsPerEvent?.message || t('points.fields.pointsPerEventHelper')}
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
                  {t('points.save')}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
