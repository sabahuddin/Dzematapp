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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Award, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";

interface UserCertificate {
  id: string;
  userId: string;
  templateId: string;
  recipientName: string;
  certificateImagePath: string;
  message: string | null;
  issuedById: string;
  issuedAt: Date | null;
  viewed: boolean | null;
}

interface AllCertificatesPageProps {
  hideHeader?: boolean;
}

export default function AllCertificatesPage({ hideHeader = false }: AllCertificatesPageProps = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedCertificate, setSelectedCertificate] = useState<UserCertificate | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certificateToDelete, setCertificateToDelete] = useState<UserCertificate | null>(null);

  const { data: certificates = [], isLoading } = useQuery<UserCertificate[]>({
    queryKey: ['/api/certificates/all'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return apiRequest(`/api/certificates/${certificateId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/all'] });
      toast({
        title: "Uspješno",
        description: "Zahvalnica je obrisana",
      });
      setDeleteModalOpen(false);
      setCertificateToDelete(null);
    },
    onError: () => {
      toast({
        title: "Greška",
        description: "Neuspješno brisanje zahvalnice",
        variant: "destructive",
      });
    },
  });

  const handleViewCertificate = (certificate: UserCertificate) => {
    setSelectedCertificate(certificate);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (certificate: UserCertificate) => {
    setCertificateToDelete(certificate);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (certificateToDelete) {
      deleteMutation.mutate(certificateToDelete.id);
    }
  };

  if (isLoading) {
    return <div className="p-8">Učitavanje...</div>;
  }

  return (
    <div className={hideHeader ? "" : "container mx-auto p-6"}>
      <Card>
        {!hideHeader && (
          <CardHeader>
            <CardTitle data-testid="text-page-title">Sve Zahvale</CardTitle>
            <CardDescription>
              Pregled svih izdanih zahvalnica
            </CardDescription>
          </CardHeader>
        )}
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-certificates">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nema zahvalnica</h3>
              <p className="text-muted-foreground">
                Još nisu izdane nijedne zahvalnice
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Primalac</TableHead>
                    <TableHead>Poruka</TableHead>
                    <TableHead>Datum izdavanja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((certificate) => (
                    <TableRow key={certificate.id} data-testid={`row-certificate-${certificate.id}`}>
                      <TableCell className="font-medium" data-testid={`text-recipient-${certificate.id}`}>
                        {certificate.recipientName}
                      </TableCell>
                      <TableCell className="max-w-md truncate" data-testid={`text-message-${certificate.id}`}>
                        {certificate.message || '-'}
                      </TableCell>
                      <TableCell data-testid={`text-date-${certificate.id}`}>
                        {certificate.issuedAt
                          ? format(new Date(certificate.issuedAt), 'dd.MM.yyyy')
                          : '-'}
                      </TableCell>
                      <TableCell data-testid={`text-status-${certificate.id}`}>
                        {certificate.viewed ? (
                          <span className="text-muted-foreground">Viđeno</span>
                        ) : (
                          <span className="text-primary font-medium">Novo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCertificate(certificate)}
                            data-testid={`button-view-${certificate.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(certificate)}
                            data-testid={`button-delete-${certificate.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle data-testid="text-modal-title">
              Zahvalnica - {selectedCertificate?.recipientName}
            </DialogTitle>
          </DialogHeader>
          {selectedCertificate && (
            <div className="space-y-4">
              <img
                src={selectedCertificate.certificateImagePath}
                alt={`Zahvalnica za ${selectedCertificate.recipientName}`}
                className="w-full h-auto rounded-lg border"
                data-testid="img-modal-certificate"
              />
              {selectedCertificate.message && (
                <div className="p-4 bg-muted rounded-lg" data-testid="text-modal-message">
                  <p className="text-sm font-medium mb-1">Poruka:</p>
                  <p className="text-sm">{selectedCertificate.message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent data-testid="dialog-delete-confirm">
          <DialogHeader>
            <DialogTitle>Potvrda brisanja</DialogTitle>
            <DialogDescription>
              Da li ste sigurni da želite obrisati zahvalnicu za {certificateToDelete?.recipientName}?
              Ova akcija se ne može poništiti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              data-testid="button-cancel-delete"
            >
              Odustani
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Brisanje..." : "Obriši"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
