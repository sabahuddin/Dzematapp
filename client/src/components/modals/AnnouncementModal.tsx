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
import { Close, CloudUpload, Article, Schedule } from '@mui/icons-material';
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
  isReadOnly?: boolean;
}

export default function AnnouncementModal({ 
  open, 
  onClose, 
  onSave, 
  announcement, 
  authorId,
  isReadOnly = false
}: AnnouncementModalProps) {
  const { t } = useTranslation(['announcements', 'common']);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isFeatured: false,
    status: 'published',
    categories: [] as string[],
    photoUrl: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const predefinedCategories = ['Džemat'];

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title || '',
        content: announcement.content || '',
        isFeatured: announcement.isFeatured || false,
        status: announcement.status || 'published',
        categories: announcement.categories || [],
        photoUrl: (announcement as any).photoUrl || ''
      });
      setPhotoPreview((announcement as any).photoUrl || '');
    } else {
      setFormData({
        title: '',
        content: '',
        isFeatured: false,
        status: 'published',
        categories: [],
        photoUrl: ''
      });
      setPhotoPreview('');
    }
  }, [announcement, open]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoPreview(base64);
        setFormData(prev => ({ ...prev, photoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };


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

  if (isReadOnly) {
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
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {formData.title}
          </Typography>
          <IconButton onClick={onClose} data-testid="close-announcement-modal">
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3, px: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Photo */}
            {photoPreview && (
              <Box sx={{ 
                borderRadius: '12px', 
                overflow: 'hidden',
                mb: 2
              }}>
                <img src={photoPreview} alt="Announcement" style={{ width: '100%', borderRadius: '12px' }} />
              </Box>
            )}

            {/* Categories */}
            {formData.categories && formData.categories.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.categories.map((cat) => (
                  <Chip 
                    key={cat}
                    label={cat} 
                    color="primary"
                    size="small"
                    sx={{ backgroundColor: '#3949AB', color: '#fff' }}
                  />
                ))}
              </Box>
            )}

            {/* Publish Date */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Schedule sx={{ color: '#3949AB', fontSize: 28, mt: 0.5 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Objavljeno
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {new Date(announcement?.publishDate || Date.now()).toLocaleDateString('bs-BA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Article sx={{ color: '#3949AB', fontSize: 28, mt: 0.5 }} />
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Sadržaj
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  border: '1px solid #e8eaf6', 
                  borderRadius: '8px',
                  backgroundColor: '#f5f7ff'
                }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formData.content }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={onClose} 
            variant="contained"
            data-testid="button-close"
            sx={{ backgroundColor: '#3949AB' }}
          >
            {t('common:buttons.close')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

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
            {/* Photo Upload */}
            {!isReadOnly && (
              <Box sx={{ 
                border: '2px dashed #3949AB', 
                borderRadius: '12px', 
                p: 2, 
                textAlign: 'center',
                backgroundColor: '#f5f7ff',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                  id="photo-input"
                />
                <label htmlFor="photo-input" style={{ cursor: 'pointer', display: 'block' }}>
                  {photoPreview ? (
                    <Box>
                      <img src={photoPreview} alt="Preview" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#3949AB' }}>
                        {t('announcements:modal.uploadFiles')}
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ py: 2 }}>
                      <CloudUpload sx={{ fontSize: 40, color: '#3949AB', mb: 1 }} />
                      <Typography variant="body2" sx={{ color: '#3949AB', fontWeight: 500 }}>
                        Dodaj sliku obavijesti
                      </Typography>
                    </Box>
                  )}
                </label>
              </Box>
            )}

            <TextField
              fullWidth
              variant="outlined"
              label={t('announcements:announcementTitle')}
              value={formData.title}
              onChange={handleChange('title')}
              required
              disabled={isReadOnly}
              data-testid="input-title"
            />
            
            <Autocomplete
              multiple
              freeSolo
              disabled={isReadOnly}
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
                  disabled={isReadOnly}
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
