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
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Autocomplete
} from '@mui/material';
import { Close, CloudUpload } from '@mui/icons-material';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import RichTextEditor from '../ui/rich-text-editor';
import { useTranslation } from 'react-i18next';
import { Announcement } from '@shared/schema';

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (announcementData: any) => Promise<void>;
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
  const { t } = useTranslation(['announcements', 'common']);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isFeatured: false,
    status: 'published',
    categories: [] as string[]
  });
  const predefinedCategories = ['Džemat'];

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        isFeatured: announcement.isFeatured || false,
        status: announcement.status || 'published',
        categories: announcement.categories || []
      });
    } else {
      setFormData({
        title: '',
        content: '',
        isFeatured: false,
        status: 'published',
        categories: []
      });
    }
  }, [announcement, open]);


  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      const announcementData = {
        ...formData,
        authorId,
        status: formData.isFeatured ? 'featured' : 'published'
      };
      
      await onSave(announcementData);
      
      onClose();
    } catch (error) {
      console.error('Error saving announcement:', error);
    }
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
        {announcement ? t('announcements:modal.editTitle') : t('announcements:modal.createTitle')}
        <IconButton onClick={onClose} data-testid="close-announcement-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label={t('announcements:announcementTitle')}
              value={formData.title}
              onChange={handleChange('title')}
              required
              data-testid="input-title"
            />
            
            <Autocomplete
              multiple
              freeSolo
              options={predefinedCategories}
              value={formData.categories}
              onChange={(event, newValue) => {
                setFormData(prev => ({ ...prev, categories: newValue }));
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label={t('announcements:categories.label')}
                  placeholder={t('announcements:categories.placeholder')}
                  InputLabelProps={{ shrink: true }}
                  data-testid="input-categories"
                />
              )}
              sx={{ width: '100%' }}
              data-testid="autocomplete-categories"
            />
            
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              label={t('announcements:content')}
              placeholder={t('announcements:contentPlaceholder')}
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
              label={t('announcements:modal.featuredLabel')}
            />
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            data-testid="button-cancel"
          >
            {t('common:buttons.cancel')}
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            data-testid="button-save"
          >
            {t('announcements:modal.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
