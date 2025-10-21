import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Button,
} from '@mui/material';
import {
  ExpandMore,
  Dashboard,
  People,
  Campaign,
  Event,
  Workspaces,
  Mail,
  QuestionAnswer,
  Assignment,
  ShoppingBag,
  Schedule,
  Settings,
  Info,
  PictureAsPdf,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

const handlePrintPDF = () => {
  window.print();
};

export default function GuidePage() {
  const { user } = useAuth();

  const sections = [
    {
      icon: <Dashboard sx={{ color: '#1976d2' }} />,
      title: 'Dashboard (Kontrolna ploča)',
      admin: 'Pregled statistike džemata: broj korisnika, nove obavijesti, nadolazeći događaji, aktivni zadaci. Prikaz nadolazećih događaja i kalendara.',
      member: 'Prikaz zadnje obavijesti, nadolazećeg događaja, kalendara, nepročitanih poruka i vaših sekcija.',
      all: 'Prikazuje današnje vaktije na vrhu stranice za brz pristup.',
    },
    {
      icon: <People sx={{ color: '#1976d2' }} />,
      title: 'Korisnici',
      admin: 'Pregled svih članova džemata, kreiranje novih korisnika, uređivanje profila, dodjela uloga (Admin, Član IO, Član, Član porodice), dodjela korisnika u kategorije (Muškarci, Žene, Roditelji, Djeca), postavljanje statusa (aktivan/pasivan), upravljanje porodičnim vezama.',
      member: 'Pregled svog profila i uređivanje osnovnih podataka.',
    },
    {
      icon: <Campaign sx={{ color: '#2e7d32' }} />,
      title: 'Obavijesti',
      admin: 'Kreiranje, uređivanje i brisanje obavijesti. Postavljanje kategorija (Opća, Selam, Mevlud, Edukacija, Finansije). Mogućnost odmah objavljivanja ili zakazivanja za kasnije. Upotreba bogatog uređivača teksta za formatiranje sadržaja.',
      member: 'Pregled svih objavljenih obavijesti. Notifikacije za nove obavijesti.',
      all: 'Gosti mogu vidjeti sve objavljene obavijesti bez prijavljivanja.',
    },
    {
      icon: <Event sx={{ color: '#ed6c02' }} />,
      title: 'Događaji',
      admin: 'Kreiranje, uređivanje i brisanje događaja. Postavljanje datuma, vremena, lokacije i opisa. Dodavanje organizatora i kategorija (Edukacija, Društveni, Vjerski, Sportski, Humanitarni). Pregled potvrda dolaska (RSVP).',
      member: 'Pregled svih događaja, potvrđivanje dolaska (RSVP), notifikacije za nove događaje.',
      all: 'Gosti mogu vidjeti sve objavljene događaje i potvrditi dolazak.',
    },
    {
      icon: <Workspaces sx={{ color: '#0097a7' }} />,
      title: 'Sekcije',
      admin: 'Kreiranje i upravljanje sekcijama (npr. Halal hrana, Iftar, Čišćenje). Postavljanje vidljivosti (Javno/Privatno). Dodjela moderatora. Kreiranje zadataka sa prioritetom i rokom. Dodjela zadataka korisnicima.',
      moderator: 'Moderatori sekcije mogu kreirati i upravljati zadacima unutar svoje sekcije.',
      member: 'Pregled sekcija u kojima ste član. Prikaz dodijeljenih zadataka. Mogućnost zahtjeva za pristup privatnim sekcijama.',
    },
    {
      icon: <Mail sx={{ color: '#9c27b0' }} />,
      title: 'Poruke',
      admin: 'Slanje poruka svim članovima ili određenim kategorijama (Muškarci, Žene, Roditelji, Djeca).',
      member: 'Primanje i pregled poruka od administratora. Notifikacije za nove poruke.',
    },
    {
      icon: <QuestionAnswer sx={{ color: '#f57c00' }} />,
      title: 'Pitanja za Imama',
      admin: 'Pregled svih pitanja članova. Arhiviranje pitanja nakon odgovora.',
      member: 'Postavljanje pitanja za Imama. Pregled svojih pitanja (aktivna i arhivirana). Notifikacije kada je pitanje arhivirano (što označava da je odgovoreno).',
    },
    {
      icon: <Assignment sx={{ color: '#5e35b1' }} />,
      title: 'Zahtjevi/Prijave',
      admin: 'Pregled svih zahtjeva članova (Razno, Materijalna pomoć, Smrt, Vjenčanje, Rodenje). Odobravanje ili odbijanje zahtjeva.',
      member: 'Podnošenje zahtjeva džematu sa opisom. Pregled statusa svojih zahtjeva (Na čekanju, Odobreno, Odbijeno).',
      all: 'Gosti mogu podnijeti prijavu za članstvo bez prijavljivanja.',
    },
    {
      icon: <ShoppingBag sx={{ color: '#c62828' }} />,
      title: 'DžematShop',
      admin: 'Dodavanje proizvoda sa nazivom, cijenom (CHF), opisom i slikama. Uređivanje i brisanje proizvoda. Označavanje prodanih proizvoda kao "Završeno". Primanje notifikacija kada član klikne "Kupi".',
      member: 'Pregled svih aktivnih proizvoda. Kontaktiranje prodavca klikom na "Kupi". Notifikacije za nove proizvode.',
    },
    {
      icon: <Schedule sx={{ color: '#1976d2' }} />,
      title: 'Vaktija (Prayer Times)',
      admin: 'Učitavanje CSV fajla sa vaktijama (format SwissMosque.ch). Brisanje svih vaktija. Pregled mjesečnih vaktija.',
      member: 'Pregled mjesečnih vaktija. Današnja vaktija prikazana na vrhu Dashboard-a.',
      all: 'Svi korisnici mogu vidjeti današnju vaktiju na Dashboard-u i pristupiti mjesečnim vaktijama.',
    },
    {
      icon: <Settings sx={{ color: '#616161' }} />,
      title: 'Postavke',
      admin: 'Uređivanje osnovnih informacija o džematu (naziv, adresa, kontakt). Postavke livestream-a. Uređivanje vlastite lozinke.',
      member: 'Uređivanje vlastite lozinke.',
    },
  ];

  const roles = [
    {
      name: 'Admin',
      color: '#d32f2f',
      description: 'Puna kontrola nad aplikacijom. Može upravljati svim modulima, korisnicima i postavkama.',
    },
    {
      name: 'Član IO (Izvršni odbor)',
      color: '#f57c00',
      description: 'Viši nivo pristupa. Može vidjeti sve članove i ima proširene privilegije.',
    },
    {
      name: 'Član',
      color: '#388e3c',
      description: 'Standardni član džemata. Pristup osnovnim funkcijama aplikacije.',
    },
    {
      name: 'Član porodice',
      color: '#1976d2',
      description: 'Član porodice člana džemata. Ograničen pristup.',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Info sx={{ fontSize: 40, color: '#1976d2' }} />
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Vodič kroz DžematApp
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={handlePrintPDF}
            sx={{ 
              '@media print': { display: 'none' },
              textTransform: 'none'
            }}
            data-testid="button-download-pdf"
          >
            Preuzmi PDF
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          DžematApp je sveobuhvatna web aplikacija za upravljanje džematom. Omogućava administratorima 
          da efikasno upravlja članovima, obavijestima, događajima, zadacima i drugim aspektima džemata, 
          dok članovi imaju pristup svim relevantnim informacijama i funkcionalnostima.
        </Typography>
      </Box>

      {/* Roles Section */}
      <Card sx={{ mb: 4, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Uloge korisnika
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {roles.map((role) => (
              <Box key={role.name} sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                <Chip
                  label={role.name}
                  sx={{
                    bgcolor: role.color,
                    color: 'white',
                    fontWeight: 600,
                    minWidth: 140,
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  {role.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Modules Section */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Moduli aplikacije
      </Typography>

      {sections.map((section, index) => (
        <Accordion
          key={index}
          defaultExpanded
          sx={{
            mb: 2,
            '&:before': { display: 'none' },
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              '&:hover': { bgcolor: '#f5f5f5' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {section.icon}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {section.title}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {section.admin && (
                <Box>
                  <Chip
                    label="Admin"
                    size="small"
                    sx={{ bgcolor: '#d32f2f', color: 'white', mb: 1 }}
                  />
                  <Typography variant="body2">{section.admin}</Typography>
                </Box>
              )}
              {section.moderator && (
                <Box>
                  <Chip
                    label="Moderator"
                    size="small"
                    sx={{ bgcolor: '#f57c00', color: 'white', mb: 1 }}
                  />
                  <Typography variant="body2">{section.moderator}</Typography>
                </Box>
              )}
              {section.member && (
                <Box>
                  <Chip
                    label="Član"
                    size="small"
                    sx={{ bgcolor: '#388e3c', color: 'white', mb: 1 }}
                  />
                  <Typography variant="body2">{section.member}</Typography>
                </Box>
              )}
              {section.all && (
                <Box>
                  <Chip
                    label="Svi korisnici"
                    size="small"
                    sx={{ bgcolor: '#1976d2', color: 'white', mb: 1 }}
                  />
                  <Typography variant="body2">{section.all}</Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Additional Info */}
      <Card sx={{ mt: 4, bgcolor: '#e3f2fd' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Dodatne informacije
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2">
              • <strong>Notifikacije:</strong> Aplikacija prikazuje crvene bedž indikatore za novi sadržaj u različitim modulima.
            </Typography>
            <Typography variant="body2">
              • <strong>Automatsko osvježavanje:</strong> Notifikacije se automatski osvježavaju svakih 30 sekundi.
            </Typography>
            <Typography variant="body2">
              • <strong>Format datuma:</strong> Svi datumi se prikazuju u formatu dd.mm.yyyy.
            </Typography>
            <Typography variant="body2">
              • <strong>Valuta:</strong> Sve cijene u DžematShop modulu su u CHF (švicarski franak).
            </Typography>
            <Typography variant="body2">
              • <strong>Gost pristup:</strong> Gosti mogu vidjeti obavijesti, događaje i vaktije bez prijavljivanja.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
