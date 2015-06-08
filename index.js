"use strict";

//Constants
const SCRAPE_URL = "http://www.pokemon.com/us/pokemon-tcg/pokemon-cards/";

//Requires
const request = require('request-promise');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const co = Promise.coroutine;
const qs = require('querystring');
const _ = require('lodash');

function getBasicType(type) {
    var lower = type.toLowerCase();

    if (lower.indexOf("trainer") != -1)
        return "Trainer";
    else if (lower.indexOf("energy") != -1)
        return "Energy";
    return "Pokemon";

}

/**
 * Divides the paragraph into a 2D array of lines and then sections
 * @param el
 * @param $
 * @returns {*}
 */
function getLines(el, $) {
    var $el = $(el);
    var counter = 0; //The current group of text nodes

    // * Group the nodes into groups divided by <br>
    //Then map into text
    return _($el.contents())

        //Group the nodes into groups divided by the <br>
        .groupBy(function (el) {
            if (el.tagName == "br") {
                counter++;
                return "<br>";
            }
            return counter;
        })

        //Remove the br nodes themselves
        .omit("<br>")

        //Convert to an array (groupBy returns an object)
        .toArray()

        //Convert each sub array into a string
        .map(function (array) {

            //Map the elements into text and join them with spaces then split them by hyphens
            return _(array)
                .map(function (el) {
                    return $(el).text().trim();
                })
                .join(" ")
                .split(" -")
                .map(function (str) {
                    return str.trim();
                });

        })

        //Evaluate
        .value();
}

function readFirstParagraph($topRow, card, $) {

    //Divide the paragraph into lines, further divided by hyphens (an array of arrays)
    var lines = getLines($topRow, $);

    //Quit if there's only one element
    if (lines.length == 1 && lines[0].length == 1)
        return;


    //This stuff requires a second row which isn't present in some cards
    if (lines.length > 1) {

        //Get the (the first part of the second row)
        card.specificType = lines[1][0];
        card.basicType = getBasicType(card.specificType);

        //If it's anything special (e.g. Team Plasma), mark it
        if ((card.evolvesFrom && lines[1].length > 2 ) || (!card.evolvesFrom && lines[1].length > 1)) {
            if ('specialTags' in card == false)
                card.specialTags = [];
            card.specialTags.push(_.last(lines[1]));
        }
    }

    //The last link is the evolution
    var links = $topRow.find("a");
    if (links.length > 1)
        card.evolvesFrom = $(links[1]).text();

    //If it's a pokemon, get its HP and colour
    if (card.basicType == "Pokemon") {

        //The HP is always the last entry
        var hpMatch = /\d+/.exec(_.last(lines[0]));
        if (hpMatch)
            card.hp = parseInt(hpMatch[0]);

        //If there are 3 things on the first line, the second one is the color
        if (lines[0].length > 2)
            card.colors = lines[0][1].split(", ");
    }
    else if (card.basicType == 'Trainer'){
        card.specificType = lines[1][1];
    }
}

const abilityRegex = /(Ability|Pokémon Power|Poké-Body|Poké-Power): /;

function readAbility($p, card, $) {
    if ('abilities' in card == false)
        card.abilities = [];

    var text = $p.text().replace(abilityRegex, "");
    var split = text.split("\n");
    card.abilities.push({
        name: split[0],
        text: split[1]
    });
}

function readAncientTrait($p, card, $) {
    if ('traits' in card == false)
        card.traits = [];

    var split = $p.text().split(": ");
    card.traits.push({
        name: split[0],
        text: split[1]
    });
}

const attackRegex = /[:\.]\s(.+)/;
function readAttack($p, card, $) {
    //Add the attacks array to the card
    if ('attacks' in card == false)
        card.attacks = [];

    //Setup common variables
    var attack = {
        cost: []
    };
    var text = $p.text();

    //Add cost
    var re = /(\[\w])/g;
    var match;
    while ((match = re.exec(text)) !== null) {
        attack.cost.push(match[0]);
    }

    //Add the attack text and possibly damage
    var attackText = attackRegex.exec(text)[1];
    if (text.indexOf("damage") != -1) {

        //The first sentence involves damage
        var split = attackText.split(". ");
        var damage = /(\d+)[x+]? damage/.exec(split[0]);
        if (damage)
            attack.damage = parseInt(damage[1]);

        //The remaining text is the attack's text
        attack.text = attackText.substring(attackText.indexOf('.') + 1);
    }
    else
        attack.text = attackText;

    //Attack name
    attack.name = /(\w[\w\s]+)[:\.]/.exec(text)[1];

    card.attacks.push(attack);
}

function readSetDetails($p, card, $) {
    var split = $p.text().split(" - ");
    card.set = split[0];
    card.setId = split[1];
    card.rarity = split[2];
}

function readWeaknessResistance($p, card, $) {
    var lines = _($p.contents()).filter(function (el) {
        return el.nodeType == 3;
    }).map(function (el) {
        var $el = $(el);
        return /: (.+)/.exec($el.text())[1];
    }).value();

    var weakness = lines[0].split(" ");
    card.weakness = {
        type: weakness[0],
        value: weakness[1]
    };

    var weakness = lines[0];
    var value = /[-x]\d+/.exec(weakness);
    if (value) {
        var types = weakness.slice(0, value.index - 1).split(", ");
        card.weakness = {
            types: types,
            value: value[0]
        };
    }

    var resistance = lines[1];
    var value = /[-x]\d+/.exec(resistance);
    if (value) {
        var types = resistance.slice(0, value.index - 1).split(", ");
        card.resistance = {
            types: types,
            value: value[0]
        };
    }

    card.retreatCost = parseInt(lines[2]);
}

function readText($p, card, $) {
    //Add the text array to the card
    if ('text' in card == false)
        card.text = [];

    card.text.push($p.text());
}

function readCardRule($p, card, $) {
    //Add the text array to the card
    if ('rules' in card == false)
        card.rules = [];

    // var split = $p.text().split(": ");
    card.rules.push($p.text());
}

function readFlavourText($p, card, $) {
    card.flavourText = $p.text();
}

function readCardParagraphs($p, card, $) {
    $p.each(function (i, el) {
        var $el = $(el);
        var text = $el.text();
        var isPokemon = card.basicType == "Pokemon";

        if (i == 0)
            readFirstParagraph($el, card, $);
        else if (isPokemon && abilityRegex.test(text))
            readAbility($el, card, $);
        else if (isPokemon && /\^[(.+)?]/.test(text))
            readAttack($el, card, $);
        else if (isPokemon && /Resistance:/.test(text) && /Weakness:/.test(text) && /Retreat Cost:/.test(text))
            readWeaknessResistance($el, card, $);
        else if (isPokemon && /^. \w+:/.test(text))
            readAncientTrait($el, card, $);
        else if (isPokemon && text.toLowerCase().indexOf("rule") != -1)
            readCardRule($el, card, $);
        else if (text.indexOf("Illus") != -1)
            readSetDetails($el, card, $);
        else if ($el.has("em").length)
            readFlavourText($el, card, $);
        else if (text.indexOf(" - ") != -1)
            readSetDetails($el, card, $);
        else if (isPokemon && attackRegex.test(text))
            readAttack($el, card, $);
        else if (isPokemon)
            readCardRule($el, card, $);
        else
            readText($el, card, $)
    });
}

/**
 * Scrapes the given jQuery element containing a card's data
 * @returns A card object
 */
function scrapeCard(element, $) {
    element = $(element);
    var card = {};

    //Get the card images
    var $images = element.find(".scan.left");
    card.smallImg = $images.find("img").attr("src");
    card.largeImg = $images.find("a").attr("href");

    var $card = element.find(".card");

    //Get the title and set name from the title bar
    var titleArray = $card.find("h2.entry-title").text().match(/(.+) \((.+)\)/);
    card.name = titleArray[1];
    card.set = titleArray[2];

    //Get the type
    var $p = $card.find(".tabs-wrap [id^=text-]>p");
    readCardParagraphs($p, card, $);

    return card;
}

/**
 * Scrapes the Pokemon TCG database
 * @param query The query string to use for the search. Defaults to a query string that will return all cards
 * @returns {*}
 */
function scrapeAll(query) {
    query = query || {
            s: null,
            display: "card",
            sort: "date"
        };

    return co(function *() {

        var nextUrl = "http://pkmncards.com/?" + qs.stringify(query);
        var cards = [];

        do {
            var $ = cheerio.load(yield request(nextUrl));
            nextUrl = $($(".search-nav .right a")[0]).attr("href");
            var cardsEls = $(".pkmn_card");
            cardsEls.each(function (i, v) {
                var card;
                try {
                    card = scrapeCard(v, $);
                }
                catch (ex) {
                    console.log("Error scraping " + $(v).find("h2").text() + ". " + ex.stack)
                }
                cards.push(card);
            });
            console.log("Scraped " + cards.length + " cards.");
        } while (nextUrl);

        return cards;
    })();
}

module.exports = {
    scrapeAll: scrapeAll,
    scrapeCard: scrapeCard
};