import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { WorkGroup } from '@shared/schema';

interface WorkGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (workGroupData: any) => void;
  workGroup?: WorkGroup | null;
}

export default function WorkGroupModal({ 
  open, 
  onClose, 
  onSave, 
  workGroup 
}: WorkGroupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (workGroup) {
      setFormData({
        name: workGroup.name || '',
        description: workGroup.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [workGroup, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
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
        {workGroup ? 'Uredi Radnu Grupu' : 'Kreiraj Novu Radnu Grupu'}
        <IconButton onClick={onClose} data-testid="close-workgroup-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Naziv Grupe"
              value={formData.name}
              onChange={handleChange('name')}
              required
              data-testid="input-name"
            />
            
            <TextField
              fullWidth
              label="Opis"
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={4}
              data-testid="input-description"
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            data-testid="button-cancel"
          >
            Odustani
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            data-testid="button-save"
          >
            Spremi
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
