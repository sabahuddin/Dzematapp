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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { 
  Close, 
  People, 
  PersonAdd, 
  PersonRemove,
  Email,
  CalendarMonth
} from '@mui/icons-material';
import { WorkGroup, WorkGroupMember, User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AddMemberModal from './modals/AddMemberModal';

interface MemberManagementDialogProps {
  open: boolean;
  onClose: () => void;
  workGroup: WorkGroup;
}

export default function MemberManagementDialog({ 
  open, 
  onClose, 
  workGroup 
}: MemberManagementDialogProps) {
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch work group members
  const membersQuery = useQuery<Array<WorkGroupMember & { user: User }>>({
    queryKey: ['/api/work-groups', workGroup.id, 'members'],
    enabled: open,
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/work-groups/${workGroup.id}/members/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups', workGroup.id, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/work-groups'] });
      toast({ 
        title: 'Uspjeh', 
        description: 'Član je uspješno uklonjen iz radne grupe' 
      });
    },
    onError: () => {
      toast({ 
        title: 'Greška', 
        description: 'Greška pri uklanjanju člana', 
        variant: 'destructive' 
      });
    }
  });

  const handleRemoveMember = (userId: string, userName: string) => {
    if (confirm(`Jeste li sigurni da želite ukloniti ${userName} iz grupe?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  const formatJoinDate = (date: string | Date | null) => {
    if (!date) return 'Nepoznat datum';
    try {
      return new Date(date).toLocaleDateString('hr-HR');
    } catch {
      return 'Nepoznat datum';
    }
  };

  if (membersQuery.error) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Alert severity="error">
            Greška pri učitavanju članova. Molimo zatvorite i pokušajte ponovo.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} data-testid="button-close-error">
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People />
            <span>Upravljanje Članovima - {workGroup.name}</span>
          </Box>
          <IconButton onClick={onClose} data-testid="close-member-management-dialog">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {workGroup.description && (
              <Typography variant="body2" color="text.secondary">
                {workGroup.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People sx={{ fontSize: 20 }} />
                Članovi Grupe
                {membersQuery.data && (
                  <Chip 
                    label={membersQuery.data.length} 
                    size="small" 
                    color="primary"
                    data-testid="members-count-chip"
                  />
                )}
              </Typography>

              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setAddMemberModalOpen(true)}
                data-testid="button-add-new-member"
              >
                Dodaj Člana
              </Button>
            </Box>

            <Divider />

            {membersQuery.isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !membersQuery.data || (membersQuery.data as any[]).length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <People sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary" variant="h6">
                  Nema članova u grupi
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                  Dodajte prvog člana klikom na dugme "Dodaj Člana"
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setAddMemberModalOpen(true)}
                  data-testid="button-add-first-member"
                >
                  Dodaj Prvog Člana
                </Button>
              </Box>
            ) : (
              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {(membersQuery.data as any[]).map((member: any, index: number) => {
                  const user = member.user || member; // Handle different response structures
                  return (
                    <ListItem 
                      key={member.id || index}
                      divider={index < (membersQuery.data as any[]).length - 1}
                      sx={{ 
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                      data-testid={`member-item-${user.id || index}`}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Email sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CalendarMonth sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                Pridružen: {formatJoinDate(member.joinedAt)}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveMember(user.id, `${user.firstName} ${user.lastName}`)}
                          disabled={removeMemberMutation.isPending}
                          sx={{ 
                            color: 'error.main',
                            '&:hover': {
                              bgcolor: 'error.light',
                              color: 'error.contrastText'
                            }
                          }}
                          data-testid={`button-remove-member-${user.id}`}
                        >
                          {removeMemberMutation.isPending ? (
                            <CircularProgress size={20} />
                          ) : (
                            <PersonRemove />
                          )}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            data-testid="button-close-member-management"
          >
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Modal */}
      <AddMemberModal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        workGroup={workGroup}
      />
    </>
  );
}