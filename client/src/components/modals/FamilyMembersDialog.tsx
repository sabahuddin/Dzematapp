import { useState, Fragment } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Button
} from '@mui/material';
import { Close, Person, Add, Delete } from '@mui/icons-material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import FamilySelectionDialog from './FamilySelectionDialog';

interface FamilyMembersDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function FamilyMembersDialog({ open, onClose, userId, userName }: FamilyMembersDialogProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: familyRelationships, isLoading } = useQuery({
    queryKey: [`/api/family-relationships/${userId}`],
    enabled: open && !!userId,
  });

  const handleDeleteRelationship = async (relationshipId: string) => {
    if (confirm('Da li ste sigurni da želite ukloniti ovog člana porodice?')) {
      await apiRequest(`/api/family-relationships/${relationshipId}`, 'DELETE');
      queryClient.invalidateQueries({ queryKey: [`/api/family-relationships/${userId}`] });
    }
  };

  const getRelationshipLabel = (relationship: string) => {
    const labels: Record<string, string> = {
      'supružnik': 'Supružnik/a',
      'dijete': 'Dijete',
      'roditelj': 'Roditelj',
      'brat': 'Brat',
      'sestra': 'Sestra',
      'ostalo': 'Ostalo'
    };
    return labels[relationship] || relationship;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          Članovi porodice - {userName}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add />}
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-family-member"
          >
            Dodaj
          </Button>
          <IconButton onClick={onClose} data-testid="close-family-members-dialog">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !familyRelationships || (familyRelationships as any[]).length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Nema članova porodice
            </Typography>
          </Box>
        ) : (
          <List>
            {(familyRelationships as any[]).map((relationship: any, index: number) => (
              <Fragment key={relationship.id}>
                {index > 0 && <Divider />}
                <ListItem 
                  data-testid={`family-member-${relationship.id}`}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small"
                      onClick={() => handleDeleteRelationship(relationship.id)}
                      data-testid={`button-delete-family-${relationship.id}`}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={relationship.relatedUser?.photo || undefined}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${relationship.relatedUser?.firstName} ${relationship.relatedUser?.lastName}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600, color: '#1976d2' }}>
                          {getRelationshipLabel(relationship.relationship)}
                        </Typography>
                        {relationship.relatedUser?.email && (
                          <Typography variant="body2" component="div" color="text.secondary">
                            {relationship.relatedUser.email}
                          </Typography>
                        )}
                        {relationship.relatedUser?.phone && (
                          <Typography variant="body2" component="div" color="text.secondary">
                            {relationship.relatedUser.phone}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      {/* Add Family Member Dialog with tabs */}
      <FamilySelectionDialog
        open={showAddDialog}
        onClose={() => {
          setShowAddDialog(false);
          queryClient.invalidateQueries({ queryKey: [`/api/family-relationships/${userId}`] });
        }}
        userId={userId}
      />
    </Dialog>
  );
}
