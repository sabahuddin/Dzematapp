import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  IconButton,
  Box
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Announcement } from '@shared/schema';

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (announcementData: any) => void;
  announcement?: Announcement | null;
  authorId: string;
}

export default function AnnouncementModal({ 
  open, 
  onClose, 
  onSave, 
  announcement, 
  authorId 
}: AnnouncementModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isFeatured: false,
    status: 'published'
  });

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        isFeatured: announcement.isFeatured || false,
        status: announcement.status || 'published'
      });
    } else {
      setFormData({
        title: '',
        content: '',
        isFeatured: false,
        status: 'published'
      });
    }
  }, [announcement, open]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...formData,
      authorId,
      status: formData.isFeatured ? 'featured' : 'published'
    });
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
        {announcement ? 'Uredi Obavijest' : 'Kreiraj Obavijest'}
        <IconButton onClick={onClose} data-testid="close-announcement-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Naslov"
              value={formData.title}
              onChange={handleChange('title')}
              required
              data-testid="input-title"
            />
            
            <TextField
              fullWidth
              label="Sadržaj"
              value={formData.content}
              onChange={handleChange('content')}
              multiline
              rows={6}
              required
              data-testid="input-content"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isFeatured}
                  onChange={handleChange('isFeatured')}
                  data-testid="switch-featured"
                />
              }
              label="Istaknuta Obavijest"
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
