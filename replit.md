# DžematApp - Vodič za razvoj

## Pregled projekta

DžematApp je mobile-first Progressive Web App (PWA) za upravljanje džematskom zajednicom. Pruža sveobuhvatnu platformu za upravljanje korisnicima, objavama, događajima, radnim grupama i zadacima.

---

## Brzi start

### Pokretanje aplikacije
```bash
npm run dev
```

### Git push na GitHub
```bash
git add . && git commit -m "Opis promjena" && git push origin main
```

### Sa tokenom:
```bash
git push https://$GITHUB_TOKEN@github.com/sabahuddin/Dzematapp.git main
```

---

## Korisničke preference

| Postavka | Vrijednost |
|----------|------------|
| Jezik | Bosanski (ijekavica) |
| Stil komunikacije | Jednostavan, svakodnevni jezik |
| Border radius | 16px |

---

## Dizajn sistem - "Spiritual Tech Indigo"

### Boje

| Namjena | Boja | Hex |
|---------|------|-----|
| Primary (Indigo) | TopBar, aktivna navigacija | `#3949AB` |
| Secondary (Tech Blue) | Dugmad, CTA, linkovi | `#1E88E5` |
| Accent (Tirkizna) | Success stanja | `#26A69A` |
| Background | Pozadina aplikacije | `#ECEFF1` |
| Surface | Kartice, modali | `#FFFFFF` |
| Text Primary | Naslovi, tekst | `#0D1B2A` |
| Text Secondary | Pomoćni tekst | `#546E7A` |
| Nav Inactive | Neaktivne ikone | `#B0BEC5` |

### Tipografija
- **Font**: Inter (primary), Roboto (fallback)
- **Težine**: 400 (body), 600 (podnaslovi, dugmad), 700 (naslovi)

### Komponente
- **Kartice**: Bijele, sjena `0 4px 6px -1px rgba(0,0,0,0.05)`, radius 16px
- **Inputi**: Filled stil, siva pozadina `#ECEFF1`, bijela na focus
- **Dugmad**: Tech Blue contained, Indigo outlined, radius 10px
- **TopBar**: Indigo pozadina, bijeli tekst/ikone, visina 64px
- **BottomNav**: Bijela pozadina, visina 88px

---

## Arhitektura

### Frontend
- **Framework**: React + TypeScript + Vite
- **UI**: Material-UI + shadcn/ui + Tailwind CSS
- **Routing**: Wouter
- **State**: React Query + Context API
- **PWA**: Offline podrška, installability

### Backend
- **Framework**: Express.js + TypeScript
- **ORM**: Drizzle ORM
- **Baza**: PostgreSQL (Hetzner hosting)
- **Sesije**: PostgreSQL session store

### Autentifikacija
- Session-based sa username/password
- Guest pristup za javne stranice
- Role: Admin, Član IO, Član, Član porodice, SuperAdmin

---

## Multi-Tenancy

| Tenant | Opis |
|--------|------|
| `tenant-superadmin-global` | Skriven, za SuperAdmin |
| Regular tenanti | Izolovani, bez dijeljenja podataka |

- Novi tenant dobija prazan prostor + auto-generiran admin (`admin/admin123`)
- `session.tenantId` je autoritativan izvor za tenant

---

## Moduli aplikacije

### Osnovni moduli
- **Korisnici**: CRUD, bulk upload, filtriranje, članski broj
- **Objave**: Content management, kategorije
- **Događaji**: Kalendar, RSVP, poeni za prisustvo
- **Vaktija**: Molitvena vremena, CSV upload

### Radne grupe (Sekcije)
- Task manager sa multi-user assignments
- Moderatorski prijedlozi
- Komentari na zadatke

### Shop modul
- DžematShop proizvodi
- Marketplace (prodaja/poklon)
- Zahtjevi za kupovinu

### Članarina
- Mjesečna/godišnja plaćanja
- Grid prikaz po mjesecima
- Excel bulk upload

### Dodatni moduli
- **Imam Q&A**: Pitanja i arhiva odgovora
- **Zahvale**: Certifikati, template management
- **Dokumenti**: Upload i upravljanje
- **Livestream**: Video integracija
- **Bedževi**: Gamifikacija, poeni
- **Analitika**: SuperAdmin dashboard

---

## Analytics sistem

### Cookie Consent (GDPR)
- Komponenta: `CookieConsent.tsx`
- Storage: `dzematapp_cookie_consent` u localStorage
- Stanja: pending, accepted, rejected

### Praćenje posjeta
- Tabela: `page_views`
- Endpointi:
  - `POST /api/analytics/track` - javni, za tracking
  - `GET /api/analytics/stats` - samo SuperAdmin

### CORS za marketing site
Marketing site (dzematapp.com) šalje analitiku na app.dzematapp.com:
- Origin: `https://dzematapp.com`, `https://www.dzematapp.com`
- Metode: POST, OPTIONS

---

## Ključne datoteke

| Putanja | Opis |
|---------|------|
| `client/src/App.tsx` | Glavni router, auth context |
| `client/src/pages/` | Sve stranice |
| `client/src/components/` | UI komponente |
| `server/routes.ts` | API endpointi |
| `server/storage.ts` | Database operacije |
| `server/index.ts` | Express setup, CORS |
| `shared/schema.ts` | Drizzle shema, tipovi |

---

## API Endpointi (Pregled)

### Autentifikacija
- `POST /api/auth/login` - Korisnik login
- `POST /api/auth/superadmin/login` - SuperAdmin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Provjera sesije

### CRUD Pattern
Većina modula slijedi pattern:
- `GET /api/{modul}` - Lista
- `GET /api/{modul}/:id` - Pojedinačni
- `POST /api/{modul}` - Kreiranje
- `PATCH /api/{modul}/:id` - Update
- `DELETE /api/{modul}/:id` - Brisanje

---

## Pending integracije

### Paddle Payment (ČEKA SE)
- **Status**: Čeka se Paddle registracija
- **Planovi**: Basic €29/mo, Standard €39/mo, Full €49/mo
- **Potrebno**: Vendor ID, API Key, Product IDs

---

## Mobile App

Lokacija: `mobile/` direktorij
- **Framework**: React Native + Expo
- **Router**: Expo Router
- **Tema**: Indigo dizajn (identičan PWA)
- **Korisnici**: Isključivo za članove (ne-admin korisnike)
- **Admin funkcije**: Dostupne samo u web aplikaciji

### Mobile ekrani
| Ekran | Fajl | Opis |
|-------|------|------|
| Login | `app/login.tsx` | Tenant kod + prijava |
| Početna | `app/(tabs)/index.tsx` | Statistika, vaktija |
| Objave | `app/(tabs)/announcements.tsx` | Pregled objava, pretraga, filtriranje |
| Događaji | `app/(tabs)/events.tsx` | Kalendar, RSVP funkcionalnost |
| Vaktija | `app/(tabs)/vaktija.tsx` | Molitvena vremena |
| Poruke | `app/(tabs)/messages.tsx` | Razgovori, slanje poruka |
| Aktivnosti | `app/(tabs)/activities.tsx` | Bodovi, značke |
| Članarina | `app/(tabs)/membership.tsx` | Status plaćanja |
| Moduli | `app/(tabs)/modules.tsx` | Navigacija na 16 dodatnih ekrana |
| Profil | `app/(tabs)/profile.tsx` | Korisnički podaci, odjava, uređivanje profila |
| Shop | `app/(tabs)/shop.tsx` | DžematShop + Marketplace sa dodavanjem oglasa |
| Sekcije | `app/(tabs)/sections.tsx` | Radne grupe, zadaci, komentiranje |
| Pitaj imama | `app/(tabs)/imam-qa.tsx` | Postavljanje pitanja, odgovori |
| Dokumenti | `app/(tabs)/documents.tsx` | Pregled i download dokumenata |
| Obavještenja | `app/(tabs)/notifications.tsx` | Lista nepročitanih obavještenja |
| Moje zahvale | `app/(tabs)/certificates.tsx` | Pregled i download certifikata |
| Prijave | `app/(tabs)/applications.tsx` | Prijave za Akiku, Vjenčanje |
| Moje značke | `app/(tabs)/badges.tsx` | Bodovi i osvojene značke |
| Feed | `app/(tabs)/feed.tsx` | Timeline aktivnosti zajednice |
| Livestream | `app/(tabs)/livestream.tsx` | YouTube/Facebook prijenosi |
| Sponzori | `app/(tabs)/sponsors.tsx` | Lista sponzora džemata |
| Vodič | `app/(tabs)/guide.tsx` | Pomoć i upute za korištenje

### Mobile API klijent
- Lokacija: `mobile/services/api.ts`, `mobile/services/auth.ts`
- Session cookie podrška
- Graceful error handling na svim ekranima

---

## Napomene za razvoj

### Ne mijenjati
- `server/vite.ts` i `vite.config.ts`
- `package.json` (koristiti packager tool)
- `drizzle.config.ts`

### Konvencije
- Koristiti postojeće UI komponente
- Ikone: `lucide-react` (akcije), `react-icons/si` (logotipovi)
- Forme: `react-hook-form` + `zod` validacija
- Queries: `@tanstack/react-query` v5 (object forma)

### Test ID atributi
- Interaktivni elementi: `{action}-{target}` (npr. `button-submit`)
- Display elementi: `{type}-{content}` (npr. `text-username`)
- Dinamički: `{type}-{description}-{id}` (npr. `card-product-123`)
