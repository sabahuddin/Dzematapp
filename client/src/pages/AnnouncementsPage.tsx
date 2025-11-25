import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete
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
  const [showArchive, setShowArchive] = useState(false);

  // Fetch announcements
  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    retry: 1,
  });

  // Create announcement mutation
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

  // Update announcement mutation
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

  // Delete announcement mutation
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

  const getStatusChip = (status: string, isFeatured: boolean) => {
    if (isFeatured) {
      return <Chip label={t('announcements:featured')} color="info" size="small" />;
    }
    switch (status) {
      case 'published':
        return <Chip label={t('announcements:statuses.published')} color="success" size="small" />;
      case 'archived':
        return <Chip label={t('announcements:statuses.archived')} color="warning" size="small" />;
      default:
        return <Chip label={t('announcements:statuses.draft')} color="default" size="small" />;
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

  const predefinedCategories = [
    t('announcements:categories.predefined.dzemat'),
    t('announcements:categories.predefined.izbch'),
    t('announcements:categories.predefined.iz'),
    t('announcements:categories.predefined.other')
  ];
  
  const filteredAnnouncements = (announcementsQuery.data || []).filter((announcement: Announcement) => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategories.length === 0 || 
      (announcement.categories && announcement.categories.some(cat => selectedCategories.includes(cat)));
    const matchesArchive = showArchive ? announcement.status === 'archived' : announcement.status !== 'archived';
    return matchesSearch && matchesCategory && matchesArchive;
  });

  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    const dateA = new Date(a.publishDate || 0).getTime();
    const dateB = new Date(b.publishDate || 0).getTime();
    return dateB - dateA;
  });

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: 2,
      p: 2
    }}>
      {/* Header with Add Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('announcements:title')}
        </Typography>
        {user?.isAdmin && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateAnnouncement}
            data-testid="button-add-announcement"
            sx={{ backgroundColor: '#81c784' }}
          >
            {t('announcements:add')}
          </Button>
        )}
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
        <TextField
          placeholder={t('announcements:search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          data-testid="input-search-announcements"
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              border: '1px solid #e0e0e0'
            }
          }}
        />
        
        <Autocomplete
          multiple
          options={predefinedCategories}
          value={selectedCategories}
          onChange={(_, value) => setSelectedCategories(value)}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder={t('announcements:filterByCategory')}
              size="small"
              data-testid="input-filter-category"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0'
                }
              }}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant={showArchive ? 'contained' : 'outlined'}
            onClick={() => setShowArchive(!showArchive)}
            data-testid="button-toggle-archive"
            size="small"
          >
            {showArchive ? t('announcements:showingArchive') : t('announcements:showActive')}
          </Button>
        </Box>
      </Box>

      {/* Announcements Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>{t('announcements:title')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('announcements:category')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('announcements:date')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('announcements:status')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">{t('announcements:actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAnnouncements.map((announcement) => (
                <TableRow 
                  key={announcement.id}
                  hover
                  data-testid={`row-announcement-${announcement.id}`}
                >
                  <TableCell>{announcement.title}</TableCell>
                  <TableCell>{announcement.categories?.join(', ') || '-'}</TableCell>
                  <TableCell>{announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>{getStatusChip(announcement.status, announcement.isFeatured || false)}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewAnnouncement(announcement)}
                        data-testid={`button-view-announcement-${announcement.id}`}
                        title={t('announcements:view')}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {user?.isAdmin && (
                        <IconButton
                          size="small"
                          onClick={() => handleEditAnnouncement(announcement)}
                          data-testid={`button-edit-announcement-${announcement.id}`}
                          title={t('announcements:edit')}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      )}
                      {user?.isAdmin && (
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(announcement)}
                          sx={{ color: 'hsl(4 90% 58%)' }}
                          data-testid={`button-delete-announcement-${announcement.id}`}
                          title={t('announcements:delete')}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {sortedAnnouncements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      {t('announcements:noAnnouncements')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

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
      />
    </Box>
  );
}
