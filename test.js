var scraper = require("./index");
var assert = require("assert");
var Promise = require('bluebird');

describe("scrapeAll", function () {
    it("returns a list of cards", function (done) {
        scraper.scrapeAll({
            s: "winona",
            display: "card",
            sort: "date"
        }).then(function (cards) {
            assert(Array.isArray(cards));
            assert(cards.length == 2);
            assert(cards[0].name.indexOf("Winona") != -1);
            done();
        })
    });

    it("returns all correct fields", function (done) {
        scraper.scrapeAll({
            s: 'Altaria (XY Promos XY46)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            var altaria = cards[0];

            assert(altaria.smallImg === "http://pkmncards.com/wp-content/uploads/altaria-xy-promos-xy46-312x432.jpg");
            assert(altaria.largeImg === "http://pkmncards.com/wp-content/uploads/altaria-xy-promos-xy46.jpg");
            assert(altaria.name === "Altaria");
            assert(altaria.set === "XY Promos");
            assert(altaria.specificType === "Stage 1");
            assert(altaria.basicType === "Pokemon");
            assert(altaria.evolvesFrom === "Swablu");
            assert(altaria.colors.length === 1);
            assert(altaria.colors[0] === "Colorless");
            assert(altaria.hp === 90);

            assert(altaria.traits.length === 1);
            assert(altaria.traits[0].name.indexOf("Evolution") != -1);

            assert(altaria.abilities.length === 1);
            assert(altaria.abilities[0].name === "Clear Humming");

            assert(altaria.attacks.length === 1);
            assert(altaria.attacks[0].damage === 30);
            assert(altaria.attacks[0].name === "Wing Attack");
            assert(altaria.attacks[0].text == "");
            assert(altaria.attacks[0].cost.length === 2);

            assert(altaria.weakness.types[0] === "Lightning");
            assert(altaria.weakness.value === "x2");

            assert(altaria.resistance.types[0] === "Fighting");
            assert(altaria.resistance.value === "-20");

            assert(altaria.retreatCost === 1);
            assert(altaria.setId === "XY46");
            assert(altaria.rarity === "Promo");

            done();
        })

    });

    it("correctly scrapes that Purrloin without the colon", function (done) {
        scraper.scrapeAll({
            s: 'Purrloin (Plasma Storm PLS 82)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            assert(Array.isArray(cards));
            assert(cards[0].name.indexOf("Purrloin") != -1);
            done();
        })
    });

    it("correctly scrapes that Beautifly with the weird space", function (done) {
        scraper.scrapeAll({
            s: 'Beautifly (Dragons Exalted DRX 8)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            assert(Array.isArray(cards));
            assert(cards[0].name.indexOf("Beautifly") != -1);
            done();
        })
    });

    it("handles poke bodies and poke powers", function (done) {
        scraper.scrapeAll({
            s: 'Heatran LV.X (Diamond & Pearl Promos DP31)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const heatran = cards[0];
            assert(heatran.abilities.length === 2);
            assert(heatran.abilities[0].name === "Heat Metal");
            assert(heatran.abilities[1].name === "Heat Wave");
            done();
        })

    });

    it("handles pokemon powers", function (done) {
        scraper.scrapeAll({
            s: 'Articuno (Wizards Black Star Promos 48)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const articuno = cards[0];
            assert(articuno.abilities.length === 1);
            assert(articuno.abilities[0].name === "Aurora Veil");
            done();
        });
    });

    it("handles empty attack costs", function (done) {
        scraper.scrapeAll({
            s: 'Elekid (Triumphant TM 21)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const elekid = cards[0];
            assert(elekid.attacks.length === 1);
            assert(elekid.attacks[0].name === "Sparking Ball");
            assert(elekid.attacks[0].cost.length === 0);
            done();
        });
    });

    it("handles pokemon without any attack cost", function (done) {
        scraper.scrapeAll({
            s: 'Shedinja (Supreme Victors SV 44)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const shedinja = cards[0];
            assert(shedinja.attacks.length === 1);
            assert(shedinja.attacks[0].name === "Spike Wound");
            assert(shedinja.attacks[0].cost.length === 0);
            done();
        });
    });

    it("handles extra rules", function (done) {
        scraper.scrapeAll({
            s: 'Rayquaza ex (Nintendo Black Star Promos 039)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const rayquaza = cards[0];
            assert(rayquaza.attacks.length === 2);
            assert(rayquaza.attacks[0].name === "Dragon Bind");
            assert(rayquaza.attacks[1].name === "Twister");
            assert(rayquaza.rules[0] === "When Pokémon-ex has been Knocked Out, your opponent takes 2 Prize cards.");
            done();
        });
    });

    it("handles delta species and multiple types", function (done) {
        scraper.scrapeAll({
            s: 'Vaporeon (Delta Species DS 18)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const vaporeon = cards[0];
            assert(vaporeon.name == "Vaporeon");
            assert(vaporeon.colors.length == 2);
            assert(vaporeon.colors[0] == "Metal");
            assert(vaporeon.colors[1] == "Water");
            done();
        });
    });

    it("handles lunatone", function (done) {
        scraper.scrapeAll({
            s: 'Lunatone (Supreme Victors SV 32)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const lunatone = cards[0];
            assert(lunatone.name == "Lunatone");
            done();
        });
    });

    it("handles Moonlight Stadium", function (done) {
        scraper.scrapeAll({
            s: 'Moonlight Stadium (Great Encounters GE 100)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const moonlight = cards[0];
            assert(moonlight.name == "Moonlight Stadium");
            done();
        });
    });

    it("handles multiple resistances", function (done) {
        scraper.scrapeAll({
            s: 'Rayquaza ex (Nintendo Black Star Promos 039)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const rayquaza = cards[0];
            assert(rayquaza.name == "Rayquaza ex");
            assert(rayquaza.resistance.types.length == 2);
            assert(rayquaza.resistance.types[0] == "Fighting");
            assert(rayquaza.resistance.types[1] == "Water");
            done();
        });
    });

    it("handles multiple weaknesses", function (done) {
        scraper.scrapeAll({
            s: 'Aggron ex (Crystal Guardians CG 89)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const aggron = cards[0];
            assert(aggron.name == "Aggron ex");
            assert(aggron.weakness.types.length == 2);
            assert(aggron.weakness.types[0] == "Fighting");
            assert(aggron.weakness.types[1] == "Fire");
            done();
        });
    });

    it("handles the porygon", function (done) {
        scraper.scrapeAll({
            s: 'Porygon-Z (Black & White Promos BW84)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const porygon = cards[0];
            assert(porygon.name == "Porygon-Z");
            assert(porygon.specificType == "Stage 2");
            done();
        });
    });

    it("handles team plasma", function (done) {
        scraper.scrapeAll({
            s: 'Deoxys-EX (Black & White Promos BW82)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const deoxys = cards[0];
            assert(deoxys.name == "Deoxys-EX");
            assert(deoxys.specialTags.length === 1);
            assert(deoxys.specialTags[0] === "Team Plasma");
            done();
        });
    });

    it("handles baby pokemon", function (done) {
        scraper.scrapeAll({
            s: 'Igglybuff (Wizards Black Star Promos 36)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const igglybuff = cards[0];
            assert(igglybuff.name == "Igglybuff");
            assert(igglybuff.specificType == "Baby");
            done();
        });
    });

    it("handles pokemon without colours", function (done) {
        scraper.scrapeAll({
            s: 'Magcargo (Great Encounters GE 45)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const magcargo = cards[0];
            assert(magcargo.hp === 90);
            done();
        });
    });

    it("handles pokemon without HP", function (done) {
        scraper.scrapeAll({
            s: 'Poliwag (Base Set 2 B2 88)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const poliwag = cards[0];
            assert(poliwag.colors[0] === 'Water');
            done();
        });
    });

    it("handles random hyphens in the title row", function (done) {
        scraper.scrapeAll({
            s: 'Great Ball (Stormfront SF 85)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const greatBall = cards[0];
            done();
        });
    });

    it("handles hyphens in the card name", function (done) {
        scraper.scrapeAll({
            s: 'Ho-Oh-EX (Dragons Exalted DRX 22)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const hooh = cards[0];
            assert(hooh.name === 'Ho-Oh-EX');
            assert(hooh.colors[0] === 'Fire');
            assert(hooh.hp === 160);
            done();
        });
    });

    it("scrapes trainer subtypes", function (done) {
        scraper.scrapeAll({
            s: 'Wally (Roaring Skies ROS 107)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const wally = cards[0];
            assert(wally.name === 'Wally');
            assert(wally.basicType === 'Trainer');
            assert(wally.specificType === 'Supporter');
            done();
        });
    });

    it("scrapes energy", function (done) {
        scraper.scrapeAll({
            s: 'Shield Energy (Primal Clash PRC 143)',
            display: 'card',
            sort: 'date'
        }).then(function (cards) {
            const shield = cards[0];
            assert(shield .basicType === 'Energy');
            assert(shield .specificType === 'Special Energy');
            done();
        });
    });

});