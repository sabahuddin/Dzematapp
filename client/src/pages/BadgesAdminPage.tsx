import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BadgesPage from "./BadgesPage";
import AllPointsTab from "../components/AllPointsTab";
import IssuedBadgesTab from "../components/IssuedBadgesTab";

export default function BadgesAdminPage() {
  const { t } = useTranslation(['badges']);
  const [activeTab, setActiveTab] = useState("badges");

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6" data-testid="text-page-title">Značke</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges" data-testid="tab-badges">
            Značke
          </TabsTrigger>
          <TabsTrigger value="points" data-testid="tab-points">
            Svi bodovi
          </TabsTrigger>
          <TabsTrigger value="issued" data-testid="tab-issued">
            Izdate značke
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="badges" className="mt-6">
          <BadgesPage hideHeader={true} />
        </TabsContent>
        
        <TabsContent value="points" className="mt-6">
          <AllPointsTab />
        </TabsContent>
        
        <TabsContent value="issued" className="mt-6">
          <IssuedBadgesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
