import React, { useState } from 'react';
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
  Menu,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete
} from '@mui/icons-material';
import { Announcement } from '@shared/schema';
import AnnouncementModal from '../components/modals/AnnouncementModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/use-toast';
import { apiRequest } from '../lib/queryClient';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuAnnouncement, setMenuAnnouncement] = useState<Announcement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // Fetch announcements
  const announcementsQuery = useQuery({
    queryKey: ['/api/announcements'],
    retry: 1,
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (announcementData: any) => {
      const response = await apiRequest('POST', '/api/announcements', announcementData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: 'Uspjeh', description: 'Obavijest je uspješno kreirana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri kreiranju obavijesti', variant: 'destructive' });
    }
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, ...announcementData }: any) => {
      const response = await apiRequest('PUT', `/api/announcements/${id}`, announcementData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: 'Uspjeh', description: 'Obavijest je uspješno ažurirana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri ažuriranju obavijesti', variant: 'destructive' });
    }
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({ title: 'Uspjeh', description: 'Obavijest je uspješno obrisana' });
    },
    onError: () => {
      toast({ title: 'Greška', description: 'Greška pri brisanju obavijesti', variant: 'destructive' });
    }
  });

  const handleCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    setModalOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setModalOpen(true);
    handleMenuClose();
  };

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (announcementToDelete) {
      deleteAnnouncementMutation.mutate(announcementToDelete.id);
      setDeleteDialogOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const handleSaveAnnouncement = (announcementData: any) => {
    if (selectedAnnouncement) {
      updateAnnouncementMutation.mutate({ id: selectedAnnouncement.id, ...announcementData });
    } else {
      createAnnouncementMutation.mutate(announcementData);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, announcement: Announcement) => {
    setMenuAnchor(event.currentTarget);
    setMenuAnnouncement(announcement);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuAnnouncement(null);
  };

  const getStatusChip = (status: string, isFeatured: boolean) => {
    if (isFeatured) {
      return <Chip label="Istaknuta" color="info" size="small" />;
    }
    switch (status) {
      case 'published':
        return <Chip label="Objavljena" color="success" size="small" />;
      case 'archived':
        return <Chip label="Arhivirana" color="warning" size="small" />;
      default:
        return <Chip label={status} color="default" size="small" />;
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
        Greška pri učitavanju obavijesti. Molimo pokušajte ponovo.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Upravljanje Obavijestima
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateAnnouncement}
          data-testid="button-add-announcement"
        >
          Kreiraj Obavijest
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                <TableCell sx={{ fontWeight: 600 }}>Naslov</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Autor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Datum Objave</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Akcije</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(announcementsQuery.data || []).map((announcement: Announcement) => (
                <TableRow key={announcement.id}>
                  <TableCell>{announcement.title}</TableCell>
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
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, announcement)}
                      data-testid={`menu-announcement-${announcement.id}`}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {(announcementsQuery.data || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Nema obavijesti
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Announcement Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => menuAnnouncement && handleEditAnnouncement(menuAnnouncement)} data-testid="menu-edit">
          <Edit sx={{ mr: 1 }} />
          Uredi
        </MenuItem>
        <MenuItem onClick={() => menuAnnouncement && handleDeleteClick(menuAnnouncement)} data-testid="menu-delete">
          <Delete sx={{ mr: 1 }} />
          Obriši
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Potvrdi Brisanje</DialogTitle>
        <DialogContent>
          <Typography>
            Da li ste sigurni da želite obrisati obavijest "{announcementToDelete?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} data-testid="button-cancel-delete">
            Odustani
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            data-testid="button-confirm-delete"
          >
            Obriši
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
