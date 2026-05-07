# Pink Almond — IJS & GEBAK bij MO

Bestelwebsite voor Pink Almond, de ijs-, gebak- en koffiezaak van Mo.

Er zijn nu **twee versies** in deze repo, zodat je rustig kunt vergelijken voor we definitief overstappen:

| Versie | URL (lokaal) | URL (live, na push) | Wat? |
| --- | --- | --- | --- |
| **v1** | `index.html` | `https://marnixvanroyen.github.io/pink-almond/` | De originele single-file versie |
| **v2** | `v2/index.html` | `https://marnixvanroyen.github.io/pink-almond/v2/` | Nieuwe modulaire versie, geïnspireerd op de Kapitein-Jack-opzet |

## Wat is er nieuw in v2?

- **Modulaire bestandsstructuur** — gescheiden HTML, CSS en JavaScript. Aparte `index.html` voor klanten en `admin.html` voor personeel.
- **Mo kan zelf het menu beheren** — items, categorieën, prijzen en smaken toevoegen / wijzigen / verwijderen via de admin-pagina. Geen code aanraken meer.
- **Eenvoudige bestelstatus** — open → voldaan. Eén knop ✅ Voldaan om af te ronden. Geen bereidingstijd-gedoe, geen meldingen, geen geluiden.
- **Echte grafieken** met Chart.js: aantal bestellingen + omzet per dag / week / maand / jaar.
- **Mobile-first** met sticky categorie-dropdown en scroll-spy. Werkt fijn op je telefoon.
- **Bestelnummer als `PA-0001`** (oplopend), klantvriendelijker dan willekeurige codes.
- **Eenvoudige bestelflow** — klant kiest items en vult alleen z'n naam in. Geen ophaaltijd, geen telefoonnummer, geen verplichte velden.
- **Cross-tab sync** — wijzigt Mo het menu in tab 1, dan ziet de klant in tab 2 dat meteen.

## Mappenstructuur (v2)

```
v2/
├── index.html          ← klant-bestelpagina
├── admin.html          ← personeels-portaal (PIN-beveiligd)
├── css/
│   └── style.css       ← alle styling (klant + admin)
└── js/
    ├── menu-data.js    ← producten, smaken, prijzen als pure data
    ├── app.js          ← klant-logica
    └── admin.js        ← admin-logica (bestellingen, menu-editor, charts)
```

De foto's (`mo.jpeg`, `gevel.jpeg`, `interieur.jpeg`) blijven in de hoofdmap. v2 verwijst er relatief naar via `../mo.jpeg`.

## Hoe te openen (lokaal)

Dubbelklik op `v2/index.html` of `index.html`. Geen installatie nodig.

> Belangrijk: laat de foto's in dezelfde map staan als `index.html` (oude versie) of in de map ernaast (`v2/` opent ze één map omhoog).

## Eerste keer proberen (v2)

1. Open `v2/index.html` in je browser.
2. Klik rechtsboven op **🔒 Personeel** — pincode is **`1234`**.
3. Ga naar **Instellingen → + Demo-data** voor zes voorbeeld-bestellingen.
4. Bekijk **📋 Bestellingen** (een nieuwe heeft een rode rand!), **📊 Overzicht** (echte grafiekjes) en **🍦 Menu** (zelf items toevoegen).
5. Ga terug via "→ Naar winkel" en plaats een echte test-bestelling.

## Live online (GitHub Pages)

Beide versies worden mee-gepushed. Pages bedient ze allebei:

- v1: https://marnixvanroyen.github.io/pink-almond/
- v2: https://marnixvanroyen.github.io/pink-almond/v2/

Wanneer Mo v2 leuk vindt, kunnen we `index.html` en de oude versie verwijderen en alleen v2 behouden — of v2 naar de root verplaatsen.

## Aanpassen voor de echte winkel

In v2 hoeft Mo (bijna) niets meer in code aan te raken:

| Wat? | Waar? |
| --- | --- |
| Items, prijzen, categorieën, smaken | Admin → 🍦 Menu |
| Pincode | Admin → ⚙️ Instellingen |
| Demo-data | Admin → ⚙️ Instellingen |
| Adres / openingstijden / telefoon | Nog handmatig in `v2/index.html` |
| Logo / kleuren | `v2/css/style.css` (CSS-variabelen bovenin) |

## Technische beperkingen (eerlijk verhaal)

- **Data per apparaat / browser.** Alle bestellingen en menu-wijzigingen leven in `localStorage`. Test op één apparaat = OK; meerdere apparaten in de winkel die elkaar moeten zien = backend nodig (Supabase of vergelijkbaar). Dit is **fase 2**.
- **Geen online betaling.** Klanten betalen in de winkel.
- **CSV regelmatig exporteren** als back-up.

## Licentie

Eigen project van Pink Almond / Mo. Gemaakt met liefde 🍦.
