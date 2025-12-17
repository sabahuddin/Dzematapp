import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Box,
  Button,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Upload
} from '@mui/icons-material';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Predefined font colors
const FONT_COLORS = [
  { value: "#000000", label: "Crna", color: "#000000" },
  { value: "#2196F3", label: "Plava", color: "#2196F3" },
  { value: "#4CAF50", label: "Zelena", color: "#4CAF50" },
  { value: "#8B6F47", label: "Smeđa", color: "#8B6F47" },
  { value: "#FDD835", label: "Žuta", color: "#FDD835" },
];

const templateFormSchema = z.object({
  name: z.string().min(1, "Naziv je obavezan"),
  description: z.string().optional(),
  textPositionX: z.number().min(0),
  textPositionY: z.number().min(0),
  fontSize: z.number().min(1),
  fontColor: z.string().min(1),
  textAlign: z.enum(['left', 'center', 'right']),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateImagePath: string;
  textPositionX: number | null;
  textPositionY: number | null;
  fontSize: number | null;
  fontColor: string | null;
  fontFamily: string | null;
  textAlign: string | null;
  createdById: string;
  createdAt: Date | null;
}

interface CertificateTemplatesPageProps {
  hideHeader?: boolean;
}

export default function CertificateTemplatesPage({ hideHeader = false }: CertificateTemplatesPageProps = {}) {
  const { t } = useTranslation(['certificates']);
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1024, height: 724 });

  const { register, handleSubmit: hookFormSubmit, reset, watch, control, formState: { errors } } = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      textPositionX: 512,
      textPositionY: 165,
      fontSize: 72,
      fontColor: "#000000",
      textAlign: "center",
    },
  });

  const { data: templates = [], isLoading } = useQuery<CertificateTemplate[]>({
    queryKey: ['/api/certificates/templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!selectedFile && !selectedTemplate) {
        throw new Error("Template image is required");
      }

      const formData = new FormData();
      if (selectedFile) {
        formData.append('templateImage', selectedFile);
      }
      formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('textPositionX', data.textPositionX.toString());
      formData.append('textPositionY', data.textPositionY.toString());
      formData.append('fontSize', data.fontSize.toString());
      formData.append('fontColor', data.fontColor);
      formData.append('textAlign', data.textAlign);

      const response = await fetch('/api/certificates/templates', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create template');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({
        title: t('common:success'),
        description: t('templates.created'),
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: t('common:error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, file }: { id: string; data: Partial<TemplateFormData>; file?: File | null }) => {
      if (file) {
        const formData = new FormData();
        formData.append('templateImage', file);
        formData.append('name', data.name || '');
        if (data.description) formData.append('description', data.description);
        formData.append('textPositionX', data.textPositionX?.toString() || '0');
        formData.append('textPositionY', data.textPositionY?.toString() || '0');
        formData.append('fontSize', data.fontSize?.toString() || '0');
        formData.append('fontColor', data.fontColor || '#000000');
        formData.append('textAlign', data.textAlign || 'center');

        const response = await fetch(`/api/certificates/templates/${id}`, {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to update template');
        }

        return response.json();
      } else {
        return apiRequest(`/api/certificates/templates/${id}`, 'PUT', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({
        title: t('common:success'),
        description: t('templates.updated'),
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: t('common:error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/certificates/templates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({
        title: t('common:success'),
        description: t('templates.deleted'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common:error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormSubmitWithValidation = hookFormSubmit(
    (data) => {
      console.log('[CERT FORM] Submit clicked, data:', data);
      console.log('[CERT FORM] selectedFile:', selectedFile);
      console.log('[CERT FORM] selectedTemplate:', selectedTemplate);
      
      if (!selectedFile && !selectedTemplate) {
        toast({
          title: t('common:error'),
          description: t('templates.imageRequired'),
          variant: "destructive",
        });
        return;
      }
      if (selectedTemplate) {
        updateMutation.mutate({ id: selectedTemplate.id, data, file: selectedFile });
      } else {
        createMutation.mutate(data);
      }
    },
    (formErrors) => {
      console.log('[CERT FORM] Validation errors:', formErrors);
      const errorMessages = Object.values(formErrors).map(e => e?.message).filter(Boolean).join(', ');
      toast({
        title: t('common:error'),
        description: errorMessages || t('common:checkAllFields'),
        variant: "destructive",
      });
    }
  );

  const handleOpenModal = (template?: CertificateTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setPreviewUrl(template.templateImagePath);
      // Load dimensions for existing template image
      loadImageDimensions(template.templateImagePath);
      reset({
        name: template.name,
        description: template.description || "",
        textPositionX: template.textPositionX ?? 400,
        textPositionY: template.textPositionY ?? 300,
        fontSize: template.fontSize ?? 48,
        fontColor: template.fontColor ?? "#000000",
        textAlign: (template.textAlign as 'left' | 'center' | 'right') ?? "center",
      });
    } else {
      setSelectedTemplate(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setImageDimensions({ width: 1024, height: 724 }); // Reset to default
      reset();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast({
          title: t('common:error'),
          description: t('templates.errorPngOnly'),
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        
        // Get actual image dimensions
        const img = new Image();
        img.onload = () => {
          setImageDimensions({ width: img.width, height: img.height });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Load dimensions for existing template image
  const loadImageDimensions = (imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
    img.src = imageUrl;
  };


  const handleDeleteClick = (id: string) => {
    setTemplateToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete);
      setDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {!hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }} data-testid="text-page-title">
            {t('templates.pageTitle')}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            data-testid="button-add-template"
          >
            {t('templates.addTemplate')}
          </Button>
        </Box>
      )}

      {hideHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            data-testid="button-add-template"
          >
            {t('templates.addTemplate')}
          </Button>
        </Box>
      )}

      <Card>
        <TableContainer sx={{ overflowX: 'auto' }}>
          {templates.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary" data-testid="text-no-templates">
                {t('templates.noTemplates')}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>{t('templates.image')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('templates.name')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('templates.descriptionHeader')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('templates.font')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('templates.position')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('templates.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell>
                      <img
                        src={template.templateImagePath}
                        alt={template.name}
                        style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 4 }}
                        data-testid={`img-template-${template.id}`}
                      />
                    </TableCell>
                    <TableCell data-testid={`text-name-${template.id}`}>
                      <Typography variant="body2" fontWeight={500}>
                        {template.name}
                      </Typography>
                    </TableCell>
                    <TableCell data-testid={`text-description-${template.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        {template.description || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell data-testid={`text-font-${template.id}`}>
                      <Typography variant="body2">
                        {template.fontSize}px {template.fontColor}
                      </Typography>
                    </TableCell>
                    <TableCell data-testid={`text-position-${template.id}`}>
                      <Typography variant="body2">
                        X:{template.textPositionX} Y:{template.textPositionY}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenModal(template)}
                          sx={{ color: 'hsl(207 88% 55%)' }}
                          data-testid={`button-edit-${template.id}`}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(template.id)}
                          sx={{ color: 'hsl(4 90% 58%)' }}
                          data-testid={`button-delete-${template.id}`}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Card>

      {/* Template Modal */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <form onSubmit={handleFormSubmitWithValidation}>
          <DialogTitle data-testid="text-modal-title">
            {selectedTemplate ? t('templates.editTemplate') : t('templates.addNewTemplate')}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="caption" color="text.secondary">
                {selectedTemplate
                  ? t('templates.updateInfo')
                  : t('templates.createNew')}
              </Typography>

              {/* File Upload */}
              {!selectedTemplate && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {t('templates.templateImage')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="template-upload"
                      data-testid="input-template-file"
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Upload />}
                      onClick={() => document.getElementById('template-upload')?.click()}
                      data-testid="button-upload-file"
                    >
                      {selectedFile ? t('templates.changeImage') : t('templates.selectImage')}
                    </Button>
                    {selectedFile && (
                      <Typography variant="body2" color="text.secondary">
                        {selectedFile.name}
                      </Typography>
                    )}
                  </Box>
                  {previewUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{ maxWidth: '100%', height: 256, objectFit: 'contain', border: '1px solid hsl(0 0% 88%)', borderRadius: 4 }}
                          data-testid="img-preview"
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            border: '2px solid hsl(4 90% 58%)',
                            backgroundColor: 'hsla(4, 90%, 58%, 0.1)',
                            left: `${((watch('textPositionX') || 0) / imageDimensions.width) * 100}%`,
                            top: `${((watch('textPositionY') || 0) / imageDimensions.height) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                            fontSize: `${Math.min((watch('fontSize') || 48) / 10, 16)}px`,
                            color: watch('fontColor') || '#000000',
                            textAlign: watch('textAlign') || 'center',
                            minWidth: '200px',
                            padding: '4px 8px',
                            pointerEvents: 'none',
                          }}
                        >
                          Ime Prezime
                        </Box>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        {t('templates.positionPreviewHint')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {selectedTemplate && previewUrl && (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {t('templates.currentImage')}
                  </Typography>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={previewUrl}
                      alt="Current template"
                      style={{ maxWidth: '100%', height: 256, objectFit: 'contain', border: '1px solid hsl(0 0% 88%)', borderRadius: 4 }}
                      data-testid="img-current-template"
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        border: '2px solid hsl(4 90% 58%)',
                        backgroundColor: 'hsla(4, 90%, 58%, 0.1)',
                        left: `${((watch('textPositionX') || 0) / imageDimensions.width) * 100}%`,
                        top: `${((watch('textPositionY') || 0) / imageDimensions.height) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${Math.min((watch('fontSize') || 48) / 10, 16)}px`,
                        color: watch('fontColor') || '#000000',
                        textAlign: watch('textAlign') || 'center',
                        minWidth: '200px',
                        padding: '4px 8px',
                        pointerEvents: 'none',
                      }}
                    >
                      Ime Prezime
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('templates.positionPreviewHint')}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      {t('templates.replaceImageOptional')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                        id="template-upload-edit"
                        data-testid="input-template-file-edit"
                      />
                      <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => document.getElementById('template-upload-edit')?.click()}
                        data-testid="button-upload-file-edit"
                      >
                        {selectedFile ? t('templates.changeImage') : t('templates.selectNewImage')}
                      </Button>
                      {selectedFile && (
                        <Typography variant="body2" color="text.secondary">
                          {selectedFile.name}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              <TextField
                fullWidth
                label={t('templates.name')}
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
                required
                data-testid="input-name"
              />

              <TextField
                fullWidth
                label={t('templates.description')}
                multiline
                rows={2}
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                data-testid="input-description"
              />

              <Box>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label={t('templates.positionX')}
                    type="number"
                    {...register('textPositionX', { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === '' ? 0 : parseInt(v, 10)
                    })}
                    error={!!errors.textPositionX}
                    helperText={errors.textPositionX?.message}
                    required
                    data-testid="input-position-x"
                  />
                  <TextField
                    fullWidth
                    label={t('templates.positionY')}
                    type="number"
                    {...register('textPositionY', { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === '' ? 0 : parseInt(v, 10)
                    })}
                    error={!!errors.textPositionY}
                    helperText={errors.textPositionY?.message}
                    required
                    data-testid="input-position-y"
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  💡 {t('templates.positionCenteringHint')}
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label={t('templates.fontSize')}
                    type="number"
                    {...register('fontSize', { 
                      valueAsNumber: true,
                      setValueAs: (v) => v === '' ? 0 : parseInt(v, 10)
                    })}
                    error={!!errors.fontSize}
                    helperText={errors.fontSize?.message}
                    required
                    data-testid="input-font-size"
                  />
                  <Controller
                    name="fontColor"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.fontColor} required>
                        <InputLabel>{t('templates.fontColor')}</InputLabel>
                        <Select
                          {...field}
                          label={t('templates.fontColor')}
                          data-testid="select-font-color"
                        >
                          {FONT_COLORS.map((colorOption) => (
                            <MenuItem key={colorOption.value} value={colorOption.value} data-testid={`option-color-${colorOption.value.replace('#', '')}`}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box 
                                  sx={{ 
                                    width: 20, 
                                    height: 20, 
                                    backgroundColor: colorOption.color, 
                                    border: '1px solid hsl(0 0% 88%)',
                                    borderRadius: '2px'
                                  }} 
                                />
                                {colorOption.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  💡 {t('templates.fontRecommendationHint')}
                </Typography>
              </Box>

              <Controller
                name="textAlign"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label={t('templates.textAlign')}
                    error={!!errors.textAlign}
                    helperText={errors.textAlign?.message}
                    required
                    data-testid="select-text-align"
                  >
                    <MenuItem value="left">{t('templates.alignLeft')}</MenuItem>
                    <MenuItem value="center">{t('templates.alignCenter')}</MenuItem>
                    <MenuItem value="right">{t('templates.alignRight')}</MenuItem>
                  </TextField>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseModal}
              data-testid="button-cancel"
            >
              {t('templates.cancel')}
            </Button>
            <Button
              type="button"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save"
              onClick={() => {
                console.log('[CERT FORM] Button clicked directly');
                handleFormSubmitWithValidation();
              }}
            >
              {createMutation.isPending || updateMutation.isPending
                ? t('templates.saving')
                : t('templates.save')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('templates.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
            {t('templates.deleteConfirmMessage')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteModalOpen(false)}
            data-testid="button-cancel-delete"
          >
            {t('templates.cancelDelete')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
            data-testid="button-confirm-delete"
          >
            {deleteMutation.isPending ? t('templates.deleting') : t('templates.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
