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
  Autocomplete,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  AttachFile,
  Image,
  PictureAsPdf,
  Close,
  Visibility
} from '@mui/icons-material';
import { Announcement, AnnouncementFileWithUser } from '@shared/schema';
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string>('');

  // Read deep link ID from URL
  const getDeepLinkAnnouncementId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  };

  // Fetch announcements
  const announcementsQuery = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    retry: 1,
  });

  // Handle deep linking - open announcement when data loads
  useEffect(() => {
    const deepLinkAnnouncementId = getDeepLinkAnnouncementId();
    if (deepLinkAnnouncementId && announcementsQuery.data && !modalOpen) {
      const announcement = announcementsQuery.data.find(a => a.id === deepLinkAnnouncementId);
      if (announcement) {
        setSelectedAnnouncement(announcement);
        setModalOpen(true);
        // Clear URL only AFTER modal opens
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [announcementsQuery.data, modalOpen]);

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

  // Add click handlers to announcement images for full-size view
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('[data-announcement-content]')) {
        const imgSrc = (target as HTMLImageElement).src;
        setSelectedImageSrc(imgSrc);
        setImageModalOpen(true);
      }
    };

    document.addEventListener('click', handleImageClick);
    return () => {
      document.removeEventListener('click', handleImageClick);
    };
  }, []);

  // File upload mutation
  const uploadFilesMutation = useMutation({
    mutationFn: async ({ announcementId, files }: { announcementId: string; files: File[] }) => {
      const uploadPromises = files.map(async (file) => {
        const fileType = getFileType(file.name);
        const response = await apiRequest(`/api/announcements/${announcementId}/files`, 'POST', {
          fileName: file.name,
          fileType,
          fileSize: file.size,
        });
        return response.json();
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: (data, { files }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ 
        title: t('common:common.success'), 
        description: t('announcements:messages.filesUploadSuccess', { count: files.length })
      });
    },
    onError: () => {
      toast({ 
        title: t('common:common.error'), 
        description: t('announcements:messages.filesUploadError'), 
        variant: 'destructive' 
      });
    }
  });

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      case 'pdf':
        return 'pdf';
      default:
        return 'document';
    }
  };

  const handleSaveAnnouncement = async (announcementData: any, selectedFiles: File[]) => {
    try {
      let announcementId: string;
      
      if (selectedAnnouncement) {
        // Update existing announcement
        const result = await new Promise<any>((resolve, reject) => {
          updateAnnouncementMutation.mutate(
            { id: selectedAnnouncement.id, ...announcementData },
            {
              onSuccess: resolve,
              onError: reject
            }
          );
        });
        announcementId = selectedAnnouncement.id;
      } else {
        // Create new announcement
        const result = await new Promise<any>((resolve, reject) => {
          createAnnouncementMutation.mutate(announcementData, {
            onSuccess: resolve,
            onError: reject
          });
        });
        announcementId = result.id;
      }
      
      // Upload files if any were selected
      if (selectedFiles.length > 0) {
        await uploadFilesMutation.mutateAsync({ announcementId, files: selectedFiles });
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
        return <Chip label={status} color="default" size="small" />;
    }
  };

  // Component to display attachment count for an announcement
  const AnnouncementAttachments = ({ announcementId }: { announcementId: string }) => {
    const attachmentsQuery = useQuery<AnnouncementFileWithUser[]>({
      queryKey: ['/api/announcements', announcementId, 'files'],
      retry: 1,
    });

    if (attachmentsQuery.isLoading) {
      return <CircularProgress size={16} />;
    }

    if (attachmentsQuery.error || !attachmentsQuery.data) {
      return <Typography variant="caption">-</Typography>;
    }

    const files = attachmentsQuery.data;
    if (files.length === 0) {
      return <Typography variant="caption">-</Typography>;
    }

    // Count file types
    const imageCount = files.filter((f) => f.fileType === 'image').length;
    const pdfCount = files.filter((f) => f.fileType === 'pdf').length;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {imageCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Image fontSize="small" color="primary" />
            <Typography variant="caption">{imageCount}</Typography>
          </Box>
        )}
        {pdfCount > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PictureAsPdf fontSize="small" color="error" />
            <Typography variant="caption">{pdfCount}</Typography>
          </Box>
        )}
        {files.length > imageCount + pdfCount && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AttachFile fontSize="small" />
            <Typography variant="caption">{files.length - imageCount - pdfCount}</Typography>
          </Box>
        )}
      </Box>
    );
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
  
  // Filter announcements
  const filteredAnnouncements = (announcementsQuery.data || []).filter((announcement: Announcement) => {
    const matchesSearch = searchTerm === '' || 
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategories.length === 0 ||
      (announcement.categories && announcement.categories.some(cat => selectedCategories.includes(cat)));
    
    return matchesSearch && matchesCategory;
  });

  // Sort announcements by date (newest first)
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    const dateA = a.publishDate ? new Date(a.publishDate).getTime() : 0;
    const dateB = b.publishDate ? new Date(b.publishDate).getTime() : 0;
    return dateB - dateA;
  });

  const latestAnnouncement = sortedAnnouncements.length > 0 ? sortedAnnouncements[0] : null;
  const archivedAnnouncements = sortedAnnouncements.slice(1);

  // Member View - Shows latest announcement with archive
  if (!user?.isAdmin) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {t('announcements:title')}
          </Typography>
        </Box>

        {/* Search and Filter */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            variant="outlined"
            placeholder={t('announcements:searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 350 }}
            data-testid="input-search"
          />
          <Autocomplete
            multiple
            options={predefinedCategories}
            value={selectedCategories}
            onChange={(event, newValue) => setSelectedCategories(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                placeholder={t('announcements:filterByCategories')}
                data-testid="input-category-filter"
              />
            )}
            sx={{ width: 350 }}
            data-testid="autocomplete-category-filter"
          />
        </Box>

        {/* Latest Announcement */}
        {latestAnnouncement ? (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {latestAnnouncement.title}
                </Typography>
                {latestAnnouncement.isFeatured && (
                  <Chip label={t('announcements:featured')} color="info" size="small" />
                )}
              </Box>
              
              {latestAnnouncement.categories && latestAnnouncement.categories.length > 0 && (
                <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {latestAnnouncement.categories.map((category, index) => (
                    <Chip key={index} label={category} size="small" variant="outlined" />
                  ))}
                </Box>
              )}
              
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                {latestAnnouncement.publishDate ? new Date(latestAnnouncement.publishDate).toLocaleDateString('hr-HR') : ''}
              </Typography>
              
              <Box 
                data-announcement-content
                sx={{ 
                  mt: 2,
                  '& img': {
                    maxWidth: '50%',
                    maxHeight: '400px',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    display: 'block',
                    margin: '12px 0',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s',
                    '&:hover': {
                      opacity: 0.85
                    }
                  }
                }}
                dangerouslySetInnerHTML={{ __html: latestAnnouncement.content }}
              />
              
              <Box sx={{ mt: 2 }}>
                <AnnouncementAttachments announcementId={latestAnnouncement.id} />
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Alert severity="info">{t('announcements:noPublishedAnnouncements')}</Alert>
        )}

        {/* Archive Button and List */}
        {archivedAnnouncements.length > 0 && (
          <Box>
            <Button 
              variant="outlined" 
              onClick={() => setShowArchive(!showArchive)}
              sx={{ mb: 2 }}
              data-testid="button-toggle-archive"
            >
              {showArchive ? t('announcements:hideArchive') : t('announcements:showArchive', { count: archivedAnnouncements.length })}
            </Button>
            
            {showArchive && (
              <Card>
                <List>
                  {archivedAnnouncements.map((announcement, index) => (
                    <React.Fragment key={announcement.id}>
                      <ListItem>
                        <ListItemButton onClick={() => setSelectedAnnouncement(announcement)}>
                          <ListItemText
                            primary={announcement.title}
                            secondary={
                              <Box>
                                <Typography variant="caption">
                                  {announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString('hr-HR') : ''}
                                </Typography>
                                {announcement.categories && announcement.categories.length > 0 && (
                                  <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {announcement.categories.map((cat, catIndex) => (
                                      <Chip key={catIndex} label={cat} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItemButton>
                      </ListItem>
                      {index < archivedAnnouncements.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Card>
            )}
          </Box>
        )}

        {/* Announcement Detail Dialog for Archive */}
        <Dialog
          open={selectedAnnouncement !== null && selectedAnnouncement.id !== latestAnnouncement?.id}
          onClose={() => setSelectedAnnouncement(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedAnnouncement && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Typography variant="h6">{selectedAnnouncement.title}</Typography>
                  <IconButton onClick={() => setSelectedAnnouncement(null)}>
                    <Close />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                {selectedAnnouncement.categories && selectedAnnouncement.categories.length > 0 && (
                  <Box sx={{ mb: 2, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {selectedAnnouncement.categories.map((category, index) => (
                      <Chip key={index} label={category} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  {selectedAnnouncement.publishDate ? new Date(selectedAnnouncement.publishDate).toLocaleDateString('hr-HR') : ''}
                </Typography>
                
                <Box 
                  data-announcement-content
                  sx={{
                    '& img': {
                      maxWidth: '50%',
                      maxHeight: '400px',
                      width: 'auto',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: '4px',
                      display: 'block',
                      margin: '12px 0',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                      '&:hover': {
                        opacity: 0.85
                      }
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                />
                
                <Box sx={{ mt: 2 }}>
                  <AnnouncementAttachments announcementId={selectedAnnouncement.id} />
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    );
  }

  // Admin View
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {t('announcements:manageAnnouncements')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateAnnouncement}
          data-testid="button-add-announcement"
        >
          {t('announcements:createAnnouncement')}
        </Button>
      </Box>

      {/* Search and Filter for Admin */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          variant="outlined"
          placeholder={t('announcements:searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: 350 }}
          data-testid="input-search-admin"
        />
        <Autocomplete
          multiple
          options={predefinedCategories}
          value={selectedCategories}
          onChange={(event, newValue) => setSelectedCategories(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              placeholder={t('announcements:filterByCategories')}
              data-testid="input-category-filter-admin"
            />
          )}
          sx={{ width: 350 }}
          data-testid="autocomplete-category-filter-admin"
        />
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('announcements:announcementTitle')}</TableCell>
                <TableCell>{t('announcements:categories.label')}</TableCell>
                <TableCell>{t('announcements:author')}</TableCell>
                <TableCell>{t('announcements:publishDate')}</TableCell>
                <TableCell>{t('announcements:status')}</TableCell>
                <TableCell>{t('announcements:attachments')}</TableCell>
                <TableCell>{t('announcements:actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedAnnouncements.map((announcement: Announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>{announcement.title}</TableCell>
                  <TableCell>
                    {announcement.categories && announcement.categories.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {announcement.categories.map((category, index) => (
                          <Chip key={index} label={category} size="small" variant="outlined" />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user?.firstName} {user?.lastName}
                  </TableCell>
                  <TableCell>
                    {announcement.publishDate ? new Date(announcement.publishDate).toLocaleDateString('hr-HR') : '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(announcement.status, announcement.isFeatured || false)}
                  </TableCell>
                  <TableCell>
                    <AnnouncementAttachments announcementId={announcement.id} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewAnnouncement(announcement)}
                        sx={{ color: 'hsl(207 88% 55%)' }}
                        data-testid={`button-view-announcement-${announcement.id}`}
                        title={t('announcements:view')}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEditAnnouncement(announcement)}
                        sx={{ color: 'hsl(14 100% 45%)' }}
                        data-testid={`button-edit-announcement-${announcement.id}`}
                        title={t('announcements:edit')}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(announcement)}
                        sx={{ color: 'hsl(4 90% 58%)' }}
                        data-testid={`button-delete-announcement-${announcement.id}`}
                        title={t('announcements:delete')}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {sortedAnnouncements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
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

      {/* Image Viewer Modal */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{t('common:common.image')}</Typography>
            <IconButton onClick={() => setImageModalOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedImageSrc && (
            <Box
              component="img"
              src={selectedImageSrc}
              alt="Full size"
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: '80vh',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
