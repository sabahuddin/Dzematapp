import { useQuery } from "@tanstack/react-query";
import { Container, Box, Typography, Paper, Alert } from "@mui/material";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, PlayCircle, AlertCircle } from "lucide-react";
import type { OrganizationSettings } from "@shared/schema";

export default function LivestreamPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/organization-settings"]
  }) as { data: OrganizationSettings | undefined; isLoading: boolean };

  // Check if the content is an iframe embed or a URL
  const isEmbedCode = (content: string) => {
    return content.trim().startsWith('<iframe') || content.includes('<embed');
  };

  // Extract YouTube video ID from URL if it's a YouTube link
  const getYouTubeEmbedUrl = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
    }
    return null;
  };

  const renderLivestream = () => {
    if (!settings?.livestreamUrl) {
      return null;
    }

    const content = settings.livestreamUrl.trim();

    // If it's an embed code, render it directly
    if (isEmbedCode(content)) {
      return (
        <Box 
          sx={{ 
            aspectRatio: '16/9', 
            width: '100%',
            '& iframe': {
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }
          }}
          dangerouslySetInnerHTML={{ __html: content }}
          data-testid="livestream-embed"
        />
      );
    }

    // Try to extract YouTube embed URL
    const youtubeEmbed = getYouTubeEmbedUrl(content);
    if (youtubeEmbed) {
      return (
        <Box sx={{ aspectRatio: '16/9', width: '100%' }}>
          <iframe
            src={youtubeEmbed}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px'
            }}
            data-testid="livestream-youtube"
          />
        </Box>
      );
    }

    // If it's a regular URL, show it as a link
    return (
      <Box 
        sx={{ 
          aspectRatio: '16/9', 
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          borderRadius: '8px',
          p: 3
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <PlayCircle size={48} className="mx-auto mb-4 text-muted-foreground" />
          <Typography variant="body1" gutterBottom>
            Livestream je dostupan na vanjskoj platformi
          </Typography>
          <a 
            href={content} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            data-testid="livestream-external-link"
          >
            Otvori livestream
          </a>
        </Box>
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography>Učitavanje...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Radio size={32} />
          <Typography variant="h4" component="h1">
            Livestream
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Pratite LIVE dešavanja iz džemata
        </Typography>
      </Box>

      {settings?.livestreamEnabled && settings?.livestreamUrl ? (
        <>
          {settings.livestreamTitle && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge variant="destructive" className="animate-pulse">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-white rounded-full"></span>
                    UŽIVO
                  </span>
                </Badge>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {settings.livestreamTitle}
                </Typography>
              </Box>
            </Alert>
          )}
          
          <Paper sx={{ p: 3, mb: 3 }}>
            {renderLivestream()}
          </Paper>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Trenutno nema aktivnog livestream-a
            </CardTitle>
            <CardDescription>
              Livestream će biti dostupan kada administrator aktivira prenos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Box sx={{ 
              aspectRatio: '16/9', 
              bgcolor: 'grey.100', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3
            }}>
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <PlayCircle size={64} className="mx-auto mb-4 text-muted-foreground" />
                <Typography variant="h6" gutterBottom>
                  Livestream nije aktivan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ovdje će biti prikazan prenos kada administrator postavi livestream
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: '8px' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Ovdje možete pratiti:
              </Typography>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>Dženaza namaza</li>
                <li>Hutbe i predavanja</li>
                <li>Specijalne događaje</li>
                <li>Teravija namaza (Ramazan)</li>
              </ul>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardHeader>
            <CardTitle>O Live Prijenosu</CardTitle>
          </CardHeader>
          <CardContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Livestream funkcionalnost omogućava svim članovima džemata i zainteresovanim osobama
            da prate važna dešavanja direktno sa bilo kojeg uređaja.
          </Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: '8px', mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Podržane platforme:
            </Typography>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>✓ YouTube Live</li>
              <li>✓ Facebook Live</li>
              <li>✓ Twitch</li>
              <li>✓ Direktan embed kod</li>
              <li>✓ Ostale streaming platforme</li>
            </ul>
          </Box>
        </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
