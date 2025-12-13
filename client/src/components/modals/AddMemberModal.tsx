import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['tasks', 'common']);
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
        title: t('common:common.success'), 
        description: t('addMemberModal.memberAdded') 
      });
      setSelectedUserId('');
      onClose();
    },
    onError: (error: any) => {
      let errorMessage = t('addMemberModal.addError');
      if (error.message?.includes('already a member')) {
        errorMessage = t('addMemberModal.alreadyMember');
      }
      toast({ 
        title: t('common:common.error'), 
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
        title: t('common:common.error'), 
        description: t('addMemberModal.selectUserRequired'), 
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
            {t('addMemberModal.loadError')}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} data-testid="button-close-error">
            {t('common:common.close')}
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
          <span>{t('addMemberModal.title', { name: workGroup.name })}</span>
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
                  {t('addMemberModal.selectUserDescription')}
                </Typography>
                
                <FormControl fullWidth required>
                  <InputLabel>{t('addMemberModal.selectUser')}</InputLabel>
                  <Select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    label={t('addMemberModal.selectUser')}
                    data-testid="select-user"
                  >
                    {availableUsers.length === 0 ? (
                      <MenuItem disabled>
                        <Typography color="text.secondary">
                          {t('addMemberModal.noUsersAvailable')}
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
                    {t('addMemberModal.allUsersAreMembers')}
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
            {t('common:common.cancel')}
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
            {t('addMemberModal.addMember')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}