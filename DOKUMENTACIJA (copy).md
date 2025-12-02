# DžematApp - Kompletna Dokumentacija

## Sadržaj
1. [Pregled Projekta](#pregled-projekta)
2. [Arhitektura Sistema](#arhitektura-sistema)
3. [Instalacija i Setup](#instalacija-i-setup)
4. [Autentifikacija i Autorizacija](#autentifikacija-i-autorizacija)
5. [Moduli i Funkcionalnosti](#moduli-i-funkcionalnosti)
6. [Baza Podataka](#baza-podataka)
7. [API Reference](#api-reference)
8. [Frontend Komponente](#frontend-komponente)
9. [Internacionalizacija](#internacionalizacija)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Pregled Projekta

**DžematApp** je Progressive Web App (PWA) za upravljanje džematom (islamskom zajednicom) sa mobile-first pristupom. Aplikacija omogućava administratorima i članovima efikasnu komunikaciju, organizaciju i praćenje aktivnosti. Dizajnirana je da pruža native-app-like iskustvo sa smooth scrolling-om, fixed navigacijom i offline podrškom.

### Glavne Karakteristike

- **Upravljanje korisnicima** - Kreiranje, uređivanje i administracija članova
- **Obavijesti** - Objavljivanje važnih informacija za zajednicu
- **Događaji** - Organizacija i praćenje događaja sa RSVP funkcijom
- **Sekcije (radne grupe)** - Organizacija timova sa zadacima i bodovima
- **Zadaci** - Dodjeljivanje i praćenje zadataka sa sistemom bodova
- **Poruke** - Interna komunikacija između članova
- **Pitaj Imama** - Anonimno postavljanje pitanja imamu
- **Shop** - Prodaja proizvoda sa galerijom slika
- **Vaktija** - Prikaz vremena namaza sa CSV upload funkcijom
- **Finansije** - Praćenje uplata članova sa vezom na projekte
- **Projekti** - Upravljanje džematskim projektima
- **Zahvale (Certifikati)** - Izdavanje personalizovanih zahvalnica
- **Dokumenti** - Dijeljenje važnih dokumenata
- **Livestream** - Integracija sa streaming platformama
- **Badževi** - Sistem priznanja za aktivne članove

### Tehnologije

**Frontend:**
- React 18 sa TypeScript
- Material-UI (MUI) za dizajn
- shadcn/ui komponente
- Tailwind CSS za stilizovanje
- Wouter za routing
- TanStack Query (React Query) za server state
- i18next za višejezičnost (BS/DE/EN/AL)
- Progressive Web App (PWA) konfiguracija
- Custom hooks za iOS bounce prevention

**Backend:**
- Node.js sa Express
- TypeScript
- Drizzle ORM
- PostgreSQL (Neon serverless)
- Session-based autentifikacija
- Sharp za procesiranje slika
- Canvas za generisanje certifikata

---

## Arhitektura Sistema

### Struktura Direktorijuma

```
├── client/                  # Frontend aplikacija
│   ├── src/
│   │   ├── components/      # React komponente
│   │   │   ├── layout/      # Layout komponente (Sidebar, AppBar)
│   │   │   └── ui/          # shadcn/ui komponente
│   │   ├── contexts/        # React Context (AuthContext)
│   │   ├── hooks/           # Custom hooks
│   │   ├── i18n/            # Internacionalizacija
│   │   │   └── locales/     # Prijevodi (bs, de, en)
│   │   ├── lib/             # Utility biblioteke
│   │   ├── pages/           # Stranice aplikacije
│   │   └── App.tsx          # Glavna aplikacija
│   └── index.html
├── server/                  # Backend aplikacija
│   ├── routes.ts            # API rute
│   ├── storage.ts           # Storage interface i implementacija
│   ├── certificateService.ts # Servis za generisanje certifikata
│   ├── index.ts             # Server entry point
│   └── vite.ts              # Vite integracija
├── shared/                  # Dijeljeni tipovi
│   └── schema.ts            # Drizzle schema i Zod validacija
├── db/                      # Migracije baze
└── public/                  # Statički fajlovi
    └── uploads/             # Upload-ovani fajlovi
```

### Arhitekturni Principi

1. **Mobile-First Design** - Prioritet na mobilnom iskustvu sa native-app-like performansama
2. **Separation of Concerns** - Frontend i backend su jasno odvojeni
3. **Type Safety** - TypeScript kroz cijeli stack
4. **Schema-First** - Drizzle schema definiše strukturu podataka
5. **API-First** - RESTful API za svu komunikaciju
6. **Session-Based Auth** - Bezbjedna autentifikacija sa session storage
7. **PWA Support** - Offline funkcionalnost i instalabilnost na uređaje
8. **Responsive Design** - Prilagođen za smartphone, tablet i desktop

### Mobile-First & PWA Dizajn

**DžematApp** koristi napredne mobile-first tehnike za pružanje native-app iskustva:

#### Fixed Layout System
- **TopBar**: 64px visina, position: fixed
- **BottomNavigation**: 88px visina, position: fixed
- **Content Area**: Scrollable sadržaj između TopBar-a i BottomNavigation-a
- **Padding**: Top 80px (64px + 16px), Bottom 104px (88px + 16px), Horizontal 16px

#### iOS Bounce Prevention
Aplikacija koristi custom `useEdgeLockScroll` hook koji implementira edge-offset clamping strategiju:
- Održava scroll poziciju između [1, maxScroll-1]
- Sprječava Safari viewport rubber-banding efekat
- Koristi touchstart/scroll guards
- Dinamički injektira filler kad je sadržaj kraći od viewport-a
- **Rezultat**: Zero bounce/overscroll - sadržaj se čisto zaustavlja na granicama

#### Auto-Scroll Reset
Automatski reset scroll pozicije na svaku promjenu rute za konzistentnu navigaciju.

#### Branding & Visual Identity
- **Logo**: Transparentni SVG logo (`DzematLogo.tsx`) sa polumjesecom i knjigom u plavoj boji (#2196F3)
- **App Icons**: Kompletna kolekcija PNG ikona za sve veličine (72px-512px)
- **Tema**: Light green (#81c784) kao primarna boja, #e8f5e9 kao background
- **Design Details**: 1px borderi, 12px border radius kroz cijelu aplikaciju

#### PWA Konfiguracija
- **Manifest**: Kompletan `manifest.json` sa svim potrebnim ikonama
- **Apple Touch Icons**: Optimizovano za iPhone Home Screen (180x180, 152x152)
- **Meta Tags**: Apple-mobile-web-app-capable, theme-color, itd.
- **Offline Support**: Service worker sa caching strategijom
- **Installability**: Može se dodati na home screen iOS i Android uređaja

#### Spacing System
Konzistentan spacing kroz cijelu aplikaciju:
```typescript
MOBILE_APP_BAR_HEIGHT = 64px
BOTTOM_NAV_HEIGHT = 88px
MOBILE_CONTENT_PADDING = 16px
```

---

## Instalacija i Setup

### Preduvjeti

- Node.js 18+
- PostgreSQL baza podataka
- Neon serverless database (preporučeno)

### Instalacija

```bash
# 1. Instalacija dependencies
npm install

# 2. Postavljanje environment varijabli
# DATABASE_URL se automatski postavlja u Replit okruženju

# 3. Pokretanje aplikacije
npm run dev
```

### Environment Varijable

Aplikacija koristi sljedeće environment varijable:

```env
# Baza podataka (automatski postavljeno)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Node okruženje
NODE_ENV=development
```

### Inicijalna Konfiguracija

Pri prvom pokretanju:

1. Kreirajte admin korisnika kroz registraciju
2. Prvi korisnik automatski postaje admin
3. Podesite organizacijske podatke u "Org. podaci"
4. Upload-ujte logo organizacije
5. Konfigurišite brze linkove za dashboard

---

## Autentifikacija i Autorizacija

### Autentifikacija

Aplikacija koristi **session-based authentication** sa sljedećim karakteristikama:

- Username/password prijava
- Session storage u PostgreSQL (connect-pg-simple)
- Automatsko zaključavanje nakon neaktivnosti
- Bezbjedni HTTP-only cookies

### Korisničke Role

Postoje **4 korisničke role**:

1. **Admin** - Puni pristup svim funkcionalnostima
2. **Član IO** (Executive Board Member) - Može odobravati prijedloge moderatora
3. **Član** (Member) - Osnovni član sa pristupom javnim sadržajima
4. **Član porodice** (Family Member) - Članovi porodice sa ograničenim pristupom

### Sistem Dozvola

```typescript
// Primjer dozvola po roli
Admin:
  - Sve operacije (CRUD)
  - Upravljanje korisnicima
  - Kreiranje obavijesti/događaja
  - Izdavanje certifikata
  - Pristup finansijskim izvještajima

Član IO:
  - Odobravanje moderatorskih prijedloga
  - Pregled svih sekcija
  - Dodjeljivanje zadataka u sekcijama

Član:
  - Pregled javnih sadržaja
  - Učešće u događajima (RSVP)
  - Slanje poruka
  - Pristup svojim finansijama
  - Primanje certifikata

Član porodice:
  - Ograničen pristup javnim sadržajima
```

### Middleware

```typescript
// requireAuth - provjerava da li je korisnik prijavljen
app.get('/api/protected', requireAuth, (req, res) => {
  // req.user je dostupan
});

// requireAdmin - provjerava admin privilegije
app.post('/api/admin-only', requireAdmin, (req, res) => {
  // Samo admin može pristupiti
});
```

---

## Moduli i Funkcionalnosti

### 1. Dashboard

**Putanja:** `/dashboard`  
**Pristup:** Svi prijavljeni korisnici

**Funkcionalnosti:**
- Prikaz statistike (broj korisnika, obavijesti, događaja, uplata)
- Brzi pristup najčešće korištenim stranicama (max 8)
- Pregled nadolazećih događaja
- Lista aktivnih zadataka
- Log nedavnih aktivnosti
- Današnja vaktija
- Prilagodljiv brzi pristup

**API Endpoints:**
- `GET /api/statistics` - Dobijanje statistike
- `GET /api/activities` - Nedavne aktivnosti
- `GET /api/events` - Nadolazeći događaji
- `GET /api/tasks/dashboard` - Aktivni zadaci
- `GET /api/prayer-times/today` - Današnja vaktija

---

### 2. Korisnici

**Putanja:** `/users` (admin) ili `/users` (član - samo svoj profil)  
**Pristup:** Svi prijavljeni (admin vidi sve, članovi samo sebe)

**Funkcionalnosti:**
- Kreiranje novih korisnika (admin)
- Uređivanje profila
- Postavljanje uloga i dozvola
- Dodjeljivanje moderatora sekcija
- Resetovanje lozinke (admin)
- Filtriranje i pretraga korisnika

**Polja korisnika:**
- Ime i prezime
- Korisničko ime (unique)
- Email
- Telefon
- Uloga (Admin, Član IO, Član, Član porodice)
- Aktivan/Neaktivan status
- Broj bodova (automatski obračun)

**API Endpoints:**
- `GET /api/users` - Lista svih korisnika
- `GET /api/users/:id` - Pojedinačni korisnik
- `POST /api/users` - Kreiranje korisnika (admin)
- `PATCH /api/users/:id` - Ažuriranje korisnika
- `DELETE /api/users/:id` - Brisanje korisnika (admin)
- `GET /api/user-points/:userId` - Bodovi korisnika

---

### 3. Obavijesti (Announcements)

**Putanja:** `/announcements`  
**Pristup:** Svi (kreiranje samo admin)  
**Guest pristup:** ✅ Da

**Funkcionalnosti:**
- Kreiranje i objavljivanje obavijesti
- Markdown editor za formatiranje teksta
- Prioritet obavijesti (obična, važna, hitna)
- Prikaz autora i datuma
- Filtriranje po prioritetu
- Prikvačivanje važnih obavijesti

**Tipovi prioriteta:**
- `obična` - Standardna obavijest (plava)
- `važna` - Važna obavijest (narančasta)
- `hitna` - Hitna obavijest (crvena)

**API Endpoints:**
- `GET /api/announcements` - Lista obavijesti
- `POST /api/announcements` - Kreiranje (admin)
- `PATCH /api/announcements/:id` - Ažuriranje (admin)
- `DELETE /api/announcements/:id` - Brisanje (admin)

---

### 4. Događaji (Events)

**Putanja:** `/events`  
**Pristup:** Svi (kreiranje samo admin)  
**Guest pristup:** ✅ Da

**Funkcionalnosti:**

#### 4.1 Kalendar Događaja
- Vizualni kalendar sa svim događajima
- Klik na događaj otvara detalje
- Navigacija po mjesecima

#### 4.2 Lista Događaja
- Tabela svih predstojećih i prošlih događaja
- Filtriranje po datumu
- Pretraga po nazivu
- Sortiranje

#### 4.3 RSVP (Prijava za Događaj)
- Članovi mogu potvrditi dolazak
- Unos broja odraslih i djece
- Praćenje ukupnog broja prijavljenih
- Admin vidi sve prijave

#### 4.4 Važni Datumi
- Posebna sekcija za važne datume (Ramazan, Kurban Bajram, itd.)
- Bez RSVP funkcije
- Prikazuje se posebno u kalendaru

**API Endpoints:**
- `GET /api/events` - Lista događaja
- `POST /api/events` - Kreiranje (admin)
- `PATCH /api/events/:id` - Ažuriranje (admin)
- `DELETE /api/events/:id` - Brisanje (admin)
- `POST /api/events/:id/rsvp` - RSVP prijava
- `GET /api/events/:id/rsvps` - Lista prijava za događaj
- `DELETE /api/event-rsvps/:id` - Otkazivanje prijave
- `GET /api/important-dates` - Važni datumi
- `POST /api/important-dates` - Kreiranje (admin)

---

### 5. Sekcije (Work Groups)

**Putanja:** `/tasks` (admin) ili `/sections` (članovi)  
**Pristup:** Svi

**Funkcionalnosti:**

#### 5.1 Upravljanje Sekcijama
- Kreiranje radnih grupa (npr. Održavanje, Mladi, Žene)
- Dodavanje moderatora sekcija
- Javne/Privatne sekcije
- Dodjeljivanje članova u sekcije

#### 5.2 Vidljivost Sekcija
- **Javna (javna)** - Svi mogu vidjeti i pristupiti
- **Privatna (privatna)** - Samo članovi sekcije mogu vidjeti

#### 5.3 Zahtjevi za Pristup
- Članovi mogu zatražiti pristup privatnim sekcijama
- Admin/moderator odobrava zahtjeve

#### 5.4 Moderatori
- Admin može postaviti moderatore za svaku sekciju
- Moderatori mogu kreirati zadatke
- Moderatori mogu kreirati prijedloge za odobrenje

**API Endpoints:**
- `GET /api/work-groups` - Lista sekcija
- `POST /api/work-groups` - Kreiranje (admin)
- `PATCH /api/work-groups/:id` - Ažuriranje
- `DELETE /api/work-groups/:id` - Brisanje (admin)
- `POST /api/work-groups/:id/members` - Dodaj člana
- `DELETE /api/work-groups/:workGroupId/members/:userId` - Ukloni člana
- `GET /api/access-requests` - Zahtjevi za pristup
- `POST /api/access-requests` - Kreiraj zahtjev
- `PATCH /api/access-requests/:id` - Odobri/Odbij zahtjev

---

### 6. Zadaci (Tasks)

**Putanja:** `/tasks` (unutar sekcije)  
**Pristup:** Članovi sekcije, moderatori, admin

**Funkcionalnosti:**

#### 6.1 Kreiranje Zadataka
- Naziv i opis zadatka
- Odabir sekcije
- Dodjeljivanje članovima (multi-select)
- Bodovna vrijednost: 10, 20, 30 ili 50 bodova
- Rok (deadline)
- Procjena troškova (opcionalno)

#### 6.2 Praćenje Zadataka
- Status: Na čekanju, U toku, Završeno
- Automatsko dodavanje bodova po završetku
- Upload računa za zadatke sa troškovima
- Komentari na zadatke

#### 6.3 Bodovni Sistem
- Zadaci donose bodove učesnicima
- Bodovi se dijele između dodijeljenih članova
- Finalne bodove može prilagoditi admin
- Prikazuje se na korisničkom profilu

#### 6.4 Troškovi
- Procjena troškova pri kreiranju
- Upload računa (slike/PDF) nakon završetka
- Povezivanje sa finansijskim modulom

**API Endpoints:**
- `GET /api/tasks` - Lista zadataka
- `POST /api/tasks` - Kreiranje zadatka
- `PATCH /api/tasks/:id` - Ažuriranje zadatka
- `DELETE /api/tasks/:id` - Brisanje
- `POST /api/tasks/:id/receipts` - Upload računa
- `DELETE /api/task-receipts/:id` - Brisanje računa
- `GET /api/tasks/dashboard` - Zadaci za dashboard

---

### 7. Moderatorski Prijedlozi

**Putanja:** `/tasks` (tab "Prijedlozi")  
**Pristup:** Moderatori, Član IO, Admin

**Funkcionalnosti:**

#### 7.1 Kreiranje Prijedloga
- Moderatori mogu kreirati detaljne prijedloge
- Opis aktivnosti/projekta
- Procjena troškova
- Obrazloženje

#### 7.2 Odobravanje
- IO članovi mogu odobravati/odbijati prijedloge
- Admin ima konačnu riječ
- Napomene pri odobrenju/odbijanju

#### 7.3 Status Praćenje
- Na čekanju (pending)
- Odobreno (approved)
- Odbijeno (rejected)

**API Endpoints:**
- `GET /api/proposals` - Lista prijedloga
- `POST /api/proposals` - Kreiranje (moderator)
- `PATCH /api/proposals/:id` - Ažuriranje
- `PATCH /api/proposals/:id/approve` - Odobravanje (IO/admin)
- `PATCH /api/proposals/:id/reject` - Odbijanje (IO/admin)
- `DELETE /api/proposals/:id` - Brisanje

---

### 8. Poruke (Messages)

**Putanja:** `/messages`  
**Pristup:** Svi prijavljeni korisnici

**Funkcionalnosti:**

#### 8.1 Slanje Poruka
- Slanje poruka bilo kom članu
- Naslov i sadržaj poruke
- Markdown podrška

#### 8.2 Inbox
- Pregled primljenih poruka
- Nepročitane poruke označene
- Filtriranje po statusu

#### 8.3 Notifikacije
- Badge na navigaciji sa brojem nepročitanih
- Automatsko osvježavanje svakih 30s

**API Endpoints:**
- `GET /api/messages` - Sve poruke (inbox + sent)
- `POST /api/messages` - Slanje poruke
- `GET /api/messages/:id` - Pojedinačna poruka
- `PATCH /api/messages/:id/read` - Označi kao pročitano
- `DELETE /api/messages/:id` - Brisanje poruke
- `GET /api/messages/unread-count` - Broj nepročitanih

---

### 9. Pitaj Imama (Ask Imam)

**Putanja:** `/ask-imam`  
**Pristup:** Svi prijavljeni

**Funkcionalnosti:**

#### 9.1 Postavljanje Pitanja
- **Anonimno** ili sa imenom
- Pitanje se šalje imamu na odobrenje
- Status: Na čekanju, Odobreno, Odbijeno

#### 9.2 Odgovaranje (Admin/Imam)
- Admin vidi sva pitanja
- Odobrava pitanja za javnu objavu
- Odgovara na pitanja
- Objavljuje odgovore

#### 9.3 Arhiva
- Javni prikaz odobrenih pitanja i odgovora
- Pretraga kroz arhivu
- Kategorije pitanja

#### 9.4 Notifikacije
- Broj novih pitanja za admina
- Obavještenje kada se dobije odgovor

**API Endpoints:**
- `GET /api/imam-questions` - Lista pitanja
- `POST /api/imam-questions` - Postavi pitanje
- `PATCH /api/imam-questions/:id` - Ažuriraj/Odgovori (admin)
- `PATCH /api/imam-questions/:id/approve` - Odobri (admin)
- `DELETE /api/imam-questions/:id` - Obriši (admin)

---

### 10. Shop

**Putanja:** `/shop`  
**Pristup:** Svi  
**Guest pristup:** ✅ Da (samo pregled)

**Funkcionalnosti:**

#### 10.1 Upravljanje Proizvodima
- Kreiranje proizvoda sa slikom
- Naziv, opis, cijena
- Upload fotografija (max 5 po proizvodu)
- Image viewer za pregledanje slika
- Uređivanje proizvoda
- Brisanje proizvoda

#### 10.2 Kategorije
- Knjige, Odjeća, Namirnice, Ostalo

#### 10.3 Kontakt Forma
- Gosti mogu poslati upit o proizvodu
- Email notifikacija adminu
- Podaci: ime, email, telefon, poruka

**API Endpoints:**
- `GET /api/shop-items` - Lista proizvoda
- `POST /api/shop-items` - Kreiranje (admin)
- `PATCH /api/shop-items/:id` - Ažuriranje (admin)
- `DELETE /api/shop-items/:id` - Brisanje (admin)
- `POST /api/shop-inquiries` - Slanje upita (gost)

---

### 11. Vaktija (Prayer Times)

**Putanja:** `/vaktija`  
**Pristup:** Svi  
**Guest pristup:** ✅ Da

**Funkcionalnosti:**

#### 11.1 Prikaz Vaktije
- Accordion prikaz po mjesecima
- Sve molitve: Zora, Izlazak, Podne, Ikindija, Akšam, Jacija
- Datum i dan u sedmici

#### 11.2 Dashboard Widget
- Današnja vaktija na dashboardu
- Automatski prikaz trenutnog mjeseca

#### 11.3 CSV Upload (Admin)
- Upload cijele godišnje vaktije iz CSV fajla
- Format: `datum,zora,izlazak,podne,ikindija,aksam,jacija`
- Automatski import i validacija

**API Endpoints:**
- `GET /api/prayer-times` - Svi vremena namaza
- `GET /api/prayer-times/today` - Današnja vaktija
- `POST /api/prayer-times/upload-csv` - CSV upload (admin)
- `DELETE /api/prayer-times/:id` - Brisanje (admin)

---

### 12. Finansije

**Putanha:** `/finances` (admin) ili `/finances` (član - samo svoje uplate)  
**Pristup:** Svi

**Funkcionalnosti:**

#### 12.1 Unos Uplata (Admin)
- Odabir člana
- Iznos (CHF)
- Tip uplate: Članarina, Donacija, Zekat, Sadaka, Ostalo
- Datum uplate
- Povezivanje sa projektom (opcionalno)

#### 12.2 Projekti Integracija
- Uplate se mogu vezati za projekte
- Automatsko ažuriranje iznosa projekta
- Prikaz ukupno prikupljenog po projektu

#### 12.3 Izvještaji
- Pregled svih uplata (admin)
- Filtriranje po tipu, članu, datumu
- Izvoz u CSV/Excel
- Ukupna suma po tipu

#### 12.4 Korisnički Pregled
- Članovi vide samo svoje uplate
- Historija svih transakcija
- Ukupno uplaćeno

**API Endpoints:**
- `GET /api/payments` - Lista uplata
- `POST /api/payments` - Dodavanje uplate (admin)
- `PATCH /api/payments/:id` - Ažuriranje (admin)
- `DELETE /api/payments/:id` - Brisanje (admin)
- `GET /api/payments/user/:userId` - Uplate korisnika

---

### 13. Projekti

**Putanja:** `/projects`  
**Pristup:** Svi (kreiranje samo admin)

**Funkcionalnosti:**

#### 13.1 Upravljanje Projektima
- Kreiranje džematskih projekata
- Naziv, opis, ciljna suma
- Rok završetka
- Status: Aktivan, Završen, Odgođen

#### 13.2 Praćenje Napretka
- Prikaz prikupljenog iznosa
- Progress bar (% do cilja)
- Povezivanje sa uplatama iz finansija

#### 13.3 Donacije
- Automatski update prilikom vezivanja uplate
- Prikaz donatora (opcionalno anonimno)

**API Endpoints:**
- `GET /api/projects` - Lista projekata
- `POST /api/projects` - Kreiranje (admin)
- `PATCH /api/projects/:id` - Ažuriranje (admin)
- `DELETE /api/projects/:id` - Brisanje (admin)

---

### 14. Zahvale (Certificates)

**Putanja:** `/certificate-templates`, `/issue-certificates`, `/my-certificates`, `/all-certificates`  
**Pristup:** Svi (upravljanje samo admin)

**Funkcionalnosti:**

#### 14.1 Template Upravljanje (Admin)
- Upload PNG template-a za zahvalnicu
- Postavke **ignorišu se** - ime se automatski centrira
- Boja fonta (default: crna)
- Veličina fonta (default: 150px)
- Uređivanje i brisanje template-a

#### 14.2 Izdavanje Zahvalnica (Admin)
- Odabir template-a
- Multi-select članova
- Opcionalna poruka
- **Automatsko centriranje imena** na sredini slike
- Generisanje PNG certifikata

#### 14.3 Moje Zahvale (Član)
- Pregled primljenih zahvalnica
- Download zahvalnice
- Prikaz poruke (ako postoji)
- Badge "Novo" za nepregledane
- Datum izdavanja

#### 14.4 Sve Zahvale (Admin)
- Tabela svih izdanih certifikata
- Pregled po članu
- Status (Novo/Viđeno)
- Brisanje certifikata

#### 14.5 Tehnički Detalji
- **Centriranje teksta:** Ime se uvijek renderuje na poziciji `(width/2, height/2)` slike
- **Font:** Bold, Times New Roman sa fallback-ovima
- **Format:** PNG sa transparentnim overlay-om
- **Čuvanje:** U `/public/uploads/certificates/generated/`

**API Endpoints:**
- `GET /api/certificates/templates` - Lista template-a
- `POST /api/certificates/templates` - Kreiranje (admin)
- `PATCH /api/certificates/templates/:id` - Ažuriranje (admin)
- `DELETE /api/certificates/templates/:id` - Brisanje (admin)
- `POST /api/certificates/issue` - Izdavanje certifikata (admin)
- `GET /api/certificates/user` - Moji certifikati
- `GET /api/certificates/all` - Svi certifikati (admin)
- `PATCH /api/certificates/:id/viewed` - Označi kao viđeno
- `DELETE /api/certificates/:id` - Brisanje (admin)
- `GET /api/certificates/unviewed-count` - Broj nepregledanih

---

### 15. Dokumenti

**Putanja:** `/documents`  
**Pristup:** Svi (kreiranje samo admin)

**Funkcionalnosti:**
- Upload PDF/Word/Excel dokumenata
- Kategorije dokumenata
- Preuzimanje fajlova
- Pregled historije

**API Endpoints:**
- `GET /api/documents` - Lista dokumenata
- `POST /api/documents` - Upload (admin)
- `DELETE /api/documents/:id` - Brisanje (admin)

---

### 16. Livestream

**Putanja:** `/livestream`  
**Pristup:** Svi  
**Guest pristup:** ✅ Da

**Funkcionalnosti:**
- Prikaz live stream-a
- Podrška za YouTube, Facebook, Instagram
- Postavljanje aktivnog stream-a (admin)
- Raspored streamova

**API Endpoints:**
- `GET /api/livestream-settings` - Postavke stream-a
- `PATCH /api/livestream-settings` - Ažuriranje (admin)

---

### 17. Badževi (Badges)

**Putanja:** `/badges`  
**Pristup:** Admin

**Funkcionalnosti:**
- Kreiranje custom badževa
- Dodjeljivanje članovima
- Uslovi za dobijanje badževa
- Prikaz na profilu

**API Endpoints:**
- `GET /api/badges` - Lista badževa
- `POST /api/badges` - Kreiranje (admin)
- `POST /api/user-badges` - Dodjeljivanje (admin)
- `DELETE /api/user-badges/:id` - Oduzimanje (admin)

---

### 18. Postavke Bodova

**Putanha:** `/point-settings`  
**Pristup:** Admin

**Funkcionalnosti:**
- Objašnjenje sistema bodova
- Definisanje vrijednosti aktivnosti
- Bonus bodovi
- Resetovanje bodova

**Detalji sistema:**

**Kako se bodovi dodjeljuju:**
1. **Zadaci** - Prema vrijednosti zadatka (10/20/30/50)
2. **Događaji** - Učešće na događajima
3. **Projekti** - Doprinos projektima
4. **Volontiranje** - Posebni bodovi

**Bonus bodovi:**
- Redovnost (mjesečno)
- Preporuke (dovođenje novih članova)
- Specijalne aktivnosti

---

### 19. Gost Pristup

**Putanja:** `/` (landing page)  
**Pristup:** Javni

**Dostupne informacije:**
- Obavijesti
- Događaji
- Vaktija (vremena namaza)
- Shop (pregled proizvoda)
- Livestream
- Osnogne informacije o džematu
- Kontakt forma
- Prijava za članstvo

**API Endpoints:**
- Isti kao za prijavljene korisnike (read-only)

---

## Baza Podataka

### Schema

Aplikacija koristi **PostgreSQL** bazu sa Drizzle ORM-om. Schema je definisana u `shared/schema.ts`.

### Glavne Tabele

#### 1. users
Čuva korisnike sistema.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'Član',
  is_admin BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. announcements
Obavijesti.

```sql
CREATE TABLE announcements (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'obična',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. events
Događaji.

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP NOT NULL,
  location TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. event_rsvps
RSVP prijave za događaje.

```sql
CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  adults_count INTEGER DEFAULT 1,
  children_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. work_groups
Radne grupe (sekcije).

```sql
CREATE TABLE work_groups (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'javna',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. work_group_members
Članovi radnih grupa.

```sql
CREATE TABLE work_group_members (
  id UUID PRIMARY KEY,
  work_group_id UUID REFERENCES work_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  is_moderator BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP DEFAULT NOW()
);
```

#### 7. tasks
Zadaci.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  work_group_id UUID REFERENCES work_groups(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  points INTEGER DEFAULT 0,
  deadline TIMESTAMP,
  estimated_cost NUMERIC(10,2),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 8. task_assignments
Dodjeljivanje zadataka članovima.

```sql
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW()
);
```

#### 9. messages
Poruke između korisnika.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

#### 10. imam_questions
Pitanja za imama.

```sql
CREATE TABLE imam_questions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  question TEXT NOT NULL,
  answer TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 11. shop_items
Proizvodi u shopu.

```sql
CREATE TABLE shop_items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT,
  images TEXT[],
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 12. prayer_times
Vremena namaza.

```sql
CREATE TABLE prayer_times (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  fajr TIME NOT NULL,
  sunrise TIME NOT NULL,
  dhuhr TIME NOT NULL,
  asr TIME NOT NULL,
  maghrib TIME NOT NULL,
  isha TIME NOT NULL
);
```

#### 13. payments
Finansijske uplate.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT NOT NULL,
  project_id UUID REFERENCES projects(id),
  payment_date DATE NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 14. projects
Džematski projekti.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(10,2),
  current_amount NUMERIC(10,2) DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 15. certificate_templates
Template-i za certifikate.

```sql
CREATE TABLE certificate_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  template_image_path TEXT NOT NULL,
  text_position_x INTEGER,
  text_position_y INTEGER,
  font_size INTEGER DEFAULT 150,
  font_color TEXT DEFAULT '#000000',
  text_align TEXT DEFAULT 'center',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 16. user_certificates
Izdati certifikati.

```sql
CREATE TABLE user_certificates (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  template_id UUID REFERENCES certificate_templates(id),
  recipient_name TEXT NOT NULL,
  certificate_image_path TEXT NOT NULL,
  message TEXT,
  viewed BOOLEAN DEFAULT FALSE,
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMP DEFAULT NOW()
);
```

### Migracije

Migracije se automatski primjenjuju kroz Drizzle Kit. Za ručno pokretanje:

```bash
npm run db:push
```

---

## API Reference

### Autentifikacija

```typescript
// Login
POST /api/auth/login
Body: { username: string, password: string }
Response: { user: User }

// Logout
POST /api/auth/logout
Response: { message: string }

// Get current session
GET /api/auth/session
Response: { user: User } | 401
```

### Korisnici

```typescript
// Get all users
GET /api/users
Response: User[]

// Get single user
GET /api/users/:id
Response: User

// Create user (admin)
POST /api/users
Body: InsertUser
Response: User

// Update user
PATCH /api/users/:id
Body: Partial<InsertUser>
Response: User

// Delete user (admin)
DELETE /api/users/:id
Response: { message: string }
```

### Obavijesti

```typescript
// Get announcements
GET /api/announcements
Response: Announcement[]

// Create announcement (admin)
POST /api/announcements
Body: { title, content, priority }
Response: Announcement

// Update announcement (admin)
PATCH /api/announcements/:id
Body: Partial<InsertAnnouncement>
Response: Announcement

// Delete announcement (admin)
DELETE /api/announcements/:id
Response: { message: string }
```

### Događaji

```typescript
// Get events
GET /api/events
Response: Event[]

// Create event (admin)
POST /api/events
Body: InsertEvent
Response: Event

// RSVP to event
POST /api/events/:id/rsvp
Body: { adultsCount, childrenCount }
Response: EventRsvp

// Get event RSVPs
GET /api/events/:id/rsvps
Response: EventRsvp[]
```

### Poruke

```typescript
// Get messages
GET /api/messages
Response: Message[]

// Send message
POST /api/messages
Body: { recipientId, subject, content }
Response: Message

// Mark as read
PATCH /api/messages/:id/read
Response: Message

// Unread count
GET /api/messages/unread-count
Response: { count: number }
```

### Certifikati

```typescript
// Get templates
GET /api/certificates/templates
Response: CertificateTemplate[]

// Create template (admin)
POST /api/certificates/templates
Body: FormData (multipart)
Response: CertificateTemplate

// Issue certificates (admin)
POST /api/certificates/issue
Body: { templateId, userIds, customMessage? }
Response: { message, count, certificates }

// Get user certificates
GET /api/certificates/user
Response: UserCertificate[]

// Get all certificates (admin)
GET /api/certificates/all
Response: UserCertificate[]

// Mark as viewed
PATCH /api/certificates/:id/viewed
Response: UserCertificate

// Delete certificate (admin)
DELETE /api/certificates/:id
Response: { message: string }

// Unviewed count
GET /api/certificates/unviewed-count
Response: { count: number }
```

*Za kompletnu API referencu svih modula, pogledajte `server/routes.ts`.*

---

## Frontend Komponente

### Layout Komponente

#### DashboardLayout
Glavni layout wrapper sa sidebar-om i app bar-om.

**Lokacija:** `client/src/components/layout/DashboardLayout.tsx`

#### Sidebar
Navigaciona traka sa:
- Logo i naziv organizacije
- Menu items sa role-based vidljivošću
- Badge notifikacije
- Responsive dizajn (collapse na desktopu, drawer na mobile)

**Lokacija:** `client/src/components/layout/Sidebar.tsx`

#### AppBar
Top bar sa:
- Dobrodošlica porukom
- Profil dropdown
- Logout opcija

**Lokacija:** `client/src/components/layout/AppBar.tsx`

#### MobileAppBar
Fixed top bar optimizovan za mobile sa:
- Transparentnim SVG logom (DzematLogo)
- Naslovom aplikacije
- Back dugmetom za navigaciju
- Notifikacijama i profilom
- Visina: 64px, position: fixed

**Lokacija:** `client/src/components/MobileAppBar.tsx`

#### BottomNavigation
Fixed bottom navigacija za mobile sa:
- 4 glavne rute (Dashboard, Obavijesti, Događaji, Profil)
- Badge notifikacijama
- Ikonama i labelama
- Visina: 88px, position: fixed

**Lokacija:** `client/src/components/layout/BottomNavigation.tsx`

#### DzematLogo
Transparentni SVG logo komponenta sa:
- Polumjesec (crescent moon)
- Knjiga (book)
- Plava boja (#2196F3)
- Prilagodljiva veličina (default 64px)

**Lokacija:** `client/src/components/DzematLogo.tsx`

**Korištenje:**
```tsx
<DzematLogo size={40} />
```

### shadcn/ui Komponente

Aplikacija koristi sljedeće shadcn/ui komponente:

- `Button` - Dugmad
- `Card` - Kartice za sadržaj
- `Dialog` - Modalni prozori
- `Form` - React Hook Form wrapper
- `Input` - Tekstualna polja
- `Select` - Dropdown meniji
- `Table` - Tabele
- `Tabs` - Tab navigacija
- `Toast` - Notifikacije
- `Badge` - Značke
- `Avatar` - Korisnički avatari
- `Calendar` - Kalendar picker
- `Progress` - Progress bar
- `Accordion` - Accordion paneli

**Lokacija:** `client/src/components/ui/`

### Stranice (Pages)

Sve stranice se nalaze u `client/src/pages/` direktorijumu:

- `DashboardHome.tsx` - Dashboard
- `UsersPage.tsx` - Upravljanje korisnicima
- `AnnouncementsPage.tsx` - Obavijesti
- `EventsPage.tsx` - Događaji
- `AllSectionsPage.tsx` - Sekcije
- `TaskManagerPage.tsx` - Zadaci
- `MessagesPage.tsx` - Poruke
- `AskImamPage.tsx` - Pitaj Imama
- `ShopPage.tsx` - Shop
- `VaktijaPage.tsx` - Vaktija
- `FinancesPage.tsx` - Finansije
- `ProjectsPage.tsx` - Projekti
- `CertificateTemplatesPage.tsx` - Template-i certifikata
- `IssueCertificatesPage.tsx` - Izdavanje certifikata
- `MyCertificatesPage.tsx` - Moji certifikati
- `AllCertificatesPage.tsx` - Sve zahvale (admin)
- `BadgesPage.tsx` - Badževi
- `DocumentsPage.tsx` - Dokumenti
- `LivestreamPage.tsx` - Livestream
- `OrganizationSettingsPage.tsx` - Org. postavke
- `GuestPage.tsx` - Javna stranica

### Routing

Routing je implementiran sa `wouter` bibliotekom.

**Primjer:**

```tsx
<Route path="/dashboard">
  <ProtectedRoute>
    <DashboardHome />
  </ProtectedRoute>
</Route>
```

### State Management

- **Server State:** TanStack Query (React Query)
- **Auth State:** React Context (`AuthContext`)
- **Local State:** React useState/useReducer

### Data Fetching

Sve API pozive handleuje TanStack Query:

```tsx
const { data, isLoading } = useQuery<User[]>({
  queryKey: ['/api/users'],
});
```

Mutations:

```tsx
const mutation = useMutation({
  mutationFn: async (data) => {
    return apiRequest('/api/users', 'POST', data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/users'] });
  }
});
```

### Custom Hooks

#### useEdgeLockScroll
**Svrha:** Sprječava iOS Safari bounce/overscroll efekat korištenjem edge-offset clamping strategije.

**Lokacija:** `client/src/hooks/useEdgeLockScroll.ts`

**Kako radi:**
1. Održava scroll poziciju između [1, maxScroll-1]
2. Koristi `touchstart` event da presreće scroll na granicama
3. Koristi `scroll` event za fine-tuning scroll pozicije
4. Dinamički injektira top/bottom filler elemente ako je sadržaj kraći od viewport-a
5. Rezultat: Zero bounce - sadržaj se čisto zaustavlja bez rubber-band animacije

**Korištenje:**
```tsx
const contentRef = useRef<HTMLDivElement>(null);
useEdgeLockScroll(contentRef);

return (
  <div ref={contentRef} style={{ overflow: 'auto' }}>
    {/* scrollable content */}
  </div>
);
```

**Važno:** Hook automatski čisti sve listeners i filler elemente na unmount.

---

## Internacionalizacija

Aplikacija podržava **4 jezika:**
- **Bosanski (bs)** - Glavni jezik (ijekavica)
- **Njemački (de)** 
- **Engleski (en)**
- **Albanski (al)**

### Implementacija

Koristi se **react-i18next** biblioteka.

**Inicijalizacija:** `client/src/i18n/i18n.ts`

```tsx
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      bs: { /* prijevodi */ },
      de: { /* prijevodi */ },
      en: { /* prijevodi */ }
    },
    lng: 'bs',
    fallbackLng: 'bs',
    interpolation: {
      escapeValue: false
    }
  });
```

### Namespaces

Prijevodi su organizovani u namespaces:

- `navigation` - Navigacija i meni
- `certificates` - Modul certifikata
- `common` - Zajednički tekstovi

**Struktura:**

```
client/src/i18n/locales/
├── bs/
│   ├── navigation.json
│   └── certificates.json
├── de/
│   ├── navigation.json
│   └── certificates.json
└── en/
    ├── navigation.json
    └── certificates.json
```

### Korištenje

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['navigation']);
  
  return <h1>{t('navigation:menu.dashboard')}</h1>;
}
```

### Promjena Jezika

Implementirano kroz Language Selector u aplikaciji.

```tsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
i18n.changeLanguage('de');
```

---

## Deployment

### Replit Deployment

Aplikacija je optimizovana za deployment na **Replit** platformi.

#### Konfiguracija

**.replit:**
```toml
run = "npm run dev"
entrypoint = "server/index.ts"

[deployment]
build = ["npm", "run", "build"]
run = ["npm", "start"]
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "NODE_ENV=production node --loader tsx server/index.ts"
  }
}
```

#### Environment Setup

1. PostgreSQL baza automatski dostupna kroz Replit
2. Environment varijable automatski postavljene
3. Persistent storage za upload-ovane fajlove

#### Publishing

1. Kliknite **"Publish"** u Replit-u
2. Odaberite naziv domena
3. Aplikacija će biti dostupna na `https://your-app.replit.app`

### Alternativni Deployment

#### Vercel / Netlify

Za deployment na druge platforme:

1. **Build frontend:**
   ```bash
   npm run build
   ```

2. **Environment varijable:**
   ```env
   DATABASE_URL=your_postgres_url
   NODE_ENV=production
   PORT=5000
   ```

3. **Start server:**
   ```bash
   npm start
   ```

#### Docker

```dockerfile
FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

---

## Troubleshooting

### Česti Problemi i Rješenja

#### 1. Baza podataka se ne povezuje

**Problem:** `Error: connect ECONNREFUSED`

**Rješenje:**
- Provjerite da li je `DATABASE_URL` pravilno postavljen
- U Replit-u, restartujte workspace
- Provjerite Neon dashboard da li je baza aktivna

#### 2. Session se gubi nakon restarta

**Problem:** Korisnici moraju ponovo da se prijave

**Rješenje:**
- Session storage koristi PostgreSQL (connect-pg-simple)
- Provjerite da li postoji `sessions` tabela
- Produljite `maxAge` u session konfiguraciji

#### 3. Upload fajlova ne radi

**Problem:** Fajlovi se ne upload-uju

**Rješenje:**
- Provjerite da postoji `public/uploads` direktorijum
- Provjerite file permissions
- Povećajte `maxFileSize` u multer konfiguraciji

#### 4. Certifikati se ne generišu

**Problem:** Greška pri generisanju certifikata

**Rješenje:**
- Provjerite da je `sharp` instaliran: `npm install sharp`
- Provjerite da je `@napi-rs/canvas` instaliran
- Fontovi moraju biti dostupni na serveru

#### 5. Tekst nije centriran na certifikatu

**Problem:** Ime nije na sredini template-a

**Rješenje:**
- Kod automatski centrira tekst na `(width/2, height/2)`
- Prilagodite template dizajn (dodajte liniju gdje želite ime)
- Ne mijenjajte X/Y pozicije u template postavkama

#### 6. Notifikacije se ne ažuriraju

**Problem:** Badge brojevi ostaju isti

**Rješenje:**
- React Query automatski refetch-uje svakih 30s
- Ručno invalidirajte cache: `queryClient.invalidateQueries()`
- Provjerite network tab za API greške

#### 7. Vaktija ne prikazuje podatke

**Problem:** Prazna vaktija

**Rješenje:**
- Upload-ujte CSV sa formatom: `datum,zora,izlazak,podne,ikindija,aksam,jacija`
- Datum mora biti u formatu: `YYYY-MM-DD`
- Vrijeme u formatu: `HH:MM`

#### 8. Build greške u TypeScript

**Problem:** Type errors pri build-u

**Rješenje:**
- Provjerite `tsconfig.json` konfiguraciju
- Instalirajte tipove: `npm install -D @types/node @types/react`
- Pokrenite: `npx tsc --noEmit` za provjeru

#### 9. Slow queries

**Problem:** Spore SQL upite

**Rješenje:**
- Dodajte indexe na često korištene kolone
- Koristite `EXPLAIN ANALYZE` za analizu
- Optimizujte JOIN operacije

#### 10. Memory leaks

**Problem:** Server troši previše memorije

**Rješenje:**
- Provjerite da nema circular references
- Cleanup event listeners u React
- Koristite `useEffect` cleanup funkcije

---

## Dodatne Napomene

### Backup i Restore

**Backup baze:**
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Restore:**
```bash
psql $DATABASE_URL < backup.sql
```

### Monitoring

Preporučeni alati za monitoring:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **New Relic** - Performance monitoring

### Security Best Practices

1. **Never commit secrets** - Koristite environment varijable
2. **Validate input** - Zod schema validation
3. **Sanitize HTML** - Izbjegavajte XSS
4. **Use HTTPS** - Obavezno u produkciji
5. **Rate limiting** - Zaštita od spam-a
6. **SQL injection** - Drizzle ORM automatski štiti

### Performance Optimizacije

1. **Image optimization** - Sharp library
2. **Lazy loading** - React.lazy() za stranice
3. **Memoization** - React.memo, useMemo
4. **Database indexing** - Na foreign keys
5. **Caching** - React Query cache

---

## Nedavna Ažuriranja (November 2024)

### Mobile-First Transformacija

DžematApp je prošao kroz značajnu transformaciju u Progressive Web App sa native-app iskustvom:

#### iOS Safari Bounce Prevention ✅
- **Problem riješen**: Eliminisan nepoželjni bounce/overscroll efekat na iOS Safari
- **Rješenje**: Custom `useEdgeLockScroll` hook sa edge-offset clamping strategijom
- **Rezultat**: Sadržaj se čisto zaustavlja na granicama - zero rubber-band animacije

#### Fixed Layout System ✅
- **TopBar**: Position fixed, 64px visina
- **BottomNavigation**: Position fixed, 88px visina (povećano sa 72px radi sprječavanja icon clipping-a)
- **Content Area**: Scrollable sadržaj između fiksnih elemenata
- **Padding System**: Konzistentan kroz cijelu aplikaciju (16px)

#### Branding & Visual Identity ✅
- **DzematLogo.tsx**: Kreiran transparentni SVG logo sa polumjesecom i knjigom
- **PWA Icons**: Kompletna kolekcija ikona za sve veličine (72px-512px)
- **Apple Touch Icons**: Optimizovano za iPhone Home Screen
- **Manifest**: Potpuno konfigurisan `manifest.json` za PWA instalaciju

#### Auto-Scroll Reset ✅
- Implementiran automatski reset scroll pozicije na promjenu rute
- Rješava problem gdje se scroll pozicija ne resetuje (npr. Moduli stranica)

#### Tehnička Implementacija
```typescript
// Spacing konstante
MOBILE_APP_BAR_HEIGHT = 64px
BOTTOM_NAV_HEIGHT = 88px  
MOBILE_CONTENT_PADDING = 16px

// Layout padding
paddingTop: 80px (64px + 16px)
paddingBottom: 104px (88px + 16px)
paddingHorizontal: 16px
```

#### Fajlovi Kreirani/Ažurirani
- ✅ `client/src/hooks/useEdgeLockScroll.ts` - iOS bounce prevention
- ✅ `client/src/components/DzematLogo.tsx` - Transparentni SVG logo
- ✅ `client/src/components/MobileAppBar.tsx` - Ažuriran sa DzematLogo
- ✅ `client/src/components/layout/BottomNavigation.tsx` - Povećana visina
- ✅ `client/public/icons/` - Dodane sve PWA ikone
- ✅ `client/index.html` - Apple touch icon meta tags
- ✅ `client/public/manifest.json` - PWA konfiguracija

### Budući Razvoj

Planirane funkcionalnosti:
- Push notifikacije
- Mobile aplikacija (React Native)
- Email notifikacije
- SMS integracija
- Export izvještaja (PDF)
- Multi-tenant podrška
- Advanced analytics
- Integration sa platnim sistemima

---

## Kontakt i Podrška

Za pitanja i podršku, kontaktirajte:
- Email: support@dzematapp.ba
- GitHub: [repository link]
- Dokumentacija: [docs link]

---

**Verzija:** 1.1 (Mobile-First PWA)  
**Datum:** 19.11.2024  
**Autor:** DžematApp Tim

---

*Ova dokumentacija pokriva sve aspekte DžematApp projekta. Za dodatne detalje, pogledajte kod u repository-ju.*
