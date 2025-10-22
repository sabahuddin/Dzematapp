import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Divider,
  Grid,
} from '@mui/material';
import {
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
      icon: <Dashboard sx={{ fontSize: 28 }} />,
      title: 'Dashboard (Kontrolna ploča)',
      color: '#1976d2',
      description: 'Dashboard je centralno mjesto aplikacije gdje svaki korisnik dobiva personalizovani pregled najvažnijih informacija. Ovo je prva stranica koju vidite nakon prijavljivanja i služi kao brzi pregled svih aktivnosti u džematu.',
      features: [
        'Pregled današnjih vaktija (vremena klanjanja) na vrhu stranice',
        'Prilagodljivi brzi pristup (Quick Access) sa do 8 omiljenih funkcija',
        'Prikaz najnovijih obavijesti sa mogućnošću brzog čitanja',
        'Kalendar nadolazećih događaja sa RSVP informacijama',
        'Notifikacije za nepročitane poruke i nove sadržaje',
      ],
      admin: 'Admin vidi proširenu statistiku: ukupan broj članova, broj aktivnih korisnika, statistiku obavijesti i događaja, aktivne zadatke u sekcijama, i trendove aktivnosti. Dashboard adminu omogućava brz uvid u sve aspekte džemata na jednom mjestu.',
      member: 'Članovi vide personalizovani dashboard sa svojim sekcijama, dodijeljenim zadacima, nepročitanim porukama, nadolazećim događajima i najnovijim obavijestima. Svaki član može prilagoditi svoj Quick Access widget sa najčešće korištenim funkcijama.',
    },
    {
      icon: <People sx={{ fontSize: 28 }} />,
      title: 'Korisnici',
      color: '#2e7d32',
      description: 'Modul za upravljanje svim članovima džemata i njihovim porodičnim vezama. Ovdje se čuvaju detaljni profili članova sa kontakt informacijama, kategorijama pripadnosti i historijom aktivnosti. Sistem podržava kreiranje porodičnih veza između članova.',
      features: [
        'Detaljni profili sa fotografijom, kontakt podacima i zanimanjem',
        'Sistem uloga: Admin, Član IO (Izvršni odbor), Član, Član porodice',
        'Kategorije članova: Muškarci, Žene, Roditelji, Djeca',
        'Porodične veze (supružnik, dijete, roditelj, brat, sestra)',
        'Status članstva: aktivan, pasivan, član porodice',
        'Praćenje datuma učlanjenja i razloga neaktivnosti',
      ],
      admin: 'Admin ima punu kontrolu nad korisnicima: može kreirati nove naloge, uređivati sve podatke (ime, prezime, email, telefon, adresu, zanimanje), dodjeljivati uloge i kategorije, postavljati status aktivnosti, kreirati porodične veze između članova. Admin vidi sve članove i može ih filtrirati po različitim kriterijima. Sistem također podržava bulk upload korisnika putem Excel fajla.',
      member: 'Svaki član može pregledati i urediti svoj profil - promijeniti svoje osnovne podatke kao što su ime, prezime, email, telefon, zanimanje i adresa. Članovi mogu vidjeti profile drugih članova (zavisno od postavki privatnosti) ali ne mogu mijenjati tuđe podatke niti dodjeljivati uloge.',
    },
    {
      icon: <Campaign sx={{ fontSize: 28 }} />,
      title: 'Obavijesti',
      color: '#ed6c02',
      description: 'Sistem za objavljivanje važnih informacija i komunikaciju sa članovima džemata. Obavijesti mogu biti opće ili kategorizovane, sa mogućnošću formatiranja teksta, dodavanja slika i planiranja objavljivanja.',
      features: [
        'Kategorizacija obavijesti: Džemat, IZBCH (Islamska zajednica BiH Švicarska), IZ (Islamska zajednica), Ostalo',
        'Bogati uređivač teksta za profesionalno formatiranje sadržaja',
        'Mogućnost odmah objavljivanja ili zakazivanja za određeni datum i vrijeme',
        'Status obavijesti: published (objavljeno), archived (arhivirano)',
        'Automatske notifikacije članovima za nove obavijesti',
        'Javno dostupne obavijesti - vidljive i gostima bez prijavljivanja',
      ],
      admin: 'Administratori kreiraju, uređuju i brišu obavijesti. Mogu koristiti bogati uređivač teksta za formatiranje (bold, italic, liste, naslovi), dodati kategorije, postaviti status i odlučiti hoće li obavijest biti odmah objavljena ili zakazana za kasnije. Admin vidi statistiku pregleda obavijesti.',
      member: 'Članovi mogu pregledati sve objavljene obavijesti, filtrirati ih po kategorijama i primaju notifikacije kada se objavi nova obavijest. Sistem prati koje obavijesti je član već pročitao i prikazuje broj novih obavijesti u navigaciji.',
      all: 'Gosti (neprijavljeni korisnici) mogu vidjeti sve objavljene obavijesti što omogućava informisanje šire zajednice bez potrebe za prijavljivanjem u sistem.',
    },
    {
      icon: <Event sx={{ fontSize: 28 }} />,
      title: 'Događaji',
      color: '#9c27b0',
      description: 'Kompletni sistem za upravljanje događajima u džematu sa kalendarom, RSVP funkcionalnostima i važnim datumima. Omogućava organizaciju iftara, mevluda, edukativnih programa, sportskih aktivnosti i drugih društvenih događaja.',
      features: [
        'Kalendar sa mjesečnim prikazom i označavanjem datuma događaja',
        'RSVP sistem sa mogućnošću prijavljivanja odraslih i djece',
        'Kategorije: Iftar, Mevlud, Edukacija, Sport, Humanitarno, Omladina, GAM',
        'Važni datumi (Bajram, Ramadan, itd.) koji se ponavljaju svake godine',
        'Automatsko slanje podsjentika prije događaja',
        'Mogućnost dodavanja događaja u lični kalendar',
        'Evidencija potvrđenih dolazaka sa brojem osoba',
      ],
      admin: 'Admin kreira događaje sa svim detaljima: naziv, opis, lokacija, datum i vrijeme, kategorija, maksimalan broj učesnika. Može vidjeti listu svih koji su potvrdili dolazak (RSVP), broj odraslih i djece. Admin upravlja važnim datumima koje sistem automatski prikazuje svake godine. Može slati podsjetike članovima prije događaja.',
      member: 'Članovi pregledaju nadolazeće i prošle događaje, mogu potvrditi svoj dolazak (RSVP) sa brojem odraslih i djece, primaju notifikacije za nove događaje i podsjetike. Svaki član može dodati događaj u svoj lični kalendar (Google Calendar, Apple Calendar, itd.). Sistem ne dozvoljava retroaktivno prijavljivanje na prošle događaje.',
      all: 'Gosti mogu vidjeti sve objavljene događaje što omogućava uključivanje šire zajednice. Gosti mogu potvrditi dolazak na javne događaje bez prijavljivanja.',
    },
    {
      icon: <Workspaces sx={{ fontSize: 28 }} />,
      title: 'Sekcije (Radne grupe)',
      color: '#0097a7',
      description: 'Sistem za organizaciju članova u radne grupe prema aktivnostima i područjima rada. Svaka sekcija može imati svoje zadatke, moderatore i članove. Sekcije mogu biti javne (vidljive svima) ili privatne (pristup samo odobrenim članovima).',
      features: [
        'Kreiranje neograničenog broja sekcija (npr. Administracija, Halal hrana, Iftar, Čišćenje)',
        'Javne i privatne sekcije sa kontrolom pristupa',
        'Sistem moderatora - članovi sa pravima upravljanja sekcijom',
        'Multi-user zadaci - dodjeljivanje zadatka većem broju članova odjednom',
        'Praćenje statusa zadataka: U toku, Na čekanju odobrenja, Završeno',
        'Prioriteti zadataka: Nizak, Srednji, Visok',
        'Rokovi za izvršenje zadataka',
        'Sistem bodova za završene zadatke',
      ],
      admin: 'Admin kreira sekcije, postavlja im naziv, opis i vidljivost (javno/privatno). Dodaje članove u sekcije i postavlja moderatore. Admin može kreirati zadatke sa prioritetom, rokom i opisom, te ih dodijeliti jednom članu, višestrukim članovima odjednom ili svim članovima sekcije. Admin odobrava zadatke koje članovi označe kao završene.',
      moderator: 'Moderatori sekcije imaju ista prava kao admin unutar svoje sekcije. Mogu kreirati zadatke, dodjeljivati ih članovima, odobravati završene zadatke i upravljati članstvom u sekciji. Moderatori ne mogu brisati sekciju ali mogu u potpunosti upravljati njenim zadacima.',
      member: 'Članovi vide sve sekcije u kojima su članovi, mogu pregledati zadatke dodijeljene njima, označiti zadatke kao završene (nakon čega čekaju admin/moderator odobrenje) i zaraditi bodove. Članovi mogu zatražiti pristup privatnim sekcijama, a admin/moderator odobrava zahtjeve.',
    },
    {
      icon: <Mail sx={{ fontSize: 28 }} />,
      title: 'Poruke',
      color: '#c2185b',
      description: 'Interni messaging sistem koji omogućava administraciji da šalje poruke članovima. Poruke mogu biti poslane svim članovima odjednom ili targetirane prema specifičnim kategorijama (Muškarci, Žene, Roditelji, Djeca).',
      features: [
        'Slanje poruka svim članovima ili specifičnim kategorijama',
        'Bogati uređivač teksta za formatiranje poruka',
        'Automatske notifikacije za nepročitane poruke',
        'Praćenje statusa poruka (pročitano/nepročitano)',
        'Arhiva svih poslanih i primljenih poruka',
        'Brojač nepročitanih poruka u navigaciji',
      ],
      admin: 'Administratori mogu kreirati nove poruke koristeći bogati uređivač teksta. Prilikom slanja biraju ciljnu grupu: svi članovi, ili specifične kategorije (samo muškarci, samo žene, samo roditelji, samo djeca). Admin vidi statistiku koliko članova je primilo i pročitalo poruku. Poruke se čuvaju u arhivi i mogu se pretraživati.',
      member: 'Članovi primaju poruke od administracije u svom inbox-u. Sistem automatski notificira članove o novim porukama pokazujući crveni bedž sa brojem nepročitanih. Članovi mogu čitati, arhivirati i pretraživati svoje poruke. Ne mogu slati poruke drugim članovima - ovo je jednosmjerni komunikacijski kanal od administracije ka članovima.',
    },
    {
      icon: <QuestionAnswer sx={{ fontSize: 28 }} />,
      title: 'Pitanja za Imama',
      color: '#f57c00',
      description: 'Privatni sistem koji omogućava članovima da postavljaju islamska pitanja imamu džemata. Svaki član može postaviti pitanje, pratiti njegov status i dobiti odgovor. Pitanja su privatna - svaki član vidi samo svoja pitanja.',
      features: [
        'Privatnost - svaki član vidi samo svoja pitanja',
        'Kategorije pitanja za lakšu organizaciju',
        'Status pitanja: Aktivno ili Arhivirano (odgovoreno)',
        'Notifikacije kada je pitanje arhivirano (odgovoreno)',
        'Historija svih postavljenih pitanja',
        'Brojač novih odgovora u navigaciji',
      ],
      admin: 'Admin (imam) vidi sva pitanja svih članova. Može pregledati aktivna pitanja, odgovoriti na njih (van aplikacije - telefonom, emailom ili uživo) i zatim arhivirati pitanje što automatski notificira člana da je odgovor dat. Admin može filtrirati pitanja po statusu i kategoriji, te vidjeti ko je postavio svako pitanje.',
      member: 'Članovi mogu postaviti novo pitanje sa detaljnim opisom. Primaju notifikaciju kada admin arhivira njihovo pitanje što označava da je odgovor dat. Svaki član vidi samo svoja pitanja - ne može vidjeti šta drugi članovi pitaju. Ovo osigurava privatnost pri postavljanju ličnih ili osjetljivih islamskih pitanja.',
    },
    {
      icon: <Assignment sx={{ fontSize: 28 }} />,
      title: 'Zahtjevi i Prijave',
      color: '#5e35b1',
      description: 'Centralni sistem za podnošenje i obradu različitih vrsta zahtjeva članova prema džematu. Uključuje zahtjeve za materijalnu pomoć, organizaciju vjenčanja, rođenja, smrti, kao i prijave za novo članstvo.',
      features: [
        'Tipovi zahtjeva: Materijalna pomoć, Vjenčanje, Rodenje, Smrt, Razno, Članstvo',
        'Status praćenje: Na čekanju, Odobreno, Odbijeno',
        'Detaljni opisi zahtjeva sa dodatnim informacijama',
        'Notifikacije o promjeni statusa zahtjeva',
        'Historija svih zahtjeva sa datumima i odlukama',
        'Javna prijava za članstvo - dostupna i gostima',
      ],
      admin: 'Admin vidi sve zahtjeve svih članova organizovane po tipovima i statusu. Može pregledati detalje svakog zahtjeva, odobriti ga ili odbiti sa napomenom. Sistem omogućava filtriranje zahtjeva po tipu, statusu i članu. Admin dobija notifikacije za nove zahtjeve i može vidjeti statistiku zahtjeva po mjesecima.',
      member: 'Članovi podnose zahtjeve džematu sa detaljnim opisom svoje situacije ili potrebe. Nakon podnošenja, mogu pratiti status svog zahtjeva (na čekanju, odobreno, odbijeno) i primaju notifikacije kada admin promijeni status. Članovi vide historiju svih svojih zahtjeva sa datumima podnošenja i odluka.',
      all: 'Gosti (neprijavljeni korisnici) mogu podnijeti prijavu za članstvo u džematu bez potrebe za postojećim nalogom. Unose svoje osnovne podatke (ime, prezime, email, telefon) i razlog prijave. Admin onda procesira prijavu i kreira korisnički nalog ako je prijava odobrena.',
    },
    {
      icon: <ShoppingBag sx={{ fontSize: 28 }} />,
      title: 'DžematShop (Prodavnica)',
      color: '#c62828',
      description: 'Interni marketplace gdje članovi mogu kupovati i prodavati artikle unutar džemata. Admin objavljuje artikle u ime članova, a zainteresovani kupci kontaktiraju prodavca direktno. Sve cijene su u CHF (švicarski franak).',
      features: [
        'Artikli sa fotografijama, opisom i cijenom u CHF',
        'Kategorije proizvoda za lakšu pretragu',
        'Status proizvoda: Aktivan ili Završeno (prodato)',
        'Kontakt informacije prodavca',
        'Notifikacije za nove artikle',
        'Galerija slika za svaki proizvod',
        'Filtriranje po kategorijama i statusu',
      ],
      admin: 'Admin dodaje nove proizvode sa svim detaljima: naziv, cijena (CHF), detaljan opis, fotografije (može više slika) i kontakt informacije prodavca. Može uređivati postojeće proizvode, mijenjati cijene, dodavati nove slike. Kada se artikal proda, admin ga označava kao "Završeno". Admin dobija notifikacije kada član klikne na dugme "Kupi" što označava interes.',
      member: 'Članovi pregledaju sve aktivne proizvode, mogu filtrirati po kategorijama i vidjeti detaljne opise sa slikama. Kada pronađu artikal koji ih zanima, klikaju na "Kupi" što otvara kontakt informacije prodavca. Član onda kontaktira prodavca direktno (telefonom, emailom ili uživo) da dogovore detalje kupovine. Sistem notificira članove o novim proizvodima.',
    },
    {
      icon: <Schedule sx={{ fontSize: 28 }} />,
      title: 'Vaktija (Prayer Times)',
      color: '#00796b',
      description: 'Prikaz islamskih vremena klanjanja (namaza) za svaki dan. Vaktije se mogu učitati automatski iz CSV fajla sa SwissMosque.ch web stranice i prikazuju se organizovano po mjesecima.',
      features: [
        'Automatsko učitavanje iz CSV fajla (format SwissMosque.ch)',
        'Mjesečni prikaz vaktija u accordion formatu',
        'Današnja vaktija istaknuta na Dashboard-u',
        'Prikaz svih pet dnevnih namaza: Zora, Izlazak sunca, Podne, Ikindija, Akšam, Jacija',
        'Mogućnost brisanja svih vaktija i ponovnog učitavanja',
        'Dostupnost svim korisnicima, uključujući goste',
      ],
      admin: 'Admin učitava vaktije putem CSV fajla koji se preuzima sa SwissMosque.ch stranice. Sistem automatski parsira fajl i učitava sve vaktije za godinu. Admin može obrisati sve postojeće vaktije i učitati nove (npr. na početku nove godine). Sistem je dizajniran da automatski prepoznaje format datuma i vremena iz CSV fajla.',
      member: 'Članovi pregledaju vaktije organizovane po mjesecima u accordion formatu (samo jedan mjesec može biti otvoren istovremeno za pregledniji prikaz). Današnja vaktija je automatski prikazana na vrhu Dashboard-a čim se korisnik prijavi, omogućavajući brz pristup najvažnijoj informaciji.',
      all: 'Svi korisnici (uključujući goste) imaju pristup vaktijama. To znači da i ljudi koji nisu članovi džemata mogu provjeriti vremena klanjanja, što čini informaciju javno dostupnom široj zajednici.',
    },
    {
      icon: <AccountBalance sx={{ fontSize: 28 }} />,
      title: 'Finansije',
      color: '#558b2f',
      description: 'Evidencija svih finansijskih priloga članova džemata. Sistem omogućava praćenje uplata, kategorizaciju po svrsi i povezivanje sa projektima. Sve transakcije se evidentiraju i čuvaju u bazi podataka.',
      features: [
        'Kategorije uplata: Članarina, Donacija, Vakuf, Sergija, Ostalo',
        'Povezivanje uplata sa projektima',
        'Automatsko ažuriranje iznosa projekta prilikom dodavanja uplate',
        'Filtriranje uplata po kategorijama, članovima i projektima',
        'Izvještaji sa sumama po kategorijama',
        'Sistem bodova - svaki CHF donosi bodove članu',
        'Historija svih transakcija sa datumima',
      ],
      admin: 'Admin dodaje uplate sa svim detaljima: član koji je uplatio, iznos u CHF, svrha (kategorija), datum uplate, opciono povezivanje sa projektom. Može uređivati postojeće uplate i brisati ih u slučaju greške. Admin vidi sve uplate svih članova, može filtrirati po kategorijama i izvući izvještaje. Sistem automatski dodjeljuje bodove članovima za njihove uplate.',
      member: 'Članovi mogu pregledati samo svoje uplate i njihovu historiju. Vide koliko su ukupno uplatili, po kojim kategorijama i koji projekti su podržani njihovim uplatama. Ne mogu dodavati, mijenjati ili brisati uplate - to može samo admin. Članovi vide bodove koje su zaradili kroz svoje finansijske priloge.',
    },
    {
      icon: <FolderOpen sx={{ fontSize: 28 }} />,
      title: 'Projekti',
      color: '#6a1b9a',
      description: 'Upravljanje većim projektima džemata koji zahtijevaju sakupljanje sredstava. Svaki projekat ima ciljani iznos, trenutni napredak i mogućnost povezivanja finansijskih priloga direktno sa projektom.',
      features: [
        'Kreiranje projekata sa ciljanim iznosom u CHF',
        'Automatsko praćenje trenutnog iznosa kroz povezane uplate',
        'Vizualni prikaz napretka (progress bar)',
        'Status projekata: Aktivan, Završen, Obustavljen',
        'Detaljan opis i svrha projekta',
        'Statistika donacija po projektu',
        'Javna vidljivost projekata',
      ],
      admin: 'Admin kreira nove projekte sa nazivom, detaljnim opisom, ciljnim iznosom i statusom. Kada član uplati novac, admin može povezati tu uplatu sa projektom, što automatski ažurira trenutni iznos projekta. Admin može uređivati projekte, mijenjati status i vidjeti listu svih donacija povezanih sa projektom. Sistem automatski računa procenat ispunjenja cilja.',
      member: 'Članovi pregledaju sve projekte džemata, vide napredak sakupljanja sredstava i mogu se informisati o svrsi projekta. Kada član uplati novac i admin ga poveže sa projektom, to se evidentira kao doprinos projektu i član dobija posebnu aktivnost u Activity Log-u. Članovi vide transparentan prikaz kako se njihovi prilozi koriste.',
    },
    {
      icon: <Timeline sx={{ fontSize: 28 }} />,
      title: 'Aktivnosti (Activity Log)',
      color: '#455a64',
      description: 'Kompletna evidencija svih aktivnosti članova u aplikaciji. Sistem automatski prati ko je šta uradio, kada i koliko bodova je zaradio. Ovo omogućava transparentnost i gamifikaciju kroz sistem nagrada.',
      features: [
        'Automatsko logovanje svih aktivnosti',
        'Tipovi aktivnosti: Završen zadatak, Prisustvo na događaju, Finansijski prilog, Doprinos projektu',
        'Dodjela bodova za različite aktivnosti',
        'Filtriranje aktivnosti po korisniku i tipu',
        'Prikaz datuma i vremena svake aktivnosti',
        'Povezivanje aktivnosti sa entitetima (zadatak, događaj, projekat)',
        'Izvještaji o najaktivnijim članovima',
      ],
      admin: 'Admin vidi kompletnu aktivnost svih članova. Može filtrirati po članu da vidi sve aktivnosti jedne osobe, ili po tipu aktivnosti da vidi npr. sve završene zadatke. Admin koristi ove podatke za izvještaje o angažmanu članova, praćenje trendova i nagrađivanje najaktivnijih članova. Može vidjeti statistiku aktivnosti po mjesecima.',
      member: 'Članovi vide svoju ličnu historiju aktivnosti - šta su sve radili u aplikaciji i koliko bodova su zaradili za svaku aktivnost. Ovo uključuje završene zadatke, prisustva na događajima, finansijske priloge i doprinose projektima. Članovi mogu pratiti svoj napredak i vidjeti koliko su aktivni u džematu.',
    },
    {
      icon: <WorkspacePremium sx={{ fontSize: 28 }} />,
      title: 'Značke (Badges)',
      color: '#f9a825',
      description: 'Sistem nagrada i priznanja za aktivne članove džemata. Značke se dodjeljuju automatski (na osnovu postignuća) ili ručno (od strane admina) za poseban doprinos zajednici.',
      features: [
        'Kreiranje znački sa nazivom, opisom i kriterijima',
        'Automatska dodjela na osnovu uslova (npr. 100 bodova, 10 završenih zadataka)',
        'Ručna dodjela od strane admina za posebna postignuća',
        'Prikaz osvojenih znački na profilu člana',
        'Različiti tipovi znački: Bronzana, Srebrna, Zlatna, Specijalna',
        'Javna vidljivost osvojenih znački',
        'Notifikacije kada član osvoji novu značku',
      ],
      admin: 'Admin kreira nove značke definišući njihov naziv, opis, uslove za osvajanje i tip. Može postaviti automatske kriterije (npr. "Osvoji 500 bodova" ili "Završi 20 zadataka") ili ručno dodijeliti značke članovima za poseban doprinos. Admin vidi statistiku ko je osvojio koje značke i može uređivati ili brisati postojeće značke.',
      member: 'Članovi automatski dobijaju značke kada ispune postavljene uslove. Primaju notifikaciju kada osvoje novu značku i mogu vidjeti sve svoje značke na profilu. Značke služe kao motivacija za aktivno učešće u životu džemata i vidljivo su priznanje za njihov doprinos zajednici.',
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 28 }} />,
      title: 'Sistem Bodova',
      color: '#d84315',
      description: 'Gamifikacijski sistem koji nagrađuje aktivnost članova kroz dodjeljivanje bodova. Bodovi se dodjeljuju automatski za različite aktivnosti i mogu se koristiti za rangiranje članova ili dodjelu posebnih privilegija.',
      features: [
        'Bodovi za prisustvo na događajima (RSVP)',
        'Bodovi za završene zadatke u sekcijama',
        'Bodovi za finansijske priloge (1 CHF = X bodova)',
        'Bodovi za doprinose projektima',
        'Prilagodljive vrijednosti bodova za svaku aktivnost',
        'Leaderboard (tabela rangiranja) članova',
        'Ukupan broj bodova vidljiv na profilu',
      ],
      admin: 'Admin u Postavkama bodova definiše koliko bodova se dodjeljuje za svaku aktivnost: koliko za prisustvo na događaju, koliko za završen zadatak, koliko bodova po CHF za finansijske priloge. Admin može u bilo kojem trenutku promijeniti ove vrijednosti. Sistem automatski primjenjuje nova pravila na buduće aktivnosti. Admin vidi leaderboard svih članova rangiranih po bodovima.',
      member: 'Članovi automatski sakupljaju bodove kroz svoje aktivnosti. Svaki put kada prisustvuju događaju, završe zadatak ili daju finansijski prilog, dobijaju određen broj bodova. Vide svoj ukupan broj bodova na profilu i poziciju na leaderboard-u. Bodovi služe kao motivacija za aktivnije učešće i daju vidljivost doprinosu svakog člana.',
    },
    {
      icon: <Settings sx={{ fontSize: 28 }} />,
      title: 'Postavke',
      color: '#616161',
      description: 'Konfiguracija osnovnih informacija o džematu, postavki aplikacije i ličnih podataka korisnika. Ovdje se nalaze sve administrativne postavke koje kontrolišu kako aplikacija funkcioniše.',
      features: [
        'Osnovni podaci o džematu (naziv, adresa, kontakt)',
        'Email i telefon za kontakt',
        'Postavke livestream-a (YouTube link)',
        'Konfiguracija sistema bodova',
        'Promjena lozinke',
        'Postavke notifikacija',
        'Logo i vizualni identitet',
      ],
      admin: 'Admin ima pristup svim postavkama: može uređivati informacije o džematu (naziv, adresu, grad, poštanski broj, telefon, email), postaviti YouTube link za livestream, konfigurisati vrijednosti bodova za različite aktivnosti, postaviti logo džemata. Admin može promijeniti svoju lozinku i postavke svog profila.',
      member: 'Članovi imaju ograničen pristup postavkama - mogu promijeniti svoju lozinku i urediti osnovne podatke svog profila (ime, prezime, email, telefon, zanimanje, adresa). Ne mogu mijenjati postavke aplikacije ili informacije o džematu.',
    },
  ];

  const roles = [
    {
      name: 'Admin',
      color: '#d32f2f',
      description: 'Administratori imaju potpunu kontrolu nad aplikacijom. Mogu upravljati svim modulima, kreirati i brisati sadržaj, dodjeljivati uloge, mijenjati postavke sistema. Admin vidi sve podatke svih članova i ima pristup svim izvještajima i statistikama.',
      permissions: 'Puna kontrola: korisnici, finansije, projekti, značke, bodovi, svi moduli',
    },
    {
      name: 'Član IO (Izvršni odbor)',
      color: '#f57c00',
      description: 'Članovi Izvršnog odbora imaju viši nivo pristupa od regularnih članova. Mogu vidjeti sve članove džemata i pristupiti proširenim informacijama. Ova uloga je namijenjena članovima upravnog odbora džemata.',
      permissions: 'Prošireni pregled: svi članovi, svi događaji, sve sekcije',
    },
    {
      name: 'Član',
      color: '#388e3c',
      description: 'Standardni članovi džemata imaju pristup osnovnim funkcijama aplikacije. Mogu vidjeti obavijesti, događaje, sekcije u kojima su članovi, svoje zadatke, poruke i vlastiti profil. Ovo je najčešća uloga koja se dodjeljuje većini članova.',
      permissions: 'Standardni pristup: dashboard, obavijesti, događaji, svoje sekcije, poruke, profil',
    },
    {
      name: 'Član porodice',
      color: '#1976d2',
      description: 'Ova uloga je namijenjena članovima porodice regularnih članova (supružnici, djeca). Imaju ograničen pristup aplikaciji - uglavnom mogu vidjeti obavijesti, događaje i osnovne informacije.',
      permissions: 'Ograničeni pristup: dashboard, obavijesti, događaji',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <style>
        {`
          @media print {
            body { 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @page {
              size: A4;
              margin: 2cm;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
            .section-block {
              page-break-inside: avoid;
            }
          }
        `}
      </style>

      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Info sx={{ fontSize: 48, color: '#1976d2' }} />
          <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a237e' }}>
            Vodič kroz DžematApp
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Kompletno uputstvo za korištenje aplikacije
        </Typography>
        <Button
          variant="contained"
          startIcon={<PictureAsPdf />}
          onClick={handlePrintPDF}
          className="no-print"
          sx={{ 
            textTransform: 'none',
            bgcolor: '#1976d2',
            '&:hover': { bgcolor: '#1565c0' }
          }}
          data-testid="button-download-pdf"
        >
          Preuzmi PDF
        </Button>
      </Box>

      {/* Introduction */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#1a237e' }}>
          O aplikaciji
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
          DžematApp je sveobuhvatna web aplikacija razvijena za modernu administraciju džemata. 
          Aplikacija omogućava efikasno upravljanje svim aspektima džemata na jednom mjestu - od 
          evidencije članova i finansija, preko organizacije događaja i sekcija, do komunikacije 
          sa članovima i praćenja njihove aktivnosti.
        </Typography>
        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
          Sistem koristi moderan dizajn, intuitivan interfejs i podržava notifikacije u realnom 
          vremenu. Aplikacija je dostupna sa bilo kojeg uređaja preko web pretraživača, a podaci 
          se sigurno čuvaju u bazi podataka sa automatskim backup-om.
        </Typography>
      </Box>

      {/* Roles */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#1a237e' }}>
          Uloge korisnika
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Aplikacija podržava četiri različite uloge sa različitim nivoima pristupa
        </Typography>
        {roles.map((role, index) => (
          <Box key={role.name} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Box
                sx={{
                  bgcolor: role.color,
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                  minWidth: 180,
                }}
              >
                {role.name}
              </Box>
            </Box>
            <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 0.5 }}>
              {role.description}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              <strong>Pristup:</strong> {role.permissions}
            </Typography>
            {index < roles.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
        ))}
      </Box>

      {/* Table of Contents */}
      <Box sx={{ mb: 5 }} className="page-break">
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, color: '#1a237e' }}>
          Sadržaj - Moduli aplikacije
        </Typography>
        <Grid container spacing={2}>
          {sections.map((section, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: section.color,
                    borderRadius: 1.5,
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    minWidth: 40,
                    minHeight: 40,
                  }}
                >
                  {section.icon}
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {section.title}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Sections - Full Width */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 4, color: '#1a237e' }} className="page-break">
        Detaljno objašnjenje modula
      </Typography>

      {sections.map((section, index) => (
        <Box key={index} className="section-block" sx={{ mb: 5 }}>
          {/* Section Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e' }}>
              {section.title}
            </Typography>
          </Box>

          {/* Description */}
          <Typography variant="body1" sx={{ lineHeight: 1.8, mb: 2 }}>
            {section.description}
          </Typography>

          {/* Features */}
          {section.features && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Ključne funkcionalnosti:
              </Typography>
              {section.features.map((feature, idx) => (
                <Typography key={idx} variant="body2" sx={{ mb: 0.8, lineHeight: 1.7, pl: 2 }}>
                  • {feature}
                </Typography>
              ))}
            </Box>
          )}

          <Divider sx={{ my: 2.5 }} />

          {/* Roles */}
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            {section.admin && (
              <Box>
                <Box
                  sx={{
                    bgcolor: '#d32f2f',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 600,
                    display: 'inline-block',
                    mb: 1,
                  }}
                >
                  Administratori
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {section.admin}
                </Typography>
              </Box>
            )}
            {section.moderator && (
              <Box>
                <Box
                  sx={{
                    bgcolor: '#f57c00',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 600,
                    display: 'inline-block',
                    mb: 1,
                  }}
                >
                  Moderatori
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {section.moderator}
                </Typography>
              </Box>
            )}
            {section.member && (
              <Box>
                <Box
                  sx={{
                    bgcolor: '#388e3c',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 600,
                    display: 'inline-block',
                    mb: 1,
                  }}
                >
                  Članovi
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {section.member}
                </Typography>
              </Box>
            )}
            {section.all && (
              <Box>
                <Box
                  sx={{
                    bgcolor: '#1976d2',
                    color: 'white',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 600,
                    display: 'inline-block',
                    mb: 1,
                  }}
                >
                  Svi korisnici (uključujući goste)
                </Box>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {section.all}
                </Typography>
              </Box>
            )}
          </Box>

          {index < sections.length - 1 && <Divider sx={{ mt: 4 }} />}
        </Box>
      ))}

      {/* Footer Info */}
      <Box sx={{ mt: 6, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }} className="page-break">
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Dodatne informacije i savjeti
        </Typography>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Notifikacije:</strong> Aplikacija prikazuje crvene bedž indikatore za novi 
            sadržaj u različitim modulima. Broj u bedžu pokazuje koliko novih stavki postoji.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Automatsko osvježavanje:</strong> Notifikacije i brojači se automatski 
            osvježavaju svakih 30 sekundi bez potrebe za ručnim osvježavanjem stranice.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Format datuma:</strong> Svi datumi u aplikaciji prikazuju se u evropskom 
            formatu dd.mm.yyyy (dan.mjesec.godina).
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Valuta:</strong> Sve cijene u DžematShop i Finansije modulima izražene su 
            u CHF (švicarski franak).
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Gost pristup:</strong> Određeni sadržaji (obavijesti, događaji, vaktije) 
            dostupni su i gostima bez prijavljivanja.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Sigurnost:</strong> Aplikacija koristi enkripciju podataka, sigurne lozinke 
            i redovne backup-e.
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            <strong>• Podrška:</strong> Za tehničku pomoć ili pitanja o korištenju aplikacije, 
            kontaktirajte administratora džemata.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
