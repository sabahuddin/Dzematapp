import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
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
  const { t } = useTranslation(['tasks', 'common']);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'javna'
  });

  useEffect(() => {
    if (workGroup) {
      setFormData({
        name: workGroup.name || '',
        description: workGroup.description || '',
        visibility: workGroup.visibility || 'javna'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        visibility: 'javna'
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
        {workGroup ? t('tasks:editSection') : t('tasks:createSection')}
        <IconButton onClick={onClose} data-testid="close-workgroup-modal">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              label={t('tasks:sectionName')}
              value={formData.name}
              onChange={handleChange('name')}
              required
              data-testid="input-name"
            />
            
            <TextField
              fullWidth
              variant="outlined"
              label={t('tasks:description')}
              value={formData.description}
              onChange={handleChange('description')}
              multiline
              rows={4}
              data-testid="input-description"
            />
            
            <FormControl component="fieldset">
              <FormLabel component="legend">{t('tasks:visibility.label')}</FormLabel>
              <RadioGroup
                value={formData.visibility}
                onChange={handleChange('visibility')}
                data-testid="radio-visibility"
              >
                <FormControlLabel 
                  value="javna" 
                  control={<Radio />} 
                  label={t('tasks:visibility.public')}
                  data-testid="radio-javna"
                />
                <FormControlLabel 
                  value="privatna" 
                  control={<Radio />} 
                  label={t('tasks:visibility.private')}
                  data-testid="radio-privatna"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={onClose} 
            variant="outlined"
            data-testid="button-cancel"
          >
            {t('common:common.cancel')}
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            data-testid="button-save"
          >
            {t('common:common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
