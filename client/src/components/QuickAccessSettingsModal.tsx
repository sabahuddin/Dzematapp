import { useState } from 'react';
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
import { AVAILABLE_SHORTCUTS } from './QuickAccessWidget';

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
  const [selectedShortcuts, setSelectedShortcuts] = useState<string[]>(currentShortcuts);

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

  const handleClose = () => {
    // Reset to current shortcuts when closing without saving
    setSelectedShortcuts(currentShortcuts);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      data-testid="dialog-quickaccess-settings"
    >
      <DialogTitle>
        Podesi Brze Linkove
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Izaberite do 8 najčešće korištenih stranica za brzi pristup sa dashboard-a.
        </Typography>

        {selectedShortcuts.length >= 8 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Dostigli ste maksimalni broj brzih linkova (8). Uklonite neki da dodate novi.
          </Alert>
        )}

        <FormGroup>
          {AVAILABLE_SHORTCUTS.map((shortcut) => {
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
          onClick={handleClose} 
          disabled={isSaving}
          data-testid="button-cancel"
        >
          Otkaži
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          data-testid="button-save"
        >
          {isSaving ? 'Čuvam...' : 'Sačuvaj'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
