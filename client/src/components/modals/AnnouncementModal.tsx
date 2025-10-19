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
import { Close, CloudUpload, Delete, AttachFile, Image, PictureAsPdf } from '@mui/icons-material';
import { Announcement, AnnouncementFileWithUser } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../../hooks/use-toast';
import { apiRequest } from '../../lib/queryClient';
import RichTextEditor from '../ui/rich-text-editor';

interface AnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (announcementData: any, selectedFiles: File[]) => Promise<void>;
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
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isFeatured: false,
    status: 'published',
    categories: [] as string[]
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const predefinedCategories = ['Džemat', 'IZBCH', 'IZ', 'Ostalo'];

  // Fetch existing announcement files when editing
  const announcementFilesQuery = useQuery<AnnouncementFileWithUser[]>({
    queryKey: ['/api/announcements', announcement?.id, 'files'],
    enabled: !!announcement?.id && open,
    retry: 1,
  });

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
    // Clear selected files when modal opens/closes
    setSelectedFiles([]);
    setUploading(false);
  }, [announcement, open]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      // Check file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'pdf'].includes(fileExtension || '')) {
        toast({
          title: 'Greška',
          description: `Nepodržan tip fajla: ${file.name}. Podržani tipovi: JPG, PNG, PDF`,
          variant: 'destructive',
        });
        continue;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Greška',
          description: `Fajl ${file.name} je prevelik. Maksimalna veličina je 10MB.`,
          variant: 'destructive',
        });
        continue;
      }
      
      validFiles.push(file);
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Clear the input value so the same file can be selected again
    event.target.value = '';
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const uploadFiles = async (announcementId: string) => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    
    try {
      for (const file of selectedFiles) {
        const fileType = getFileType(file.name);
        
        const response = await apiRequest('POST', `/api/announcements/${announcementId}/files`, {
          fileName: file.name,
          fileType,
          fileSize: file.size,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }
      
      toast({
        title: 'Uspjeh',
        description: `${selectedFiles.length} fajl(ova) je uspješno učitano`,
      });
      
      setSelectedFiles([]);
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri učitavanju fajlova',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteAnnouncementFile = async (fileId: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/announcement-files/${fileId}`);
      if (response.ok) {
        toast({
          title: 'Uspjeh',
          description: 'Fajl je uspješno obrisan',
        });
        // Refetch announcement files
        announcementFilesQuery.refetch();
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Greška pri brisanju fajla',
        variant: 'destructive',
      });
    }
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      case 'pdf':
        return 'pdf';
      default:
        return 'document';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image />;
      case 'pdf':
        return <PictureAsPdf />;
      default:
        return <AttachFile />;
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
      // Save the announcement and upload files
      const announcementData = {
        ...formData,
        authorId,
        status: formData.isFeatured ? 'featured' : 'published'
      };
      
      await onSave(announcementData, selectedFiles);
      
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
              variant="outlined"
              label="Naslov"
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
                  label="Kategorije"
                  placeholder="Izaberite ili unesite kategorije"
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
              label="Sadržaj"
              placeholder="Unesite sadržaj obavijesti..."
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

            {/* File Upload Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Prilozi
              </Typography>
              
              {/* File Upload Input */}
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                  data-testid="input-file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    data-testid="button-upload-files"
                  >
                    Dodaj Fajlove
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Podržani tipovi: JPG, PNG, PDF (maks. 10MB)
                </Typography>
              </Box>

              {/* Selected Files to Upload */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Odabrani fajlovi za upload:
                  </Typography>
                  <List dense>
                    {selectedFiles.map((file, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={file.name}
                          secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={getFileType(file.name)}
                            size="small"
                            color="primary"
                            sx={{ mr: 1 }}
                          />
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => removeFile(index)}
                            data-testid={`button-remove-file-${index}`}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Existing Announcement Files */}
              {announcementFilesQuery.data && announcementFilesQuery.data.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Postojeći prilozi:
                  </Typography>
                  <List dense>
                    {announcementFilesQuery.data.map((file) => (
                      <ListItem key={file.id}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFileIcon(file.fileType)}
                              <span>{file.fileName}</span>
                            </Box>
                          }
                          secondary={`${(file.fileSize / 1024 / 1024).toFixed(2)} MB - Dodao ${file.uploadedBy?.firstName} ${file.uploadedBy?.lastName}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={file.fileType}
                            size="small"
                            color="secondary"
                            sx={{ mr: 1 }}
                          />
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => deleteAnnouncementFile(file.id)}
                            data-testid={`button-delete-file-${file.id}`}
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Upload Files to Existing Announcement */}
              {announcement && selectedFiles.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<CloudUpload />}
                    onClick={() => uploadFiles(announcement.id)}
                    disabled={uploading}
                    data-testid="button-upload-selected-files"
                  >
                    {uploading ? 'Učitavanje...' : `Učitaj ${selectedFiles.length} fajl(ova)`}
                  </Button>
                </Box>
              )}

              {/* Info for new announcements */}
              {!announcement && selectedFiles.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Fajlovi će biti učitani nakon kreiranja obavijesti.
                </Alert>
              )}
            </Box>
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
