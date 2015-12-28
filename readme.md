# Pokemon TCG Scraper

## Introduction

PkmnCardsScraper is a module for scraping pkmncards.com, a database of cards used in the Pokemon trading card game.
The resulting data can be used to populate databases, make calculations, or any other purpose.

## Usage

First, to install the module, simply run `npm install pkmncards-scraper`, and in your code add
`var scraper = require('pkmncards-scraper')`

You can then run queries using the promise interface (note: there is no callback interface, but you can treat the then()
argument as the callback). The main way to use the module is with the `scrapeAll` function. For example, if you wanted
data on all 7000 cards in the pkmncards database, you would use:

```javascript
scraper.scrapeAll().then(function(cards){
    //Do something with data
});
```

This will print an array of cards like this:

```json
[
   {
      "smallImg":"http://pkmncards.com/wp-content/uploads/altaria-xy-promos-xy46-312x432.jpg",
      "largeImg":"http://pkmncards.com/wp-content/uploads/altaria-xy-promos-xy46.jpg",
      "name":"Altaria",
      "set":"XY Promos",
      "specificType":"Stage 1",
      "basicType":"Pokemon",
      "evolvesFrom":"Swablu",
      "color":"Colorless",
      "hp":90,
      "traits":[
         {
            "name":"Δ Evolution",
            "text":"You may play this card from your hand to evolve a Pokémon during your first turn or the turn you play that Pokémon."
         }
      ],
      "abilities":[
         {
            "name":"Clear Humming",
            "text":"Each of your [C] Pokémon has no Weakness."
         }
      ],
      "attacks":[
         {
            "cost":[
               "[C]",
               "[C]"
            ],
            "damage":"30",
            "text":"30 damage.",
            "name":"Wing Attack"
         }
      ],
      "weakness":{
         "type":"Lightning",
         "value":"x2"
      },
      "resistance":{
         "type":"Lightning",
         "value":"x2"
      },
      "retreatCost":"1",
      "setId":"XY46",
      "rarity":"Promo"
   }
]
```

## API

The TCG scraper exposes only one main function: `scrapeAll(query)`

`scrapeAll` Queries the pkmncards.com using the first parameter, which is an object consisting of key/value
pairs to be used in the query string. The specification of this is described in the node querystring module. The function
returns an array of cards, each with a `url` and `image` property. If scrapeDetails is true, which it is by default, then
the scraper will also run scrapeCard on each card, and augment it with all the fields listed in the output section.
## Output

### Pokemon

If the scraper encounters a pokemon card, it outputs objects with the following fields

 * `smallImg`: The URL of the 312x432 pixel version of the card image, e.g. "http://pkmncards.com/wp-content/uploads/altaria-xy-promos-xy46-312x432.jpg"
 * `largeImg`: The URL of the full scan of the card, e.g. "http://pkmncards.com/wp-content/uploads/altaria-xy-promos-xy46.jpg"
 * `name`: The pokemon's name, e.g. "Altaria",
 * `set`: The set the card is from, e.g. "XY Promos"
 * `basicType`: The overall type of the card. Can be either "Trainer", "Energy", or "Pokemon"
 * `specificType`: The specific of card, e.g. "Stage 1",
 * `evolvesFrom`: The previous evolution, e.g. "Swablu",
 * `hp`: The card's hit points, e.g. 90,
 * `color`: The card's colour, e.g. "Colorless",
 * `abilities`:  The card's passive abilities (Ability, Pokemon Power, Poke Body etc.)
 Each contains a `name` and `text` field.
 e.g.
```json
[
    {
        "name":"Clear Humming",
        "text":"Each of your [C] Pokémon has no Weakness."
    }
]
```
 * `traits`:  The card's ancient traits. Each contains a `name` and `text` field.
 e.g.
```json
[
    {
        "name":"Δ Evolution",
        "text":"You may play this card from your hand to evolve a Pokémon during your first turn or the turn you play that Pokémon."
    }
],
```
 * `attacks` An array of attacks, consisting of `cost`, `name`, `damage`, and `text`. E.g.
```json
[
    {
        "cost":[
           "[C]",
           "[C]"
        ],
        "damage":"30",
        "text":"30 damage.",
        "name":"Wing Attack"
    }
]
```
 * `weaknesses` An object with `type` and `value` fields indicating the Pokemon's weakness. E.g.
 ```json
{
    "type":"Lightning",
    "value":"x2"
},
```
 * `resistances` An object with `type` and `value` fields. E.g.
```json
{
    "type":"Lightning",
    "value":"x2"
}
```
 * `retreatCost` The cost (as an integer, the number of colourless energies) to retreat the Pokemon. E.g. 2

### Other

All other cards (energies and trainers) simply have the fields `name` and `text`.
