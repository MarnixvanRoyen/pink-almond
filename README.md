# Pink Almond — IJS & GEBAK bij MO

Bestelwebsite voor Pink Almond, de ijs-, gebak- en koffiezaak van Mo.

- **Klant-pagina** (`index.html`) — kies producten, stel een ijsje samen, vul je naam in, klaar.
- **Personeels-portaal** (`admin.html`) — PIN-beveiligd. Open bestellingen afvinken, kassa-modus, menu beheren, omzet bekijken.

## Features

- Ijs-configurator met smaakkeuze, hoorntje of bakje, en losse extra's (slagroom, wafel).
- Mobile-first met sticky categorie-dropdown en scroll-spy.
- Kassa-modus: snel afrekenen aan de balie.
- Mo kan zelf het menu beheren — items, categorieën, prijzen en smaken — zonder code aan te raken.
- Overzicht met grafieken (Chart.js): bestellingen + omzet per dag, week, maand of jaar.
- CSV-export voor de boekhouding.
- Eenvoudige status: open → voldaan. Eén knop om af te ronden.
- Bestelnummer als `PA-0001` (oplopend).
- Cross-tab sync: wijzigt Mo het menu in tab 1, dan ziet de klant in tab 2 dat meteen.

## Mappenstructuur

```
Pink Almond/
├── index.html          ← klant-pagina
├── admin.html          ← personeels-portaal (PIN: 1234)
├── css/
│   └── style.css       ← alle styling
├── js/
│   ├── menu-data.js    ← producten, smaken en prijzen als pure data
│   ├── app.js          ← klant-logica
│   └── admin.js        ← admin-logica + Chart.js
├── mo.jpeg             ← Mo's foto
├── gevel.jpeg          ← gevel-foto
├── interieur.jpeg      ← interieur-foto
└── README.md
```

## Hoe te openen (lokaal)

Dubbelklik op `index.html`. Geen installatie nodig.

## Eerste keer proberen

1. Open `index.html` in je browser.
2. Klik rechtsboven op **🔒 Personeel** en vul **`1234`** in.
3. Ga naar **⚙️ Instellingen → + Demo-data** voor zes voorbeeld-bestellingen.
4. Bekijk **📋 Bestellingen**, **📊 Overzicht** (grafiekjes!) en **🍦 Menu** (zelf items toevoegen).
5. Klik op het logo om terug te gaan naar de winkel-kant en plaats een echte test-bestelling.

## Live online

De repo wordt automatisch gepubliceerd via GitHub Pages:

**https://marnixvanroyen.github.io/pink-almond/**

## Aanpassen voor de echte winkel

Mo hoeft (bijna) niets in de code aan te raken:

| Wat? | Waar? |
| --- | --- |
| Items, prijzen, categorieën, smaken | Admin → 🍦 Menu |
| Pincode | Admin → ⚙️ Instellingen |
| Demo-data laden / wissen | Admin → ⚙️ Instellingen |
| Adres / openingstijden / telefoon | Handmatig in `index.html` (zoek op "openingstijden") |
| Logo / kleuren | `css/style.css` (CSS-variabelen bovenin) |

## Technische beperkingen (eerlijk verhaal)

- **Data per browser/apparaat.** Bestellingen en menu-wijzigingen leven in `localStorage`. Werkt prima op één werkplek; wil je meerdere apparaten in de winkel die elkaar zien, dan is een back-end nodig (Supabase of vergelijkbaar) — dat is fase 2.
- **Geen online betaling.** Klanten betalen in de winkel.
- **CSV regelmatig exporteren** als back-up.

## Licentie

Eigen project van Pink Almond / Mo. Gemaakt met liefde 🍦.
