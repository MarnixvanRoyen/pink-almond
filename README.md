# Pink Almond — IJS & GEBAK bij MO

Eenvoudige bestelwebsite voor Pink Almond, de ijs-, gebak- en koffiezaak van Mo.
Gebouwd als één HTML-bestand: alles werkt zonder server, alle data wordt veilig in de browser opgeslagen.

## Wat zit erin?

- **Voor klanten** — homepage met Mo's foto en quote, volledige menukaart, online bestelflow met ijs-configurator (smaken, hoorntje/bakje, slagroom, wafel) en winkelmand.
- **Voor Mo (achter de schermen)** — beveiligd met pincode (standaard `1234`):
  - Dashboard met aantal bestellingen, totale omzet, top-producten en verdeling per categorie. Filterbaar op vandaag / week / maand / alles.
  - Kassa-modus voor snelle invoer aan de balie.
  - Bestellingen-overzicht met statussen (open / klaar / voldaan).
  - CSV-export voor de administratie.
  - Instellingen: pincode wijzigen, demo-data laden, alles wissen.

## Hoe te openen

Dubbelklik op `index.html`. De website opent in je browser. Geen installatie nodig.

> **Belangrijk:** laat `index.html` in dezelfde map staan als de foto's `mo.jpeg`, `gevel.jpeg`, `interieur.jpeg`. Die worden direct vanuit de map geladen.

## Eerste keer proberen

1. Open `index.html` in je browser.
2. Klik rechtsboven op **🔒 Personeel** en vul `1234` in.
3. Ga naar **Instellingen → Demo-data laden** voor een paar voorbeeld-bestellingen.
4. Bekijk **Dashboard** — je ziet meteen de omzet en top-producten.
5. Klik op de **Pink Almond** logo om terug te gaan naar de winkel-kant en plaats een echte test-bestelling.

## Live online (GitHub Pages)

Deze repo is geconfigureerd voor [GitHub Pages](https://pages.github.com/). Zodra Pages aanstaat, is de site bereikbaar op:

```
https://<jouw-github-naam>.github.io/pink-almond/
```

Mo kan de link op haar telefoon openen — geen installatie nodig.

## Aanpassen voor de echte winkel

Open `index.html` in een tekstbewerker (bijv. VS Code, TextEdit of Notepad++) en zoek naar:

| Wat? | Waar in het bestand? |
| --- | --- |
| Smaken (8 stuks) | `const SMAKEN = [...]` |
| Producten en prijzen | `const PRODUCTS = { ... }` |
| Slagroom-prijs | `const SLAGROOM_PRICE` |
| Wafel-prijs | `const WAFEL_PRICE` |
| Adres / telefoon | Zoek op `(adres invullen)` |
| Openingstijden | Zoek op `Openingstijden` |
| Pincode standaard | `STORAGE_PIN` (kan ook in-app via Instellingen) |

Sla het bestand op, ververs de browser — klaar.

## Hoe is het gemaakt?

- Eén bestand: `index.html` met HTML, CSS en JavaScript samen.
- Geen frameworks, geen build-stap. Vanilla JavaScript.
- Data-opslag via `localStorage` (per apparaat / browser).
- Lettertypes uit Google Fonts (Fredoka + Quicksand).
- Logo en iconen in pure SVG.

## Belangrijke beperkingen (eerlijk verhaal)

- **Data per apparaat.** Bestellingen die op de iPad worden geplaatst, zie je niet op de laptop — alle data zit in de browser waar de bestelling is gedaan. Voor één werkplek is dit ideaal; voor meerdere apparaten samen heb je later een back-end nodig.
- **Geen online betaling.** Klanten betalen in de winkel.
- **CSV regelmatig exporteren** als back-up — als de browser-cache wordt gewist, verdwijnen de bestellingen.

## Licentie

Eigen project van Pink Almond / Mo. Gemaakt met liefde.
