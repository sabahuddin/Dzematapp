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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  roles: string[] | null;
  isAdmin: boolean;
}

interface CertificateTemplate {
  id: string;
  name: string;
  description: string | null;
  templateImagePath: string;
}

interface IssueCertificatesPageProps {
  hideHeader?: boolean;
}

export default function IssueCertificatesPage({ hideHeader = false }: IssueCertificatesPageProps = {}) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customMessage, setCustomMessage] = useState("");

  // Fetch users - SCOPED BY TENANT
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/users', currentUser?.tenantId],
  });

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<CertificateTemplate[]>({
    queryKey: ['/api/certificates/templates'],
  });

  // Issue certificates mutation
  const issueMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate) {
        throw new Error("Template nije izabran");
      }
      if (selectedUsers.size === 0) {
        throw new Error("Nije izabran nijedan korisnik");
      }

      return apiRequest('/api/certificates/issue', 'POST', {
        templateId: selectedTemplate,
        userIds: Array.from(selectedUsers),
        customMessage: customMessage || null,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Uspješno",
        description: `Izdato ${data.count} zahvalnic${data.count === 1 ? 'a' : 'e'}`,
      });
      setSelectedUsers(new Set());
      setSelectedTemplate("");
      setCustomMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Greška",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleIssue = () => {
    issueMutation.mutate();
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (usersLoading || templatesLoading) {
    return <div className="p-8">Učitavanje...</div>;
  }

  return (
    <div className={hideHeader ? "space-y-6" : "container mx-auto p-6 space-y-6"}>
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-section-title">Izbor Template-a</CardTitle>
          <CardDescription>
            Izaberite template za zahvalnicu koju želite izdati
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger data-testid="select-template">
                <SelectValue placeholder="Izaberite template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Poruka (opcionalno)</label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Unesite dodatnu poruku za sve primaoce..."
                rows={3}
                data-testid="input-custom-message"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle data-testid="text-users-title">Izbor Članova</CardTitle>
            <CardDescription>
              Izaberite članove kojima želite izdati zahvalnicu
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" data-testid="badge-selected-count">
              Izabrano: {selectedUsers.size}
            </Badge>
            <Button
              onClick={handleIssue}
              disabled={selectedUsers.size === 0 || !selectedTemplate || issueMutation.isPending}
              data-testid="button-issue-certificates"
            >
              <Award className="mr-2 h-4 w-4" />
              {issueMutation.isPending
                ? "Izdavanje..."
                : `Izdaj zahvalnice (${selectedUsers.size})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži članove..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                data-testid="input-search-users"
              />
            </div>
          </div>

          {/* Users Table */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-no-users">
              Nema pronađenih članova
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onCheckedChange={handleToggleAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead>Ime i Prezime</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    className={selectedUsers.has(user.id) ? "bg-muted/50" : ""}
                    data-testid={`row-user-${user.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => handleToggleUser(user.id)}
                        data-testid={`checkbox-user-${user.id}`}
                      />
                    </TableCell>
                    <TableCell data-testid={`text-name-${user.id}`}>
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell data-testid={`text-email-${user.id}`}>
                      {user.email || "-"}
                    </TableCell>
                    <TableCell data-testid={`text-roles-${user.id}`}>
                      {user.isAdmin ? (
                        <Badge variant="default">Admin</Badge>
                      ) : user.roles && user.roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role, idx) => (
                            <Badge key={idx} variant="outline">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
