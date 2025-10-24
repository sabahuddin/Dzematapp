import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { getAvailableShortcuts } from './QuickAccessWidget';
import { useTranslation } from 'react-i18next';

interface QuickAccessSettingsModalProps {
  open: boolean;
  onClose: () => void;
  currentShortcuts: string[];
  onSave: (shortcuts: string[]) => void;
  isSaving?: boolean;
}

export default function QuickAccessSettingsModal({
  open,
  onClose,
  currentShortcuts,
  onSave,
  isSaving = false,
}: QuickAccessSettingsModalProps) {
  const { t } = useTranslation(['navigation']);
  const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>(currentShortcuts);
  const availableShortcuts = getAvailableShortcuts(t);

  // Sync selectedShortcuts with currentShortcuts when modal opens or currentShortcuts changes
  useEffect(() => {
    if (open) {
      setSelectedShortcuts(currentShortcuts);
    }
  }, [open, currentShortcuts]);

  const handleToggle = (path: string) => {
    setSelectedShortcuts((prev) => {
      if (prev.includes(path)) {
        return prev.filter((p) => p !== path);
      } else {
        // Limit to 8 shortcuts
        if (prev.length >= 8) {
          return prev;
        }
        return [...prev, path];
      }
    });
  };

  const handleSave = () => {
    onSave(selectedShortcuts);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      data-testid="dialog-quickaccess-settings"
    >
      <DialogTitle>
        {t('navigation:customizeQuickAccess')}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('navigation:quickAccessDescription')}
        </Typography>

        {selectedShortcuts.length >= 8 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('navigation:quickAccessLimit')}
          </Alert>
        )}

        <FormGroup>
          {availableShortcuts.map((shortcut) => {
            const IconComponent = shortcut.icon;
            const isChecked = selectedShortcuts.includes(shortcut.path);
            const isDisabled = !isChecked && selectedShortcuts.length >= 8;

            return (
              <FormControlLabel
                key={shortcut.path}
                control={
                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleToggle(shortcut.path)}
                    disabled={isDisabled}
                    data-testid={`checkbox-shortcut-${shortcut.path.replace('/', '')}`}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconComponent sx={{ fontSize: 20, color: shortcut.color }} />
                    <Typography variant="body2">{shortcut.label}</Typography>
                  </Box>
                }
              />
            );
          })}
        </FormGroup>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isSaving}
          data-testid="button-cancel"
        >
          {t('navigation:cancel')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          data-testid="button-save"
        >
          {isSaving ? t('navigation:saving') : t('navigation:save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
