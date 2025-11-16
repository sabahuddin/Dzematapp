import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CertificateTemplatesPage from "./CertificateTemplatesPage";
import IssueCertificatesPage from "./IssueCertificatesPage";
import AllCertificatesPage from "./AllCertificatesPage";

export default function CertificatesPage() {
  const { t } = useTranslation(['certificates']);
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6" data-testid="text-page-title">Zahvalnice</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates" data-testid="tab-templates">
            Template
          </TabsTrigger>
          <TabsTrigger value="issue" data-testid="tab-issue">
            Izdaj zahvalnice
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            Sve zahvalnice
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="mt-6">
          <CertificateTemplatesPage hideHeader={true} />
        </TabsContent>
        
        <TabsContent value="issue" className="mt-6">
          <IssueCertificatesPage hideHeader={true} />
        </TabsContent>
        
        <TabsContent value="all" className="mt-6">
          <AllCertificatesPage hideHeader={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
