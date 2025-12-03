import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { Close, PersonAdd } from '@mui/icons-material';
import { User, WorkGroup } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest } from '@/lib/queryClient';

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  workGroup: WorkGroup;
}

export default function AddMemberModal({ open, onClose, workGroup }: AddMemberModalProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users - SCOPED BY TENANT
  const usersQuery = useQuery({
    queryKey: ['/api/users', user?.tenantId],
    enabled: open,
  });

  // Fetch current work group members
  const membersQuery = useQuery({
    queryKey: [`/api/work-groups/${workGroup.id}/members`],
    enabled: open,
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/work-groups/${workGroup.id}/members`, 'POST', {
        userId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/work-groups/${workGroup.id}/members`] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      toast({ 
        title: 'Uspjeh', 
        description: 'Član je uspješno dodan u sekciju' 
      });
      setSelectedUserId('');
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = 'Greška pri dodavanju člana';
      if (error.message?.includes('already a member')) {
        errorMessage = 'Korisnik je već član ove sekcije';
      }
      toast({ 
        title: 'Greška', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    }
  });

  // Get available users (not already members)
  const getAvailableUsers = () => {
    if (!usersQuery.data || !membersQuery.data) return [];
    
    const memberUserIds = (membersQuery.data as any[]).map((member: any) => member.user?.id || member.userId);
    return (usersQuery.data as User[]).filter((user: User) => !memberUserIds.includes(user.id));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) {
      toast({ 
        title: 'Greška', 
        description: 'Molimo odaberite korisnika', 
        variant: 'destructive' 
      });
      return;
    }
    addMemberMutation.mutate(selectedUserId);
  };

  const handleClose = () => {
    setSelectedUserId('');
    onClose();
  };

  if (usersQuery.error || membersQuery.error) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Alert severity="error">
            Greška pri učitavanju podataka. Molimo zatvorite i pokušajte ponovo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} data-testid="button-close-error">
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  const availableUsers = getAvailableUsers();
  const isLoading = usersQuery.isLoading || membersQuery.isLoading;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd />
          <span>Dodaj Člana - {workGroup.name}</span>
        </Box>
        <IconButton onClick={handleClose} data-testid="close-add-member-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Odaberite korisnika kojeg želite dodati u sekciju
                </Typography>
                
                <FormControl fullWidth required>
                  <InputLabel>Odaberite korisnika</InputLabel>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    label="Odaberite korisnika"
                    data-testid="select-user"
                  >
                    {availableUsers.length === 0 ? (
                      <MenuItem disabled>
                        <Typography color="text.secondary">
                          Nema dostupnih korisnika za dodavanje
                        </Typography>
                      </MenuItem>
                    ) : (
                      availableUsers.map((user: User) => (
                        <MenuItem key={user.id} value={user.id} data-testid={`option-user-${user.id}`}>
                          {user.firstName} {user.lastName} ({user.email})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {availableUsers.length === 0 && (
                  <Alert severity="info">
                    Svi korisnici su već članovi ove sekcije ili nema registriranih korisnika.
                  </Alert>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined"
            disabled={addMemberMutation.isPending}
            data-testid="button-cancel-add-member"
          >
            Odustani
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            disabled={!selectedUserId || addMemberMutation.isPending || availableUsers.length === 0}
            data-testid="button-add-member"
          >
            {addMemberMutation.isPending ? (
              <CircularProgress size={20} sx={{ mr: 1 }} />
            ) : null}
            Dodaj Člana
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}