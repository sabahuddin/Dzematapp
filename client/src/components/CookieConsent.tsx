import { useState, useEffect } from "react";
import { Box, Button, Typography, Paper, Link } from "@mui/material";
import { Cookie } from "lucide-react";

const CONSENT_KEY = "dzematapp_cookie_consent";
const CONSENT_VERSION = "1";

export type ConsentStatus = "pending" | "accepted" | "rejected";

export function getCookieConsent(): ConsentStatus {
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return "pending";
  try {
    const { status, version } = JSON.parse(stored);
    if (version !== CONSENT_VERSION) return "pending";
    return status as ConsentStatus;
  } catch {
    return "pending";
  }
}

export function setCookieConsent(status: "accepted" | "rejected") {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ status, version: CONSENT_VERSION }));
}

interface CookieConsentProps {
  onAccept?: () => void;
  onReject?: () => void;
}

export default function CookieConsent({ onAccept, onReject }: CookieConsentProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent === "pending") {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent("accepted");
    setVisible(false);
    onAccept?.();
  };

  const handleReject = () => {
    setCookieConsent("rejected");
    setVisible(false);
    onReject?.();
  };

  if (!visible) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: 2,
        display: "flex",
        justifyContent: "center",
      }}
      data-testid="cookie-consent-banner"
    >
      <Paper
        elevation={8}
        sx={{
          p: 3,
          maxWidth: 600,
          width: "100%",
          borderRadius: 3,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          gap: 2,
          bgcolor: "background.paper",
        }}
      >
        <Cookie size={32} color="#3949AB" style={{ flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
            Kolačići (Cookies)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Koristimo kolačiće za analitiku kako bismo poboljšali vaše iskustvo. 
            Vaši podaci su anonimni i sigurni.{" "}
            <Link href="/datenschutz.html" target="_blank" underline="hover" sx={{ color: "primary.main" }}>
              Politika privatnosti
            </Link>
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleReject}
            sx={{ borderRadius: 2 }}
            data-testid="button-reject-cookies"
          >
            Odbij
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleAccept}
            sx={{ borderRadius: 2 }}
            data-testid="button-accept-cookies"
          >
            Prihvati
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
