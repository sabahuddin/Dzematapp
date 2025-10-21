import React from 'react';
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
  CircularProgress
} from '@mui/material';
import { Close, Person } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

interface FamilyMembersDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export default function FamilyMembersDialog({ open, onClose, userId, userName }: FamilyMembersDialogProps) {
  const { data: familyRelationships, isLoading } = useQuery({
    queryKey: ['/api/family-relationships', userId],
    enabled: open && !!userId,
  });

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
        Članovi porodice - {userName}
        <IconButton onClick={onClose} data-testid="close-family-members-dialog">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !familyRelationships || familyRelationships.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Nema članova porodice
            </Typography>
          </Box>
        ) : (
          <List>
            {familyRelationships.map((relationship: any, index: number) => (
              <React.Fragment key={relationship.id}>
                {index > 0 && <Divider />}
                <ListItem data-testid={`family-member-${relationship.id}`}>
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
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
