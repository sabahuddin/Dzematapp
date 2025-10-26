import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

export default function CertificateTemplatesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      description: "",
      textPositionX: 400,
      textPositionY: 300,
      fontSize: 48,
      fontColor: "#000000",
      textAlign: "center",
    },
  });

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery<CertificateTemplate[]>({
    queryKey: ['/api/certificates/templates'],
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      if (!selectedFile) {
        throw new Error("Template image is required");
      }

      const formData = new FormData();
      formData.append('templateImage', selectedFile);
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
        title: "Uspješno",
        description: "Template je kreiran",
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TemplateFormData> }) => {
      return apiRequest(`/api/certificates/templates/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({
        title: "Uspješno",
        description: "Template je ažuriran",
      });
      handleCloseModal();
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/certificates/templates/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/templates'] });
      toast({
        title: "Uspješno",
        description: "Template je obrisan",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenModal = (template?: CertificateTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setPreviewUrl(template.templateImagePath);
      form.reset({
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
      form.reset();
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTemplate(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    form.reset();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'image/png') {
        toast({
          title: "Greška",
          description: "Dozvoljen je samo PNG format",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (data: TemplateFormData) => {
    if (selectedTemplate) {
      // Update existing template (without file upload)
      updateMutation.mutate({ id: selectedTemplate.id, data });
    } else {
      // Create new template (with file upload)
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Da li ste sigurni da želite obrisati ovaj template?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-8">Učitavanje...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle data-testid="text-page-title">Zahvalnice - Templatei</CardTitle>
            <CardDescription>
              Upravljajte template-ima za zahvalnice
            </CardDescription>
          </div>
          <Button
            onClick={() => handleOpenModal()}
            className="ml-auto"
            data-testid="button-add-template"
          >
            <Plus className="mr-2 h-4 w-4" />
            Dodaj novi template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-templates">
              Nema kreiranih template-a
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slika</TableHead>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Opis</TableHead>
                  <TableHead>Font</TableHead>
                  <TableHead>Pozicija</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell>
                      <img
                        src={template.templateImagePath}
                        alt={template.name}
                        className="w-20 h-14 object-cover rounded"
                        data-testid={`img-template-${template.id}`}
                      />
                    </TableCell>
                    <TableCell data-testid={`text-name-${template.id}`}>
                      {template.name}
                    </TableCell>
                    <TableCell data-testid={`text-description-${template.id}`}>
                      {template.description || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-font-${template.id}`}>
                      {template.fontSize}px {template.fontColor}
                    </TableCell>
                    <TableCell data-testid={`text-position-${template.id}`}>
                      X:{template.textPositionX} Y:{template.textPositionY}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(template)}
                          data-testid={`button-edit-${template.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          data-testid={`button-delete-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-modal-title">
              {selectedTemplate ? "Uredi template" : "Dodaj novi template"}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate
                ? "Ažurirajte informacije o template-u"
                : "Kreiranje novog template-a za zahvalnice"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {/* File Upload */}
              {!selectedTemplate && (
                <div className="space-y-2">
                  <FormLabel>Template slika (PNG)</FormLabel>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="template-upload"
                      data-testid="input-template-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('template-upload')?.click()}
                      data-testid="button-upload-file"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? "Promeni sliku" : "Izaberi sliku"}
                    </Button>
                    {selectedFile && (
                      <span className="text-sm text-muted-foreground">
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mt-2 max-w-full h-48 object-contain border rounded"
                      data-testid="img-preview"
                    />
                  )}
                </div>
              )}

              {selectedTemplate && previewUrl && (
                <div>
                  <FormLabel>Trenutna slika</FormLabel>
                  <img
                    src={previewUrl}
                    alt="Current template"
                    className="mt-2 max-w-full h-48 object-contain border rounded"
                    data-testid="img-current-template"
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naziv</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opis (opcionalno)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="textPositionX"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pozicija X</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-position-x"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="textPositionY"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pozicija Y</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-position-y"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fontSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veličina fonta</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-font-size"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fontColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boja fonta</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="w-20"
                            data-testid="input-font-color-picker"
                          />
                          <Input
                            type="text"
                            {...field}
                            className="flex-1"
                            data-testid="input-font-color"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="textAlign"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poravnanje teksta</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-text-align">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="left">Lijevo</SelectItem>
                        <SelectItem value="center">Centar</SelectItem>
                        <SelectItem value="right">Desno</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  data-testid="button-cancel"
                >
                  Otkaži
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Čuvanje..."
                    : "Sačuvaj"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
