/**
 * MENU voor Pink Almond — afgeleid van de echte menukaart in de winkel.
 *
 * Dit is het default-menu dat gebruikt wordt zolang er nog niets in
 * localStorage of (later) een database staat. Mo kan items via de
 * admin-pagina toevoegen / wijzigen / verwijderen.
 *
 * Datastructuur per item:
 *   id, categoryId, name, description, price (in euro)
 *   configurable: 'ijs' → toont smaak-keuze + verpakking + slagroom + wafel
 *                 (afwezig of false → simpele +1 knop, geen modal)
 *   scoops:       aantal smaak-keuzes (alleen voor configurable: 'ijs')
 *   hasSlagroom:  toont slagroom-vinkje bij bestellen (default: false)
 *   hasWafel:     toont wafel-vinkje bij bestellen (default: false)
 *
 * SMAKEN zijn een aparte lijst — gebruikt door alle ijs-items.
 *
 * Prijzen zijn getallen (1.75 = €1,75).
 */

const MENU_DATA = {
  smaken: [
    'Vanille',
    'Chocolade',
    'Aardbei',
    'Pistache',
    'Hazelnoot',
    'Stracciatella',
    'Citroen',
    'Mango',
  ],

  toppings: {
    slagroom: { id: 'slagroom', name: 'Slagroom',                price: 0.80 },
    wafel:    { id: 'wafel',    name: 'Brusselse wafel erbij',   price: 2.50 },
  },

  categories: [
    { id: 'ijs',     name: 'IJs',                  icon: 'cone' },
    { id: 'gebak',   name: 'Gebak & smoothies',    icon: 'cake' },
    { id: 'koffie',  name: 'Koffie & thee',        icon: 'cup'  },
  ],

  items: [
    // --- IJs (configurable) ---
    { id: 'bol1',    categoryId: 'ijs', name: '1 bol ijs',     price: 1.75,  description: 'Eén bol vers ijs in een hoorntje of bakje.',
      configurable: 'ijs', scoops: 1, hasSlagroom: true, hasWafel: true },
    { id: 'bol2',    categoryId: 'ijs', name: '2 bollen ijs',  price: 3.50,  description: 'Twee bollen — kies twee smaken.',
      configurable: 'ijs', scoops: 2, hasSlagroom: true, hasWafel: true },
    { id: 'bol3',    categoryId: 'ijs', name: '3 bollen ijs',  price: 5.25,  description: 'Drie bollen — combineer naar hartelust.',
      configurable: 'ijs', scoops: 3, hasSlagroom: true, hasWafel: true },
    { id: 'liter05', categoryId: 'ijs', name: '½ liter ijs',   price: 12.00, description: 'Om mee naar huis te nemen — 2 smaken.',
      configurable: 'ijs', scoops: 2, hasSlagroom: false, hasWafel: false, takeawayOnly: true },
    { id: 'liter1',  categoryId: 'ijs', name: '1 liter ijs',   price: 18.00, description: 'Om mee naar huis te nemen — 3 smaken.',
      configurable: 'ijs', scoops: 3, hasSlagroom: false, hasWafel: false, takeawayOnly: true },

    // --- Gebak & smoothies ---
    { id: 'wafel-puur',  categoryId: 'gebak', name: 'Brusselse wafel naturel',  price: 2.50, description: 'Krokante, luchtige Brusselse wafel.' },
    { id: 'wafel-pdr',   categoryId: 'gebak', name: 'Wafel met poedersuiker',   price: 3.00, description: 'Met een laagje verse poedersuiker.' },
    { id: 'wafel-choc',  categoryId: 'gebak', name: 'Wafel met chocoladesaus',  price: 4.00, description: 'Warme wafel met smeltende chocoladesaus.' },
    { id: 'wafel-ijs',   categoryId: 'gebak', name: 'Wafel met ijs & slagroom', price: 5.75, description: 'Wafel met 1 bol ijs en een toef slagroom.' },
    { id: 'smoothie',    categoryId: 'gebak', name: 'Verse smoothie',           price: 5.50, description: 'Vers gemaakte fruitsmoothie van het seizoen.' },
    { id: 'ijskoffie',   categoryId: 'gebak', name: 'IJskoffie',                price: 4.00, description: 'IJskoud, romig en heerlijk koffie-fris.' },

    // --- Koffie & thee ---
    { id: 'koffie',       categoryId: 'koffie', name: 'Koffie',              price: 3.00, description: '' },
    { id: 'cappuccino',   categoryId: 'koffie', name: 'Cappuccino',          price: 3.50, description: '' },
    { id: 'latte',        categoryId: 'koffie', name: 'Latte macchiato',     price: 3.75, description: '' },
    { id: 'flatwhite',    categoryId: 'koffie', name: 'Flat white',          price: 3.75, description: '' },
    { id: 'espresso',     categoryId: 'koffie', name: 'Espresso',            price: 3.00, description: '' },
    { id: 'doublespresso',categoryId: 'koffie', name: 'Dubbele espresso',    price: 3.50, description: '' },
    { id: 'thee',         categoryId: 'koffie', name: 'Thee',                price: 3.00, description: '' },
    { id: 'gemberthee',   categoryId: 'koffie', name: 'Verse gemberthee',    price: 3.75, description: '' },
    { id: 'matcha',       categoryId: 'koffie', name: 'Matcha latte',        price: 3.75, description: '' },
    { id: 'choco',        categoryId: 'koffie', name: 'Warme chocolademelk', price: 4.50, description: '' },
  ],
};
