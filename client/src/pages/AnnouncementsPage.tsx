import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Chip,
  Stack
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import { Announcement } from '@shared/schema';
import AnnouncementModal from '../components/modals/AnnouncementModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { useMarkAsViewed } from '../hooks/useMarkAsViewed';
import { apiRequest } from '../lib/queryClient';
import { normalizeImageUrl } from '@/lib/imageUtils';

const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '')
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
};

export default function AnnouncementsPage() {
  const { t } = useTranslation(['announcements', 'common']);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  useMarkAsViewed('announcements');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    retry: 1,
  });

  // Deep linking - open specific announcement when ?id= is in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const announcementId = params.get('id');
    if (announcementId && announcementsQuery.data && !modalOpen) {
      const announcement = announcementsQuery.data.find(a => a.id === announcementId);
      if (announcement) {
        setSelectedAnnouncement(announcement);
        setModalOpen(true);
        // Clear URL after opening modal
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [announcementsQuery.data, modalOpen]);

  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      const response = await apiRequest('/api/announcements', 'POST', announcementData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: t('common:common.success'), description: t('announcements:messages.createSuccess') });
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('announcements:messages.createError'), variant: 'destructive' });
    }
  });

  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, ...announcementData }: any) => {
      const response = await apiRequest(`/api/announcements/${id}`, 'PUT', announcementData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: t('common:common.success'), description: t('announcements:messages.updateSuccess') });
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('announcements:messages.updateError'), variant: 'destructive' });
    }
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/announcements/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: t('common:common.success'), description: t('announcements:messages.deleteSuccess') });
    },
    onError: () => {
      toast({ title: t('common:common.error'), description: t('announcements:messages.deleteError'), variant: 'destructive' });
    }
  });

  const handleCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    setModalOpen(true);
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (announcementToDelete) {
      deleteAnnouncementMutation.mutate(announcementToDelete.id);
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleSaveAnnouncement = async (announcementData: any) => {
    try {
      if (selectedAnnouncement) {
        updateAnnouncementMutation.mutate({ id: selectedAnnouncement.id, ...announcementData });
      } else {
        createAnnouncementMutation.mutate(announcementData);
      }
      setModalOpen(false);
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return '#26A69A';
      case 'archived':
        return '#ff9800';
      default:
        return '#90a4ae';
    }
  };

  if (announcementsQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (announcementsQuery.error) {
    return (
      <Alert severity="error">
        {t('announcements:loadingError')}
      </Alert>
    );
  }

  const predefinedCategories: string[] = [];
  
  const filteredAnnouncements = (announcementsQuery.data || []).filter((announcement: Announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      (announcement.categories && announcement.categories.some(cat => selectedCategories.includes(cat)));
    return matchesSearch && matchesCategory && announcement.status !== 'archived';
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    const dateA = new Date(a.publishDate || 0).getTime();
    const dateB = new Date(b.publishDate || 0).getTime();
    return dateB - dateA;
  });

  return (
    <Box>
      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('announcements:title')}
        </Typography>
        {user?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateAnnouncement}
            data-testid="button-add-announcement"
          >
            {t('announcements:addAnnouncement')}
          </Button>
        )}
      </Box>

      {/* Search and Filter Card */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label={t('announcements:searchPlaceholder')}
            placeholder={t('announcements:searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            data-testid="input-search-announcements"
          />
          
          <Autocomplete
            multiple
            freeSolo
            options={predefinedCategories}
            value={selectedCategories}
            onChange={(_, value) => setSelectedCategories(value as string[])}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('announcements:filterByCategories')}
                InputLabelProps={{ shrink: true }}
                data-testid="input-filter-category"
              />
            )}
          />
        </Box>
      </Card>

      {/* Announcements Cards - Grid Layout */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)'
        },
        gap: 2
      }}>
        {sortedAnnouncements.map((announcement) => (
          <Card
            key={announcement.id}
            data-testid={`card-announcement-${announcement.id}`}
            onClick={() => window.location.href = `/announcements?id=${announcement.id}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: '100%',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(57, 73, 171, 0.12)',
                borderColor: '#3949AB'
              }
            }}
          >
            {/* Photo or Logo Placeholder */}
            {(() => {
              const imageUrl = normalizeImageUrl(announcement.photoUrl);
              return (
                <Box
                  sx={{
                    width: '100%',
                    height: '200px',
                    backgroundImage: `url(${imageUrl || '/placeholder.png'})`,
                    backgroundSize: imageUrl ? 'cover' : 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: imageUrl ? 'transparent' : '#f5f5f5',
                    borderRadius: '12px 12px 0 0'
                  }}
                />
              );
            })()}
            <CardContent sx={{ p: 2, flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#0D1B2A',
                      mb: 0.5
                    }}
                  >
                    {announcement.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#424242',
                      mb: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {stripHtmlTags(announcement.content)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    {announcement.categories && announcement.categories.map((cat) => (
                      <Chip
                        key={cat}
                        label={cat}
                        size="small"
                        sx={{
                          backgroundColor: '#e8eaf6',
                          color: '#0D1B2A',
                          fontWeight: 500,
                          borderRadius: '8px'
                        }}
                      />
                    ))}
                    <Typography variant="caption" sx={{ color: '#757575', ml: 'auto' }}>
                      {announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString('de-DE') : '-'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, justifyContent: 'flex-end' }}>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleViewAnnouncement(announcement); }}
                  data-testid={`button-view-announcement-${announcement.id}`}
                  title={t('announcements:view')}
                  sx={{ color: '#1E88E5' }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
                {user?.isAdmin && (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleEditAnnouncement(announcement); }}
                    data-testid={`button-edit-announcement-${announcement.id}`}
                    title={t('announcements:edit')}
                    sx={{ color: '#ff9800' }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                )}
                {user?.isAdmin && (
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(announcement); }}
                    data-testid={`button-delete-announcement-${announcement.id}`}
                    title={t('announcements:delete')}
                    sx={{ color: '#f44336' }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}

        {sortedAnnouncements.length === 0 && (
          <Card
            sx={{
              border: '1px solid #e8eaf6',
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              p: 4,
              textAlign: 'center',
              gridColumn: { xs: '1', sm: '1 / -1', md: '1 / -1' }
            }}
          >
            <Typography color="text.secondary">
              {t('announcements:noAnnouncements')}
            </Typography>
          </Card>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>{t('announcements:confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('announcements:confirmDeleteMessage', { title: announcementToDelete?.title || '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
            {t('announcements:cancel')}
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            data-testid="button-confirm-delete"
          >
            {t('announcements:delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Announcement Modal */}
      <AnnouncementModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveAnnouncement}
        announcement={selectedAnnouncement}
        authorId={user?.id || ''}
        isReadOnly={selectedAnnouncement !== null && !user?.isAdmin}
      />
    </Box>
  );
}
