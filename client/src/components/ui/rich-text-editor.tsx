import { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { Visibility, Close } from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  required?: boolean;
  readOnly?: boolean;
  'data-testid'?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  label,
  placeholder = 'Unesite tekst...',
  minHeight = '200px',
  required = false,
  readOnly = false,
  'data-testid': dataTestId,
}: RichTextEditorProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');
  const quillRef = useRef<ReactQuill>(null);

  // Convert image to base64 with compression
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL('image/jpeg', 0.85);
            resolve(base64);
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
        if (file.size > 10 * 1024 * 1024) {
          alert('Slika je prevelika. Maksimalna veličina je 10MB.');
          return;
        }

        try {
          const base64 = await convertImageToBase64(file);
          
          const quill = quillRef.current?.getEditor();
          if (quill) {
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, 'image', base64);
            quill.setSelection(range.index + 1, 0);
          }
        } catch (error) {
          console.error('Error processing image:', error);
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

  // Add click handlers to images for full-size preview
  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        const imgSrc = (target as HTMLImageElement).src;
        setSelectedImageSrc(imgSrc);
        setImageModalOpen(true);
      }
    };

    const editorElement = quillRef.current?.getEditor()?.root;
    if (editorElement) {
      editorElement.addEventListener('click', handleImageClick as EventListener);
      return () => {
        editorElement.removeEventListener('click', handleImageClick as EventListener);
      };
    }
  }, [value]);

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
            backgroundColor: 'hsl(0 0% 96%)',
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
            width: '80%',
            height: 'auto',
            aspectRatio: '4/3',
            objectFit: 'cover',
            display: 'block',
            margin: '10px auto',
            cursor: 'pointer',
            borderRadius: '4px',
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 0.9,
            }
          }
        }}
        data-testid={dataTestId}
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={readOnly ? { toolbar: false } : modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={readOnly}
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
              backgroundColor: 'hsl(0 0% 98%)',
              '& p': { marginBottom: '1em' },
              '& ul, & ol': { marginLeft: '1.5em', marginBottom: '1em' },
              '& a': { color: 'primary.main', textDecoration: 'underline' },
              '& strong': { fontWeight: 'bold' },
              '& em': { fontStyle: 'italic' },
              '& u': { textDecoration: 'underline' },
              '& img': { 
                width: '80%', 
                height: 'auto',
                display: 'block',
                margin: '10px auto',
                cursor: 'pointer',
                borderRadius: '4px',
                '&:hover': {
                  opacity: 0.9,
                }
              }
            }}
            dangerouslySetInnerHTML={{ __html: value }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'IMG') {
                setSelectedImageSrc((target as HTMLImageElement).src);
                setImageModalOpen(true);
              }
            }}
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

      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 2,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }
        }}
      >
        <IconButton
          onClick={() => setImageModalOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
            zIndex: 1
          }}
          data-testid="button-close-image-modal"
        >
          <Close />
        </IconButton>
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box
            component="img"
            src={selectedImageSrc}
            alt="Puna veličina"
            sx={{
              maxWidth: '100%',
              maxHeight: '85vh',
              objectFit: 'contain'
            }}
            data-testid="image-full-size"
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
