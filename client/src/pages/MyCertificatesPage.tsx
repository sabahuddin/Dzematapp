import { useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, Download, Eye, Calendar } from "lucide-react";
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

export default function MyCertificatesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedCertificate, setSelectedCertificate] = useState<UserCertificate | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  // Fetch user's certificates
  const { data: certificates = [], isLoading } = useQuery<UserCertificate[]>({
    queryKey: ['/api/certificates/user'],
  });

  // Mark as viewed mutation
  const markViewedMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      return apiRequest(`/api/certificates/${certificateId}/viewed`, 'PATCH');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/certificates/unviewed-count'] });
    },
  });

  const handleViewCertificate = (certificate: UserCertificate) => {
    setSelectedCertificate(certificate);
    setViewModalOpen(true);
    
    // Mark as viewed if not already viewed
    if (!certificate.viewed) {
      markViewedMutation.mutate(certificate.id);
    }
  };

  const handleDownload = (certificate: UserCertificate) => {
    const link = document.createElement('a');
    link.href = certificate.certificateImagePath;
    link.download = `zahvalnica-${certificate.recipientName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Preuzimanje",
      description: "Zahvalnica je preuzeta",
    });
  };

  if (isLoading) {
    return <div className="p-8">Učitavanje...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-page-title">Moje Zahvale</CardTitle>
          <CardDescription>
            Pregled svih primljenih zahvalnica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-12" data-testid="text-no-certificates">
              <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nema zahvalnica</h3>
              <p className="text-muted-foreground">
                Još niste primili nijednu zahvalnicu
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certificates.map((certificate) => (
                <Card
                  key={certificate.id}
                  className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                    !certificate.viewed ? 'border-primary' : ''
                  }`}
                  onClick={() => handleViewCertificate(certificate)}
                  data-testid={`card-certificate-${certificate.id}`}
                >
                  <div className="relative">
                    {!certificate.viewed && (
                      <Badge
                        className="absolute top-2 right-2 z-10"
                        variant="default"
                        data-testid={`badge-new-${certificate.id}`}
                      >
                        Novo
                      </Badge>
                    )}
                    <img
                      src={certificate.certificateImagePath}
                      alt={`Zahvalnica za ${certificate.recipientName}`}
                      className="w-full h-48 object-cover"
                      data-testid={`img-certificate-${certificate.id}`}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3
                      className="font-semibold mb-2"
                      data-testid={`text-recipient-${certificate.id}`}
                    >
                      {certificate.recipientName}
                    </h3>
                    {certificate.message && (
                      <p
                        className="text-sm text-muted-foreground mb-3 line-clamp-2"
                        data-testid={`text-message-${certificate.id}`}
                      >
                        {certificate.message}
                      </p>
                    )}
                    <div
                      className="flex items-center text-xs text-muted-foreground mb-3"
                      data-testid={`text-date-${certificate.id}`}
                    >
                      <Calendar className="mr-1 h-3 w-3" />
                      {certificate.issuedAt
                        ? format(new Date(certificate.issuedAt), 'dd.MM.yyyy')
                        : 'N/A'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCertificate(certificate);
                        }}
                        data-testid={`button-view-${certificate.id}`}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Pogledaj
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(certificate);
                        }}
                        data-testid={`button-download-${certificate.id}`}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Certificate Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle data-testid="text-modal-title">
              Zahvalnica
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
                <div
                  className="p-4 bg-muted rounded-lg"
                  data-testid="text-modal-message"
                >
                  <p className="text-sm font-medium mb-1">Poruka:</p>
                  <p className="text-sm">{selectedCertificate.message}</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setViewModalOpen(false)}
                  data-testid="button-modal-close"
                >
                  Zatvori
                </Button>
                <Button
                  onClick={() => handleDownload(selectedCertificate)}
                  data-testid="button-modal-download"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Preuzmi
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
