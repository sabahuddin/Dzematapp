import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, PlayCircle, Calendar, Clock } from "lucide-react";

export default function LivestreamPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Livestream</h1>
        <p className="text-muted-foreground">
          Pratite LIVE dešavanja iz džemata
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Live Stream Card */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary animate-pulse" />
                LIVE Prenos
              </CardTitle>
              <Badge variant="destructive" className="animate-pulse">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 bg-white rounded-full"></span>
                  USKORO
                </span>
              </Badge>
            </div>
            <CardDescription>
              Video i audio prijenos dešavanja iz džemata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
              <div className="text-center space-y-4">
                <PlayCircle className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Live stream funkcionalnost će biti dostupna uskoro
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Ovdje će korisnici moći pratiti:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Dženaza namaza</li>
                <li>Predavanja i hutbe</li>
                <li>Specijalni događaji</li>
                <li>Teravija namaza (Ramazan)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Raspored Prijenosa
            </CardTitle>
            <CardDescription>
              Planirani live prijenosi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">Hutba - Džuma namaz</h4>
                    <p className="text-sm text-muted-foreground">Svaki petak</p>
                  </div>
                  <Badge variant="outline">Sedmično</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>13:00 - 13:30</span>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg opacity-60">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">Predavanje</h4>
                    <p className="text-sm text-muted-foreground">Po najavi</p>
                  </div>
                  <Badge variant="outline">Povremeno</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Vrijeme se objavljuje naknadno</span>
                </div>
              </div>

              <div className="text-center pt-4">
                <Button variant="outline" disabled>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Pokreni Livestream
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  (Funkcionalnost u razvoju)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>O Live Prijenosu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground">
              Livestream funkcionalnost omogućava svim članovima džemata i zainteresovanim osobama
              da prate važna dešavanja direktno sa bilo kojeg uređaja. Sistem će podržavati i video
              i audio prijenos, sa opcijama za arhiviranje važnih prijenosa.
            </p>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Planirane mogućnosti:</h4>
              <ul className="space-y-1">
                <li>✓ Live video i audio prijenos</li>
                <li>✓ Chat za gledaoce</li>
                <li>✓ Arhiva snimaka</li>
                <li>✓ Notifikacije o početku prijenosa</li>
                <li>✓ Višejezična podrška</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
