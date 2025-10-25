# DžematApp - Korisnički Vodič

## Sadržaj
1. [Uvod](#uvod)
2. [Prijava i Pristup](#prijava-i-pristup)
3. [Uloge i Privilegije](#uloge-i-privilegije)
4. [Glavni Moduli](#glavni-moduli)
5. [Sekcije (Radne Grupe)](#sekcije-radne-grupe)
6. [Zadaci i Bodovanje](#zadaci-i-bodovanje)
7. [Prijedlozi Moderatora](#prijedlozi-moderatora)
8. [Događaji i RSVP](#događaji-i-rsvp)
9. [Novosti](#novosti)
10. [Imam Q&A](#imam-qa)
11. [Vaktija (Vrijeme Molitve)](#vaktija-vrijeme-molitve)
12. [Projekti i Finansije](#projekti-i-finansije)
13. [Trgovina](#trgovina)
14. [Korisnici i Profili](#korisnici-i-profili)
15. [Postavke](#postavke)

---

## Uvod

DžematApp je moderan web portal za upravljanje džematom (islamskom zajednicom). Aplikacija omogućava administratorima, članovima izvršnog odbora (IO) i članovima džemata da efikasno upravlaju aktivnostima, zadacima, događajima, finansijama i komunikacijom unutar zajednice.

**Jezici:** Aplikacija podržava tri jezika:
- 🇧🇦 **Bosanski (BS)** - Ijekavica
- 🇩🇪 **Njemački (DE)**
- 🇺🇸 **Engleski (EN)**

**Valuta:** CHF (Švicarski franak)

**Format datuma:** dd.mm.yyyy

---

## Prijava i Pristup

### Prijavljivanje

1. Otvorite DžematApp u browseru
2. Na login stranici odaberite jezik klikom na zastavu:
   - 🇧🇦 BS (Bosanski)
   - 🇩🇪 DE (Njemački)
   - 🇺🇸 EN (Engleski)
3. Unesite korisničko ime i lozinku
4. Kliknite **Prijavi se**

**Demo pristupni podaci:**
- **Admin:** `admin` / `admin123`
- **Član:** `ali.alic` / `password123`

### Gostujući Pristup

Neregistrovani korisnici mogu pristupiti javnom dijelu aplikacije klikom na dugme **Gost Pristup**. Gosti mogu:
- Pregledati novosti
- Vidjeti javne događaje
- Provjeriti vrijeme molitve (vaktiju)
- Poslati zahtjev za članstvo

---

## Uloge i Privilegije

### Admin (Administrator)
- **Puna kontrola** nad aplikacijom
- Upravljanje korisnicima i dodjeljivanje uloga
- Kreiranje i brisanje sekcija
- Odobravanje prijedloga i zahtjeva
- Pristup svim modulima i podacima
- Može dodjeljivati moderatore sekcijama

### Član IO (Izvršni Odbor)
- Pregled svih sekcija i zadataka
- Pregled i odobravanje prijedloga moderatora
- Kreiranje događaja i novosti
- Pregled finansijskih podataka
- Ne može dodjeljivati moderatore

### Blagajnik
- Upravljanje finansijama
- Dodavanje i uređivanje doprinosa
- Kreiranje i uređivanje projekata
- Pregled finansijskih izvještaja
- Pristup modulu Projekti + Finansije

### Moderator Sekcije
- Upravljanje zadacima unutar svoje sekcije
- Kreiranje prijedloga za aktivnosti
- Dodavanje članova u sekciju
- Praćenje bodova članova

### Član (Standardni Korisnik)
- Pristup sekcijama gdje je član
- Praćenje svojih zadataka i bodova
- Prijava na događaje (RSVP)
- Postavljanje pitanja imamu
- Pregled novosti i događaja

### Član Porodice
- Ograničen pristup
- Pregled osnovnih informacija
- Praćenje događaja

---

## Glavni Moduli

Dashboard aplikacije sadrži sljedeće module:

1. **Dashboard** - Početna stranica sa brze preglede
2. **Sekcije** - Radne grupe i zadaci
3. **Događaji** - Kalendar i lista događaja
4. **Novosti** - Obavijesti za zajednicu
5. **Korisnici** - Upravljanje članovima
6. **Imam Q&A** - Pitanja i odgovori
7. **Vaktija** - Vrijeme molitve
8. **Projekti + Finansije** - Finansijsko upravljanje
9. **Trgovina** - Prodaja artikala
10. **Dokumenti** - Dijeljenje fajlova
11. **Poruke** - Interna komunikacija
12. **Postavke** - Konfiguracija aplikacije

---

## Sekcije (Radne Grupe)

Sekcije su radne grupe koje organizuju različite aktivnosti unutar džemata (npr. Održavanje, Obrazovanje, Socijalni rad).

### Pregled Sekcija

**Moje Sekcije:**
- Prikazuju se odmah na vrhu stranice
- Sekcije gdje ste član ili moderator
- Direktan pristup zadacima

**Ostale Sekcije (Accordion):**
- Sekcije gdje niste član
- Možete zatražiti pristup
- Vidljivost zavisi od postavki sekcije (javne/privatne)

### Kreiranje Sekcije (samo Admin)

1. Kliknite **+ Nova Sekcija**
2. Popunite podatke:
   - **Naziv** sekcije
   - **Opis** aktivnosti
   - **Vidljivost:** Javna ili Privatna
3. Dodajte **moderatora** (opcionalno)
4. Kliknite **Kreiraj**

### Dodavanje Članova

**Admin/Moderator:**
1. Otvorite sekciju
2. Kliknite **Dodaj Člana**
3. Odaberite korisnika iz liste
4. Kliknite **Dodaj**

**Standardni Korisnici:**
- Mogu zatražiti pristup privatnim sekcijama
- Admin/Moderator odobrava zahtjev

### Postavke Vidljivosti

- **Javna Sekcija:** Svi mogu vidjeti i zatražiti pristup
- **Privatna Sekcija:** Vidljiva samo članovima i administratorima

---

## Zadaci i Bodovanje

### Kreiranje Zadatka

1. Otvorite sekciju
2. Kliknite **+ Novi Zadatak**
3. Popunite podatke:
   - **Naziv** zadatka
   - **Opis** aktivnosti
   - **Prioritet:** Nizak / Srednji / Visok
   - **Rok:** Datum završetka
   - **Bodovi:** 10, 20, 30 ili 50
   - **Procijenjeni Troškovi:** Iznos u CHF (opcionalno)
   - **Dodijeljen:** Odaberite jednog ili više članova
4. Kliknite **Kreiraj**

### Sistem Bodovanja

DžematApp koristi 4-stepeni sistem bodovanja:

| Bodovi | Opis | Primjer |
|--------|------|---------|
| **10** | Mali zadatak (1-2h) | Čišćenje prostorije |
| **20** | Srednji zadatak (pola dana) | Organizacija događaja |
| **30** | Veći zadatak (cijeli dan) | Renovacija prostora |
| **50** | Veliki projekat (više dana) | Vođenje kampanje |

**Kako se dodjeljuju bodovi:**
- Moderator dodjeljuje bodove pri kreiranju zadatka
- Admin može promijeniti vrijednost bodova naknadno
- Bodovi se pripisuju **automatski** kada se zadatak označi kao završen
- Ako je zadatak dodijeljen **više korisnika**, svi dobivaju puni broj bodova

### Praćenje Bodova

**Za Korisnike:**
- Pregled svojih bodova na Dashboard-u
- Lista zadataka i dodjeljenih bodova

**Za Moderatore/Admine:**
- Pregled bodova svih članova sekcije
- Statistika najaktivnijih članova
- Izvještaji o bodovima

### Troškovi i Računi

Ako zadatak ima **procijenjene troškove**:

1. Član završava zadatak
2. Klikne **Upload Računa**
3. Učita sliku ili PDF računa
4. Unese **konačan iznos**
5. Moderator/Admin pregleda i odobrava

---

## Prijedlogi Moderatora

Moderatori mogu predložiti aktivnosti koje zahtijevaju odobrenje IO/Admin-a.

### Kreiranje Prijedloga

1. U svojoj sekciji kliknite **+ Novi Prijedlog**
2. Popunite podatke:
   - **Naziv** aktivnosti
   - **Detaljan Opis** i opravdanje
   - **Procijenjeni Budžet** (CHF)
   - **Prioritet:** Nizak / Srednji / Visok
3. Kliknite **Pošalji Prijedlog**

### Proces Odobrenja

**IO Član ili Admin:**
1. Otvara **Prijedlozi** tab
2. Pregleda detalje prijedloga
3. Odabire akciju:
   - ✅ **Odobri** - Prijedlog se prihvata
   - ❌ **Odbij** - Prijedlog se odbacuje
   - 💬 **Komentar** - Zahtijeva dodatne informacije

**Status Prijedloga:**
- 🟡 **Na čekanju** (Pending)
- 🟢 **Odobren** (Approved)
- 🔴 **Odbijen** (Rejected)

---

## Događaji i RSVP

### Pregled Događaja

Stranica Događaji ima **dva tab-a**:

1. **📅 Kalendar** - Vizualni prikaz događaja po datumima
2. **📋 Lista Događaja** - Tabelarni pregled svih događaja

### Kreiranje Događaja (Admin/IO)

1. Kliknite **+ Novi Događaj**
2. Popunite podatke:
   - **Naziv** događaja
   - **Opis** aktivnosti
   - **Datum i Vrijeme** početka
   - **Lokacija**
   - **Vidljivost:** Javno ili Privatno
3. Kliknite **Kreiraj**

### RSVP (Potvrda Dolaska)

**Za Članove:**
1. Otvorite događaj
2. Kliknite **Potvrdi Dolazak** ili **Neću Doći**
3. Status se automatski ažurira

**Za Organizatore:**
- Pregled broja potvrđenih dolazaka
- Lista ljudi koji dolaze/ne dolaze
- Statistika prisustva

### Važni Datumi

Modul za bilježenje bitnih datuma (rođendani, godišnjice, praznici):

1. Kliknite **+ Novi Važan Datum**
2. Unesite datum i opis
3. Sistem će prikazati podsjetnik

---

## Novosti

### Kreiranje Novosti (Admin/IO)

1. Kliknite **+ Nova Novost**
2. Popunite:
   - **Naslov**
   - **Sadržaj** (podržava formatiranje)
   - **Prioritet:** Normalna / Važna
3. Kliknite **Objavi**

**Vidljivost:**
- Novosti su vidljive **svim korisnicima**, uključujući goste

### Pregled Novosti

- Najnovije novosti prikazuju se gore
- Važne novosti označene posebnom bojom/ikonom
- Notifikacije za nove neviđene novosti

---

## Imam Q&A

### Postavljanje Pitanja

1. Otvorite **Imam Q&A** stranicu
2. Kliknite **Postavi Pitanje**
3. Unesite svoje pitanje
4. Odaberite **Anonimno** ako ne želite da se ime prikazuje
5. Kliknite **Pošalji**

### Odgovaranje na Pitanja (Admin/Imam)

1. Pregled svih pitanja u **Aktivna** tab-u
2. Kliknite na pitanje
3. Napišite odgovor
4. Kliknite **Pošalji Odgovor**

### Arhiviranje

- Odgovorena pitanja mogu se arhivirati
- Arhivirane Q&A su dostupne u **Arhivirane** tab-u
- Korisno za kreiranje baze znanja

---

## Vaktija (Vrijeme Molitve)

### Pregled Vaktije

**Dashboard:**
- Prikazuje **današnje vrijeme molitve** (Sabah, Podne, Ikindija, Akšam, Jacija)

**Vaktija Stranica:**
- Puni kalendar sa vremenima molitve za svaki dan
- Prikazano po mjesecima (Accordion view)

### Učitavanje Vaktije (Admin)

1. Pripremite CSV fajl sa sljedećim kolonama:
   ```
   Datum,Sabah,Podne,Ikindija,Akšam,Jacija
   ```
2. Kliknite **Upload CSV**
3. Odaberite fajl
4. Sistem će automatski učitati podatke

**Format datuma:** dd.mm.yyyy  
**Format vremena:** HH:MM

---

## Projekti i Finansije

### Projekti

**Kreiranje Projekta (Admin/Blagajnik):**

1. Otvorite **Projekti + Finansije**
2. Kliknite **+ Novi Projekat**
3. Popunite:
   - **Naziv** projekta
   - **Opis** i cilj
   - **Ciljani Iznos** (CHF)
   - **Rok** završetka
4. Kliknite **Kreiraj**

**Praćenje Projekta:**
- Prikaz trenutnog iznosa vs. ciljanog iznosa
- Progress bar vizualizacija
- Automatsko ažuriranje kada se doda doprinos

### Finansijski Doprinosi

**Dodavanje Doprinosa:**

1. Kliknite **+ Novi Doprinos**
2. Popunite:
   - **Donor** (ko je uplatio)
   - **Iznos** (CHF)
   - **Datum** uplate
   - **Projekat** (opcionalno - automatski ažurira projekat)
   - **Napomena**
3. Kliknite **Dodaj**

**Izvještaji:**
- Pregled ukupnih doprinosa
- Doprinosi po projektima
- Doprinosi po donatorima

---

## Trgovina

### Dodavanje Artikla (Admin)

1. Otvorite **Trgovina** stranicu
2. Kliknite **+ Novi Artikal**
3. Popunite:
   - **Naziv** proizvoda
   - **Opis**
   - **Cijena** (CHF)
   - **Upload Slike** (opciono, do 5 slika)
   - **Kategorija**
4. Kliknite **Objavi**

### Pregled Artikala

**Za Korisnike:**
- Pregled svih dostupnih artikala
- Klik na artikal otvara detalje
- Galerija slika (ako ima više slika)
- Kontakt forma za upit

**Kontakt Forma:**
1. Kliknite **Pošalji Upit**
2. Unesite poruku
3. Prodavac prima notifikaciju

### Uređivanje Artikla (Admin)

1. Kliknite na artikal
2. Kliknite **Uredi**
3. Promijenite podatke
4. Upload novih slika ili uklonite postojeće
5. Kliknite **Sačuvaj**

---

## Korisnici i Profili

### Kreiranje Korisnika (Admin)

1. Otvorite **Korisnici** stranicu
2. Kliknite **+ Novi Korisnik**
3. Popunite:
   - **Korisničko Ime**
   - **Lozinka**
   - **Ime i Prezime**
   - **Email**
   - **Telefon**
   - **Uloga:** Admin / Član IO / Član / Član Porodice / Blagajnik
4. Kliknite **Kreiraj**

### Profil Korisnika

**Uređivanje Vlastitog Profila:**
1. Kliknite na svoje ime u gornjem desnom uglu
2. Odaberite **Profil**
3. Promijenite podatke:
   - Ime i prezime
   - Email
   - Telefon
   - Lozinka (ako želite promijeniti)
4. Kliknite **Sačuvaj**

### Porodični Odnosi

**Dodavanje Člana Porodice:**
1. Otvorite svoj profil
2. Kliknite **Dodaj Člana Porodice**
3. Odaberite korisnika iz liste
4. Definirajte odnos (supružnik, dijete, roditelj)
5. Kliknite **Dodaj**

---

## Postavke

### Promjena Jezika

**Način 1 - Login Stranica:**
- Kliknite na zastavu odgovarajućeg jezika (🇧🇦 🇩🇪 🇺🇸)

**Način 2 - Dashboard:**
1. Kliknite na svoje ime
2. Odaberite **Postavke**
3. Odaberite jezik iz dropdown-a
4. Kliknite **Sačuvaj**

### Bodovna Postavka

**Objašnjenje Sistema Bodovanja:**
- Admin može dodati detaljan opis kako se bodovi dodjeljuju
- Opis je vidljiv svim korisnicima na stranici **Postavke**
- Koristi se za transparentnost i razumijevanje sistema

**Postavljanje Objašnjenja (Admin):**
1. Otvorite **Postavke**
2. Kliknite **Uredi Objašnjenje Bodova**
3. Napišite detaljan opis sistema
4. Kliknite **Sačuvaj**

---

## Najčešća Pitanja (FAQ)

### Kako resetovati lozinku?
Trenutno resetovanje lozinke radi Admin. Kontaktirajte administratora džemata.

### Zašto ne vidim određenu sekciju?
Sekcija može biti **privatna**. Zatražite pristup od moderatora ili administratora.

### Kako se računaju bodovi za grupne zadatke?
Svi članovi tima dobivaju **puni broj bodova** kada se zadatak završi.

### Mogu li otkazati RSVP?
Da! Jednostavno kliknite ponovo na dugme i promijenite status.

### Kako mogu predložiti novu aktivnost?
Ako ste moderator, koristite **Novi Prijedlog**. Ako ste standardni član, kontaktirajte svog moderatora.

### Gdje mogu vidjeti svoje bodove?
Na **Dashboard-u** u sekciji "Moji Bodovi" ili u **Profilu**.

---

## Tehnička Podrška

Za tehničke probleme ili pitanja kontaktirajte:

- **Email:** admin@dzematapp.com
- **Telefon:** +41 XX XXX XX XX

---

## Verzija

**DžematApp v1.0**  
Datum: 25.10.2025  

© 2025 DžematApp. Sva prava zadržana.
