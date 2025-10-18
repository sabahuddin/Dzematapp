import { useState, useRef, useMemo } from 'react';
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
  const quillRef = useRef<ReactQuill>(null);

  // Function to resize image based on screen size
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Determine max width based on screen size
          const screenWidth = window.innerWidth;
          let maxWidth = 1024; // Desktop default
          
          if (screenWidth < 768) {
            maxWidth = 480; // Mobile
          } else if (screenWidth < 1024) {
            maxWidth = 720; // Tablet
          }

          // Calculate new dimensions
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          // Create canvas and resize
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Convert to base64 with quality 0.8 to reduce size
            const resizedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            resolve(resizedBase64);
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  // Image upload handler
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        // Check file size (max 10MB for original file)
        if (file.size > 10 * 1024 * 1024) {
          alert('Slika je prevelika. Maksimalna veličina je 10MB.');
          return;
        }

        try {
          // Resize and convert to base64
          const resizedBase64 = await resizeImage(file);
          
          // Insert into editor
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', resizedBase64);
            quill.setSelection(range.index + 1, 0);
          }
        } catch (error) {
          console.error('Error resizing image:', error);
          alert('Greška pri obradi slike. Pokušajte ponovo.');
        }
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    },
  }), []);

  const formats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link', 'image'
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
          },
          '& .ql-editor img': {
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            margin: '10px 0',
          }
        }}
        data-testid={dataTestId}
      >
        <ReactQuill
          ref={quillRef}
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
              '& img': { 
                maxWidth: '100%', 
                height: 'auto',
                display: 'block',
                margin: '10px 0',
              }
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
