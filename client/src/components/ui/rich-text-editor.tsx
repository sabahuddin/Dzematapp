import { useState } from 'react';
import ReactQuill from 'react-quill';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Visibility } from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  required?: boolean;
  'data-testid'?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Unesite tekst...',
  minHeight = '200px',
  required = false,
  'data-testid': dataTestId,
}: RichTextEditorProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Box sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500, color: 'text.secondary' }}>
          {label} {required && <span style={{ color: 'error.main' }}>*</span>}
        </Box>
      )}
      
      <Box 
        sx={{ 
          border: '1px solid rgba(0, 0, 0, 0.23)',
          borderRadius: '4px',
          '&:hover': {
            borderColor: 'rgba(0, 0, 0, 0.87)',
          },
          '& .quill': {
            display: 'flex',
            flexDirection: 'column',
          },
          '& .ql-toolbar': {
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRadius: '4px 4px 0 0',
            backgroundColor: '#f5f5f5',
          },
          '& .ql-container': {
            border: 'none',
            minHeight: minHeight,
            fontSize: '1rem',
            fontFamily: 'inherit',
          },
          '& .ql-editor': {
            minHeight: minHeight,
          },
          '& .ql-editor.ql-blank::before': {
            fontStyle: 'normal',
            color: 'rgba(0, 0, 0, 0.38)',
          }
        }}
        data-testid={dataTestId}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
        />
      </Box>

      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => setPreviewOpen(true)}
          disabled={!value || value === '<p><br></p>'}
          data-testid={`${dataTestId}-preview-button`}
        >
          Pregled
        </Button>
      </Box>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>Pregled Sadržaja</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              p: 2,
              border: '1px solid rgba(0, 0, 0, 0.12)',
              borderRadius: 1,
              backgroundColor: '#fafafa',
              '& p': { marginBottom: '1em' },
              '& ul, & ol': { marginLeft: '1.5em', marginBottom: '1em' },
              '& a': { color: 'primary.main', textDecoration: 'underline' },
              '& strong': { fontWeight: 'bold' },
              '& em': { fontStyle: 'italic' },
              '& u': { textDecoration: 'underline' },
            }}
            dangerouslySetInnerHTML={{ __html: value }}
            data-testid={`${dataTestId}-preview-content`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setPreviewOpen(false)} 
            variant="contained"
            data-testid={`${dataTestId}-preview-close`}
          >
            Zatvori
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
