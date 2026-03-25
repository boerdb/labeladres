# Phomemo M110 integratie in personen-app

Dit document beschrijft hoe de app is opgebouwd, welke onderdelen betrokken zijn bij het printen, en welke stappen zijn uitgevoerd om een Phomemo M110 via Bluetooth LE te koppelen en adreslabels te printen.

## Doel

De app is uitgebreid zodat adressen uit de personenlijst direct naar een Phomemo M110 labelprinter gestuurd kunnen worden.

De oplossing doet het volgende:

- koppelt via Bluetooth LE met de M110
- onthoudt de laatst gekoppelde printer
- reconect automatisch bij het openen van de lijst
- rendert een adreslabel als bitmap op een canvas
- verstuurt die bitmap in BLE-chunks naar de printer
- ondersteunt enkel printen en batchprinten

## Projectopbouw

De belangrijkste onderdelen voor deze functie zijn:

- `src/app/lijst/lijst.page.ts`
  - UI-logica voor de personenlijst
  - printer koppelen/ontkoppelen
  - enkel printen
  - batchprinten met tussenpauze zodat de wachtrij niet volloopt
- `src/app/lijst/lijst.page.html`
  - knoppen voor printer koppelen
  - selectie van meerdere adressen
  - knop voor batchprint
- `src/app/services/printer.ts`
  - Bluetooth LE initialisatie
  - device scan en verbinden
  - service/characteristic detectie
  - verzenden van bitmapdata naar de M110
- `src/app/services/address-label-renderer.service.ts`
  - opbouw van het label op een HTML canvas
  - tekstlayout
  - KIX-achtige barcode onder het adres
- `src/app/services/personen.ts`
  - ophalen en verwijderen van personen via de API
- `src/app/utils/icons.ts`
  - extra iconen voor bluetooth en printen

## Benodigde packages

Voor de printerkoppeling is deze package gebruikt:

- `@capacitor-community/bluetooth-le`

Voor Android is toegevoegd:

- `@capacitor/android`

Er wordt nu geen externe barcode-library meer gebruikt. De barcode wordt direct in de renderer opgebouwd.

## Android stappen die zijn uitgevoerd

Omdat het project nog geen Android-platform had, zijn deze stappen gedaan:

```powershell
npm install @capacitor/android@8.2.0
npx cap add android
npx cap sync android
npx ionic capacitor build android
```

Daarna kan Android Studio geopend worden met:

```powershell
npx cap open android
```

## Bluetooth profiel van de Phomemo M110

De werkende M110 BLE-configuratie in deze app is:

- service UUID: `0000ff00-0000-1000-8000-00805f9b34fb`
- write characteristic: `0000ff02-0000-1000-8000-00805f9b34fb`
- notify characteristic: `0000ff03-0000-1000-8000-00805f9b34fb`

Er zitten ook alternatieve profielen in de code voor andere Phomemo-varianten, maar voor de M110 is `ff00/ff02/ff03` de hoofdroute.

## Hoe koppelen werkt

De koppeling verloopt via `PrinterService`.

### 1. BLE klaarzetten

`ensureBleReady()` doet:

- `BleClient.initialize()`
- op Android controleren of locatievoorzieningen actief zijn
- zo nodig de Android locatie-instellingen openen

Locatie moet op Android aan staan, anders werkt BLE-scannen vaak niet betrouwbaar.

### 2. Automatisch reconnecten

De laatst gekoppelde printer wordt opgeslagen in `localStorage` onder:

- `phomemo.lastDeviceId`

Bij het openen van de lijst probeert `autoReconnectSaved()` opnieuw verbinding te maken.

### 3. Verbinden met een printer

`connect()` werkt in deze volgorde:

1. controleren of er al een gekoppeld Android BLE-device beschikbaar is
2. als dat niet lukt: een device picker openen met `BleClient.requestDevice()`
3. verbinden met het gekozen device
4. services discoveren
5. de juiste schrijfbare characteristic kiezen
6. notifications inschakelen als de notify characteristic bestaat

## Hoe printen werkt

De app print niet via gewone tekstcommando's, maar via een bitmap.

Dat is bewust zo gedaan, omdat de M110 in de praktijk veel betrouwbaarder reageert op een raster/bitmap-print dan op pure ESC/POS-tekst.

### Stap 1. Gebruiker kiest een persoon

In `lijst.page.ts` kan de gebruiker:

- één label printen via de printknop naast een persoon
- meerdere personen selecteren en daarna batchprint starten

### Stap 2. Label renderen

`AddressLabelRendererService.renderPersoon()` maakt een canvas met:

- naam
- straat en huisnummer
- postcode en woonplaats
- KIX-achtige barcode onder de adresregels

Belangrijke afmetingen:

- labelrol: 50 x 80 mm
- werkelijke printbare breedte van de M110: 43 mm
- resolutie: 8 dots per mm

Daarom is het canvas intern zo opgezet dat het goed uitkomt na de rotatie die in de printerservice plaatsvindt.

### Stap 3. Canvas omzetten naar 1-bit bitmap

`PrinterService.processCanvas()` doet:

1. canvas uitlezen als pixels
2. 90 graden roteren
3. helderheid per pixel bepalen
4. donkere pixels omzetten naar 1-bit zwart/wit data
5. die data verpakken in een `GS v 0` raster bitmap commando

Er wordt geen extra feed of cut toegevoegd aan het einde, omdat de M110 anders ongewenst extra door kan voeren.

### Stap 4. Data in BLE chunks versturen

De actuele instellingen zijn:

- `CHUNK_SIZE = 192`
- `CHUNK_DELAY = 25`

De data wordt dus niet in één groot blok verstuurd, maar in kleine stukken met een korte pauze ertussen.

Dat geeft een betere balans tussen snelheid en stabiliteit.

## Batchprint en wachtrijbeheersing

Bij meerdere labels achter elkaar zit er nog een extra tussenpauze tussen complete labels.

In `lijst.page.ts` staat:

- `batchPrintPauzeMs = 900`

Na elk label in een batch wacht de app kort voordat het volgende label wordt opgebouwd en verstuurd.

Dat is toegevoegd om te voorkomen dat de printerbuffer of wachtrij volloopt wanneer bijvoorbeeld 10 labels achter elkaar geprint worden.

## Barcode

Onder het adres wordt nu een KIX-achtige 4-state barcode getekend.

De invoer voor die barcode wordt opgebouwd uit:

- postcode
- huisnummer
- checksum

Belangrijk: dit is een praktische, PostNL-achtige adresbarcode voor sortering en herkenning, maar niet gegarandeerd een officiële PostNL productbarcode.

## Gebruikersflow in de app

De gebruikelijke flow is:

1. open de personenlijst
2. druk op `Printer koppelen`
3. kies de Phomemo M110
4. print één adres of selecteer meerdere adressen
5. druk op `Print selectie` voor batchprint

De knopstatus bovenin laat zien of de printer gekoppeld is.

## Korte gebruikershandleiding

Dit deel is bedoeld voor normaal gebruik van de app, zonder technische details.

### Printer voor het eerst koppelen

1. Open de pagina `Mijn Adressen`.
2. Zorg dat de Phomemo M110 aan staat.
3. Zet Bluetooth aan op de telefoon of tablet.
4. Druk bovenin op `Printer koppelen`.
5. Kies in de Bluetooth-lijst de Phomemo printer.
6. Wacht tot de app bovenin laat zien dat de printer gekoppeld is.

Op Android kan het zijn dat locatie ook aan moet staan. Zonder locatie werkt Bluetooth LE vaak niet goed.

### Eén label printen

1. Zoek in de lijst de persoon waarvan je een label wilt printen.
2. Druk op het print-icoon naast die persoon.
3. De app maakt eerst het label op en verstuurt het daarna naar de printer.
4. Onderaan verschijnt een melding als het label is verzonden.

Als er nog geen printer verbonden is, probeert de app eerst alsnog te koppelen.

### Een batch labels printen

1. Vink in de lijst de personen aan die je wilt printen.
2. Je kunt eventueel eerst op `Selecteer zichtbaar` drukken om alle getoonde personen te selecteren.
3. Druk daarna op `Print selectie`.
4. De labels worden één voor één verzonden.
5. Tijdens het printen laat de knop zien hoeveel labels al verwerkt zijn.

Tussen labels zit bewust een korte pauze. Dat is gedaan zodat de wachtrij van de printer niet volloopt bij grotere batches.

## Relevante technische keuzes

Tijdens de bouw van deze functie zijn deze keuzes gemaakt:

- bitmap-printing in plaats van tekst-printing
- BLE write met bevestiging voor betrouwbaarheid
- bewaakte chunkgrootte in plaats van grote bursts
- extra wachttijd tussen batchlabels
- printer-id onthouden voor auto reconnect
- label centreren en lettergrootte verhogen voor betere leesbaarheid op thermische labels

## Test- en controlecommando's

Voor controle van de webbuild is gebruikt:

```powershell
npm run build
```

Voor Android is gebruikt:

```powershell
npx ionic capacitor build android
```

## Als je later iets wilt bijstellen

De belangrijkste afstelpunten zijn:

- `CHUNK_SIZE` in `src/app/services/printer.ts`
- `CHUNK_DELAY` in `src/app/services/printer.ts`
- `batchPrintPauzeMs` in `src/app/lijst/lijst.page.ts`
- layout- en barcode-afmetingen in `src/app/services/address-label-renderer.service.ts`

Als de printer in de praktijk te traag of juist instabiel blijkt, zijn dit de eerste waarden om te tunen.
