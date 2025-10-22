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
  Divider,
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
  AccountBalance,
  EmojiEvents,
  WorkspacePremium,
  FolderOpen,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

const handlePrintPDF = () => {
  window.print();
};

export default function GuidePage() {
  const { user } = useAuth();

  const sections = [
    {
      icon: <Dashboard sx={{ fontSize: 32 }} />,
      title: 'Dashboard (Kontrolna ploča)',
      color: '#1976d2',
      description: 'Centralno mjesto gdje možete vidjeti pregled svih važnih informacija odjednom. Dashboard pruža brz uvid u aktivnosti džemata, nadolazeće događaje i vaše zadatke.',
      admin: 'Pregled statistike džemata: broj korisnika, nove obavijesti, nadolazeći događaji, aktivni zadaci. Prikaz nadolazećih događaja i kalendara.',
      member: 'Prikaz zadnje obavijesti, nadolazećeg događaja, kalendara, nepročitanih poruka i vaših sekcija.',
      all: 'Prikazuje današnje vaktije na vrhu stranice za brz pristup.',
    },
    {
      icon: <People sx={{ fontSize: 32 }} />,
      title: 'Korisnici',
      color: '#2e7d32',
      description: 'Modul za upravljanje članovima džemata. Ovdje se čuvaju svi podaci o članovima, njihovim ulogama, kategorijama i porodičnim vezama.',
      admin: 'Pregled svih članova džemata, kreiranje novih korisnika, uređivanje profila, dodjela uloga (Admin, Član IO, Član, Član porodice), dodjela korisnika u kategorije (Muškarci, Žene, Roditelji, Djeca), postavljanje statusa (aktivan/pasivan), upravljanje porodičnim vezama.',
      member: 'Pregled svog profila i uređivanje osnovnih podataka (ime, prezime, email, telefon, zanimanje, adresa).',
    },
    {
      icon: <Campaign sx={{ fontSize: 32 }} />,
      title: 'Obavijesti',
      color: '#ed6c02',
      description: 'Sistem za komunikaciju važnih informacija sa članovima džemata. Obavijesti se mogu kategorizovati i objavljivati odmah ili zakazati za kasnije.',
      admin: 'Kreiranje, uređivanje i brisanje obavijesti. Postavljanje kategorija (Džemat, IZBCH, IZ, Ostalo). Mogućnost odmah objavljivanja ili zakazivanja za kasnije. Upotreba bogatog uređivača teksta za formatiranje sadržaja.',
      member: 'Pregled svih objavljenih obavijesti. Notifikacije za nove obavijesti.',
      all: 'Gosti mogu vidjeti sve objavljene obavijesti bez prijavljivanja.',
    },
    {
      icon: <Event sx={{ fontSize: 32 }} />,
      title: 'Događaji',
      color: '#9c27b0',
      description: 'Kalendar i organizacija svih događaja u džematu. Članovi mogu vidjeti detalje događaja, potvrditi dolazak i dobiti podsjetnik. Uključuje i važne datume (Bajram, Ramadan, itd.).',
      admin: 'Kreiranje, uređivanje i brisanje događaja. Postavljanje datuma, vremena, lokacije i opisa. Dodavanje kategorija (Iftar, Mevlud, Edukacija, Sport, Humanitarno, Omladina). Pregled potvrda dolaska (RSVP). Upravljanje važnim datumima.',
      member: 'Pregled svih događaja, potvrđivanje dolaska (RSVP), notifikacije za nove događaje. Dodavanje događaja u lični kalendar.',
      all: 'Gosti mogu vidjeti sve objavljene događaje i potvrditi dolazak.',
    },
    {
      icon: <Workspaces sx={{ fontSize: 32 }} />,
      title: 'Sekcije (Radne grupe)',
      color: '#0097a7',
      description: 'Organizacija članova u radne grupe prema aktivnostima. Svaka sekcija može imati svoje zadatke i moderatore. Članovi mogu biti dodijeljeni u više sekcija istovremeno.',
      admin: 'Kreiranje i upravljanje sekcijama (npr. Administracija, Halal hrana, Iftar, Čišćenje). Postavljanje vidljivosti (Javno/Privatno). Dodjela moderatora. Kreiranje zadataka sa prioritetom i rokom. Dodjela zadataka jednom ili više korisnika odjednom (multi-select).',
      moderator: 'Moderatori sekcije mogu kreirati i upravljati zadacima unutar svoje sekcije. Mogu dodijeliti zadatak jednom članu, više članova odjednom, ili svim članovima. Svi dodijeljeni članovi vide zadatak i mogu ga označiti kao završen.',
      member: 'Pregled sekcija u kojima ste član. Prikaz svih zadataka dodijeljenih vama. Mogućnost označavanja zadataka kao završenih. Mogućnost zahtjeva za pristup privatnim sekcijama.',
    },
    {
      icon: <Mail sx={{ fontSize: 32 }} />,
      title: 'Poruke',
      color: '#c2185b',
      description: 'Interni sistem za slanje poruka od administracije ka članovima. Poruke mogu biti poslane svim članovima ili specifičnim kategorijama.',
      admin: 'Slanje poruka svim članovima ili određenim kategorijama (Muškarci, Žene, Roditelji, Djeca). Upotreba bogatog uređivača teksta.',
      member: 'Primanje i pregled poruka od administratora. Notifikacije za nove poruke.',
    },
    {
      icon: <QuestionAnswer sx={{ fontSize: 32 }} />,
      title: 'Pitanja za Imama',
      color: '#f57c00',
      description: 'Sistem koji omogućava članovima da postave pitanja imamu džemata. Pitanja se mogu arhivirati nakon što se odgovori na njih.',
      admin: 'Pregled svih pitanja članova. Arhiviranje pitanja nakon odgovora.',
      member: 'Postavljanje pitanja za Imama. Pregled svojih pitanja (aktivna i arhivirana). Notifikacije kada je pitanje arhivirano (što označava da je odgovoreno).',
    },
    {
      icon: <Assignment sx={{ fontSize: 32 }} />,
      title: 'Zahtjevi/Prijave',
      color: '#5e35b1',
      description: 'Centralno mjesto za podnošenje i upravljanje zahtjevima članova (materijalna pomoć, vjenčanje, rodenje, smrt, itd.). Uključuje i prijave za članstvo.',
      admin: 'Pregled svih zahtjeva članova (Razno, Materijalna pomoć, Smrt, Vjenčanje, Rodenje). Odobravanje ili odbijanje zahtjeva.',
      member: 'Podnošenje zahtjeva džematu sa opisom. Pregled statusa svojih zahtjeva (Na čekanju, Odobreno, Odbijeno).',
      all: 'Gosti mogu podnijeti prijavu za članstvo bez prijavljivanja.',
    },
    {
      icon: <ShoppingBag sx={{ fontSize: 32 }} />,
      title: 'DžematShop (Prodavnica)',
      color: '#c62828',
      description: 'Marketplace gdje članovi mogu prodavati ili kupovati artikle. Admin objavljuje proizvode, a članovi mogu kontaktirati prodavca direktno.',
      admin: 'Dodavanje proizvoda sa nazivom, cijenom (CHF), opisom i slikama. Uređivanje i brisanje proizvoda. Označavanje prodanih proizvoda kao "Završeno". Primanje notifikacija kada član klikne "Kupi".',
      member: 'Pregled svih aktivnih proizvoda. Kontaktiranje prodavca klikom na "Kupi". Notifikacije za nove proizvode.',
    },
    {
      icon: <Schedule sx={{ fontSize: 32 }} />,
      title: 'Vaktija (Prayer Times)',
      color: '#00796b',
      description: 'Prikaz islamskih vremena klanjanja (namaza) za svaki dan. Vaktije se mogu učitati automatski iz CSV fajla i prikazuju se po mjesecima.',
      admin: 'Učitavanje CSV fajla sa vaktijama (format SwissMosque.ch). Brisanje svih vaktija. Pregled mjesečnih vaktija.',
      member: 'Pregled mjesečnih vaktija. Današnja vaktija prikazana na vrhu Dashboard-a.',
      all: 'Svi korisnici mogu vidjeti današnju vaktiju na Dashboard-u i pristupiti mjesečnim vaktijama.',
    },
    {
      icon: <AccountBalance sx={{ fontSize: 32 }} />,
      title: 'Finansije',
      color: '#558b2f',
      description: 'Evidencija finansijskih priloga članova džemata. Uplate se kategorizuju po svrsi (članarina, donacija, vakuf, sergija) i mogu se povezati sa projektima.',
      admin: 'Dodavanje, uređivanje i brisanje uplata. Dodjela uplata članovima. Povezivanje uplata sa projektima. Filtriranje po kategorijama.',
      member: 'Pregled svojih uplata i historije priloga.',
    },
    {
      icon: <FolderOpen sx={{ fontSize: 32 }} />,
      title: 'Projekti',
      color: '#6a1b9a',
      description: 'Upravljanje većim projektima džemata sa ciljem prikupljanja sredstava. Svaki projekat ima ciljani iznos i prati se trenutni napredak.',
      admin: 'Kreiranje, uređivanje i brisanje projekata. Postavljanje ciljnog iznosa. Povezivanje finansijskih priloga sa projektima (automatsko ažuriranje iznosa).',
      member: 'Pregled svih projekata i njihovog napretka.',
    },
    {
      icon: <Timeline sx={{ fontSize: 32 }} />,
      title: 'Aktivnosti (Activity Log)',
      color: '#455a64',
      description: 'Evidencija svih aktivnosti članova u aplikaciji. Prati se ko je šta radio, kada i koliko bodova je zaradio.',
      admin: 'Pregled svih aktivnosti svih članova. Filtriranje po korisniku i tipu aktivnosti.',
      member: 'Pregled svojih aktivnosti i zarađenih bodova.',
    },
    {
      icon: <WorkspacePremium sx={{ fontSize: 32 }} />,
      title: 'Značke (Badges)',
      color: '#f9a825',
      description: 'Sistem nagrada za aktivne članove. Značke se dodjeljuju automatski ili ručno za postignuća i doprinos džematu.',
      admin: 'Kreiranje, uređivanje i brisanje znački. Definisanje uslova za dodjelu. Ručna dodjela znački članovima.',
      member: 'Pregled osvojenih znački na svom profilu.',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 32 }} />,
      title: 'Sistem Bodova',
      color: '#d84315',
      description: 'Gamifikacija koja nagrađuje aktivnost članova. Bodovi se dodjeljuju za prisustvo na događajima, završene zadatke i finansijske priloge.',
      admin: 'Postavljanje vrijednosti bodova za različite aktivnosti (prisustvo, zadaci, uplate). Pregled tabele rangiranja članova.',
      member: 'Prikupljanje bodova kroz aktivnosti. Pregled svog ukupnog broja bodova i pozicije na tabeli.',
    },
    {
      icon: <Settings sx={{ fontSize: 32 }} />,
      title: 'Postavke',
      color: '#616161',
      description: 'Konfiguracija osnovnih informacija o džematu i postavki aplikacije. Uređivanje profila i lozinke.',
      admin: 'Uređivanje osnovnih informacija o džematu (naziv, adresa, kontakt, email). Postavke livestream-a. Postavke sistema bodova. Uređivanje vlastite lozinke.',
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
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                bgcolor: '#1976d2',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Info sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a237e' }}>
                Vodič kroz DžematApp
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Kompletno uputstvo za korištenje aplikacije
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<PictureAsPdf />}
            onClick={handlePrintPDF}
            sx={{ 
              '@media print': { display: 'none' },
              textTransform: 'none',
              bgcolor: '#1976d2',
              '&:hover': { bgcolor: '#1565c0' }
            }}
            data-testid="button-download-pdf"
          >
            Preuzmi PDF
          </Button>
        </Box>
        <Card 
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
              O aplikaciji
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              DžematApp je sveobuhvatna web aplikacija za upravljanje džematom. Omogućava administratorima 
              da efikasno upravlja članovima, obavijestima, događajima, zadacima i drugim aspektima džemata, 
              dok članovi imaju pristup svim relevantnim informacijama i funkcionalnostima. Aplikacija koristi 
              moderan dizajn, intuitivan interfejs i podržava notifikacije u realnom vremenu.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Roles Section */}
      <Card sx={{ mb: 5, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1a237e' }}>
            Uloge korisnika
          </Typography>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            {roles.map((role, index) => (
              <Box key={role.name}>
                <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                  <Chip
                    label={role.name}
                    sx={{
                      bgcolor: role.color,
                      color: 'white',
                      fontWeight: 600,
                      minWidth: 180,
                      height: 32,
                      fontSize: '0.875rem',
                    }}
                  />
                  <Typography variant="body1" color="text.secondary" sx={{ flex: 1, pt: 0.5 }}>
                    {role.description}
                  </Typography>
                </Box>
                {index < roles.length - 1 && <Divider sx={{ mt: 2.5 }} />}
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Modules Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a237e' }}>
          Moduli aplikacije
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Detaljno objašnjenje svih funkcionalnosti aplikacije
        </Typography>
      </Box>

      {sections.map((section, index) => (
        <Accordion
          key={index}
          sx={{
            mb: 2.5,
            '&:before': { display: 'none' },
            borderRadius: '12px !important',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            '&.Mui-expanded': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              minHeight: 72,
              '&:hover': { 
                bgcolor: '#f8f9fa',
              },
              '& .MuiAccordionSummary-content': {
                my: 2,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Box
                sx={{
                  bgcolor: section.color,
                  borderRadius: 2,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                {section.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1a237e' }}>
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {section.description}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: '#fafafa', pt: 2, pb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {section.admin && (
                <Box>
                  <Chip
                    label="Admin"
                    size="small"
                    sx={{ 
                      bgcolor: '#d32f2f', 
                      color: 'white', 
                      mb: 1.5,
                      fontWeight: 600,
                      height: 26
                    }}
                  />
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {section.admin}
                  </Typography>
                </Box>
              )}
              {section.moderator && (
                <Box>
                  <Chip
                    label="Moderator"
                    size="small"
                    sx={{ 
                      bgcolor: '#f57c00', 
                      color: 'white', 
                      mb: 1.5,
                      fontWeight: 600,
                      height: 26
                    }}
                  />
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {section.moderator}
                  </Typography>
                </Box>
              )}
              {section.member && (
                <Box>
                  <Chip
                    label="Član"
                    size="small"
                    sx={{ 
                      bgcolor: '#388e3c', 
                      color: 'white', 
                      mb: 1.5,
                      fontWeight: 600,
                      height: 26
                    }}
                  />
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {section.member}
                  </Typography>
                </Box>
              )}
              {section.all && (
                <Box>
                  <Chip
                    label="Svi korisnici"
                    size="small"
                    sx={{ 
                      bgcolor: '#1976d2', 
                      color: 'white', 
                      mb: 1.5,
                      fontWeight: 600,
                      height: 26
                    }}
                  />
                  <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                    {section.all}
                  </Typography>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Additional Info */}
      <Card 
        sx={{ 
          mt: 5, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2.5 }}>
            Dodatne informacije
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              • <strong>Notifikacije:</strong> Aplikacija prikazuje crvene bedž indikatore za novi sadržaj u različitim modulima.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              • <strong>Automatsko osvježavanje:</strong> Notifikacije se automatski osvježavaju svakih 30 sekundi.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              • <strong>Format datuma:</strong> Svi datumi se prikazuju u formatu dd.mm.yyyy (evropski format).
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              • <strong>Valuta:</strong> Sve cijene u DžematShop i Finansije modulima su u CHF (švicarski franak).
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              • <strong>Gost pristup:</strong> Gosti mogu vidjeti obavijesti, događaje i vaktije bez prijavljivanja.
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.7, opacity: 0.95 }}>
              • <strong>Mobilni pristup:</strong> Aplikacija je prilagođena za korištenje na tablet uređajima.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
