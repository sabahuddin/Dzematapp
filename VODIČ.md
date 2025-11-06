# DžematApp - Vodič za korisnike

## Sadržaj
1. [Prijava na sistem](#prijava-na-sistem)
2. [Uloge korisnika](#uloge-korisnika)
3. [Upravljanje sekcijama](#upravljanje-sekcijama)
4. [Upravljanje zadacima](#upravljanje-zadacima)
5. [Arhiva zadataka](#arhiva-zadataka)
6. [Prijedlozi](#prijedlozi)
7. [Bulk upload korisnika](#bulk-upload-korisnika)

---

## Prijava na sistem

1. Otvorite aplikaciju u web pregledaču
2. Unesite korisničko ime i šifru
3. Kliknite na "Prijavi se"

### Gostujući pristup
- Gosti mogu pristupiti obavijestima, događajima i vremenima molitve bez prijave
- Za pristup ostalim funkcijama potrebna je prijava

---

## Uloge korisnika

### Admin
**Pristup:** Potpun pristup svim funkcionalnostima

**Mogućnosti:**
- Upravljanje korisnicima (dodavanje, izmjena, brisanje)
- Kreiranje i upravljanje sekcijama
- Arhiviranje i brisanje sekcija
- Odobravanje zahtjeva za pristup sekcijama
- Pregled arhive svih zadataka
- Odobravanje/odbijanje prijedloga
- Dodjela moderatora sekcijama

### Član IO (Izvršni Odbor)
**Pristup:** Prošireni pristup sa pregledima

**Interfejs - 2 glavna taba:**

#### Tab 1: "Moje sekcije"
Ovaj tab ima 3 pod-taba:
- **Moje sekcije**: Sekcije gdje ste član
- **Ostale sekcije**: Sve ostale sekcije koje možete vidjeti
- **Prijedlozi**: Read-only pregled svih prijedloga (bez mogućnosti odobravanja/odbijanja)

#### Tab 2: "Zatraži pristup"
- Prikazuje sve javne sekcije gdje niste član
- Možete zatražiti pristup uz potvrdu

### Član (Obični član)
**Pristup:** Osnovno članstvo

**Interfejs - 2 taba:**

#### Tab 1: "Moje sekcije"
- Prikazuje sve sekcije gdje ste član
- Možete vidjeti zadatke i izvještaje

#### Tab 2: "Zatraži pristup"
- Prikazuje sve javne sekcije gdje niste član
- Možete zatražiti pristup uz potvrdu

### Moderator sekcije
**Pristup:** Upravljanje dodijeljenom sekcijom

**Mogućnosti:**
- Kreiranje i dodjela zadataka
- Upravljanje članovima sekcije
- Pregled statistika sekcije
- Kreiranje prijedloga

**NAPOMENA:** Moderator NE može mijenjati završene zadatke!

---

## Upravljanje sekcijama

### Kreiranje nove sekcije (Admin)
1. Idite na "Sekcije" stranicu
2. Kliknite "Kreiraj novu sekciju"
3. Unesite naziv i opis
4. Odaberite vidljivost (javna/privatna)
5. Kliknite "Sačuvaj"

### Arhiviranje sekcije (Admin)
1. Pronađite sekciju koju želite arhivirati
2. Kliknite na dugme "Arhiviraj"
3. Potvrđujte akciju

**Napomena:** Arhivirane sekcije se skrivaju od običnih korisnika i članova IO, ali admini ih mogu vidjeti i vratiti.

### Brisanje sekcije (Admin)
1. Pronađite sekciju koju želite obrisati
2. Kliknite na dugme "Obriši"
3. Potvrđujte akciju

**UPOZORENJE:** Brisanje sekcije je trajna akcija!

### Zahtjev za pristup sekciji (Član, Član IO)
1. Idite na tab "Zatraži pristup"
2. Pronađite javnu sekciju koja vas interesuje
3. Kliknite "Zatraži pristup"
4. Pojavit će se dialog: "Jeste li sigurni da želite biti član ove sekcije?"
5. Kliknite "DA" za potvrdu ili "OTKAŽI" za odustajanje
6. Čekajte odobrenje od admina

---

## Upravljanje zadacima

### Kreiranje zadatka (Admin, Moderator)
1. Odaberite sekciju
2. Kliknite "Kreiraj novi zadatak"
3. Popunite podatke:
   - Naslov zadatka
   - Opis
   - Članovi kojima se dodjeljuje
   - Rok (opcionalno)
   - Bodovi (10, 20, 30 ili 50)
   - Procijenjeni trošak (opcionalno)
4. Kliknite "Sačuvaj"

### Označavanje zadatka kao završenog (Član)
1. Pronađite zadatak koji vam je dodijeljen
2. Kliknite "Označi kao završeno"
3. Ako postoji procijenjeni trošak, možete uploadovati račun (sliku ili PDF)
4. Potvrđujte

**VAŽNO:** Nakon što se zadatak označi kao završen, postaje READ-ONLY i više se ne može mijenjati!

### Izmjena zadatka (Admin, Moderator)
1. Kliknite na zadatak
2. Kliknite "Uredi"
3. Izvršite izmjene
4. Sačuvajte

**NAPOMENA:** Završeni zadaci NE mogu biti mijenjani! Sistem će odbiti pokušaj sa porukom:
"Završeni i arhivirani zadaci ne mogu biti mijenjani. Zadatak je zaključan."

---

## Arhiva zadataka

### Pregled arhive sekcije (Svi članovi)
1. Uđite u svoju sekciju
2. Kliknite na tab "Arhiva"
3. Vidjet ćete sve završene zadatke
4. Možete kliknuti na zadatak za detalje (read-only)

### Pregled arhive svih zadataka (Samo Admin)
1. Idite na "Sekcije" stranicu
2. Kliknite na tab "Arhiva svih zadataka"
3. Koristite filtere za pretragu:
   - **Po sekciji**: Odaberite specifičnu sekciju
   - **Po korisniku**: Odaberite specifičnog člana
   - **Po datumu**: Odaberite period (sve, zadnjih 7/30/90 dana)
4. Rezultati se sortiraju po datumu završetka (najnoviji prvi)

---

## Prijedlozi

### Kreiranje prijedloga (Moderator)
1. Uđite u vašu sekciju
2. Kliknite "Kreiraj prijedlog"
3. Popunite detalje prijedloga:
   - Naziv aktivnosti
   - Opis
   - Procijenjeni budžet
   - Datum planiranog početka
4. Kliknite "Pošalji prijedlog"
5. Čekajte odobrenje od admina

### Pregled prijedloga (Član IO)
1. Idite na "Moje sekcije" tab
2. Kliknite na pod-tab "Prijedlozi"
3. Vidjet ćete sve prijedloge u read-only modu
4. Možete kliknuti na prijedlog za detalje

**NAPOMENA:** Član IO može samo VIDJETI prijedloge, ali ne može ih odobriti ili odbiti!

### Odobravanje/odbijanje prijedloga (Admin)
1. Idite na "Prijedlozi" tab
2. Pronađite prijedlog koji želite pregledati
3. Pročitajte detalje
4. Kliknite "Odobri" ili "Odbij"
5. Po potrebi unesite komentar
6. Potvrđujte

---

## Bulk upload korisnika

### Preuzimanje template-a (Admin)
1. Idite na "Korisnici" stranicu
2. Kliknite "Bulk Upload"
3. Kliknite "Preuzmi Template"
4. Excel fajl će se automatski preuzeti

### Struktura template-a (11 kolona)
1. **Ime** - obavezno
2. **Prezime** - obavezno
3. **Korisničko ime** - obavezno, jedinstveno
4. **Šifra** - obavezno
5. **Email** - opcionalno, jedinstveno ako se unese
6. **Telefon** - opcionalno
7. **Ulica i broj** - opcionalno
8. **Broj pošte** - opcionalno
9. **Naziv mjesta** - opcionalno
10. **Član od** - opcionalno (format: YYYY-MM-DD, npr. 2024-01-15)
11. **Status članstva** - obavezno (aktivan, pasivan, ili član porodice)

### Popunjavanje template-a
1. Otvorite preuzeti Excel fajl
2. Popunite podatke za svakog korisnika
3. Pazite na format datuma: YYYY-MM-DD
4. Status članstva mora biti: aktivan, pasivan ili član porodice
5. Korisničko ime mora biti jedinstveno za svakog korisnika

### Upload fajla (Admin)
1. Kliknite "Odaberi fajl"
2. Odaberite popunjeni Excel fajl
3. Kliknite "Uploaduj"
4. Sistem će automatski:
   - Validirati podatke
   - Provjeriti duplikate
   - Kreirati korisnike
   - Prikazati rezultate (broj uspješnih, broj grešaka)

### Primjer podataka
```
Ime     | Prezime   | Korisničko ime | Šifra       | Email             | Telefon           | Ulica i broj        | Broj pošte | Naziv mjesta | Član od    | Status članstva
Marko   | Marković  | marko.markovic | password123 | marko@example.com | +387 61 123 456   | Maršala Tita 15     | 71000      | Sarajevo     | 2024-01-15 | aktivan
Ana     | Anić      | ana.anic       | password123 | ana@example.com   | +387 62 234 567   | Kralja Tvrtka 22    | 72000      | Zenica       | 2023-06-20 | aktivan
```

---

## Česta pitanja (FAQ)

**P: Mogu li izmijeniti završeni zadatak?**
O: Ne. Završeni zadaci su zaključani i ne mogu biti mijenjani ni od strane moderatora. Sistem će vratiti grešku ako pokušate.

**P: Šta se dešava sa arhiviranom sekcijom?**
O: Arhivirana sekcija se skriva od običnih korisnika i članova IO, ali admini je mogu vidjeti i vratiti u aktivno stanje.

**P: Mogu li vidjeti zadatke iz drugih sekcija?**
O: Obični članovi mogu vidjeti samo zadatke iz sekcija gdje su članovi. Član IO može vidjeti zadatke iz svih sekcija. Admini imaju pristup svim zadacima.

**P: Da li mogu sam odobriti svoj prijedlog?**
O: Ne. Prijedloge mogu odobriti samo admini. Član IO može vidjeti prijedloge ali ne može ih odobriti.

**P: Šta se dešava ako zatražim pristup privatnoj sekciji?**
O: Vaš zahtjev se šalje administratoru koji će ga pregledati i odobriti ili odbiti.

**P: Mogu li preuzeti arhivu zadataka?**
O: Trenutno sistem ne podržava export, ali možete pregledati sve zadatke kroz interfejs.

---

## Kontakt i podrška

Za dodatna pitanja ili probleme, kontaktirajte administratora sistema.

**Verzija:** 2.0  
**Posljednje ažuriranje:** Novembar 2025
