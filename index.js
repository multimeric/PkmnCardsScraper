"use strict";

//Constants
var SCRAPE_URL = "http://www.pokemon.com/us/pokemon-tcg/pokemon-cards/";

//Requires
var request = require('request-promise');
var cheerio = require('cheerio');
var Promise = require('bluebird');
var co = Promise.coroutine;
var qs = require('querystring');
var _ = require('lodash');

function getBasicType(type) {
    var lower = type.toLowerCase();

    if (lower.indexOf("trainer") != -1)
        return "Trainer";
    else if (lower.indexOf("energy") != -1)
        return "Energy";
    return "Pokemon";

}

function readFirstParagraph($topRow, card, $) {
    var topRow = $topRow.contents().filter(function () {
        return this.nodeType == 3;
    });
    card.specificType = $(_.last(topRow)).text().split(" - ")[0];
    card.basicType = getBasicType(card.specificType);
    var links = $topRow.find("a");
    if (links.length > 1)
        card.evolvesFrom = $(links[1]).text();

    //If it's a pokemon, get its HP and colour
    if (card.basicType == "Pokemon") {
        var split = $(topRow[0]).text().split(" - ");
        card.color = split[1];
        card.hp = parseInt(split[2]);
    }
}

function readAbility($p, card, $) {
    if ('abilities' in card == false)
        card.abilities = [];

    var text = $p.text().replace("Ability: ", "");
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
    var attackText = /: (.+)/.exec(text)[1];
    if (text.indexOf("damage")) {

        //The first sentence involves damage
        var split = attackText.split(". ");
        var damage = /(\d+)[x+]? damage/.exec(split[0]);
        if (damage)
            attack.damage = damage[1];

        //The remaining text is the attack's text
        attack.text = attackText.substring(attackText.indexOf('. ') + 1);
    }
    else
        attack.text = attackText;

    //Attack name
    attack.name = /(\w[\w\s]+):/.exec(text)[1];

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
    var resistance = lines[0].split(" ");
    card.resistance = {
        type: resistance[0],
        value: resistance[1]
    };
    card.retreatCost = lines[2];
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

    var split = $p.text().split(": ");
    card.rules.push({
        name: split[0],
        text: split[1]
    });
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
        else if (isPokemon && /Ability:/.test(text))
            readAbility($el, card, $);
        else if (isPokemon && /\[.+]/.test(text))
            readAttack($el, card, $);
        else if (isPokemon && /Resistance/.test(text))
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

        var nextUrl = "http://pkmncards.com/?" +  qs.stringify(query);
        var cards = [];

        do {
            var $ = cheerio.load(yield request(nextUrl));
            nextUrl = $($(".search-nav .right a")[0]).attr("href");
            var cardsEls = $(".pkmn_card");
            cardsEls.each(function (i, v) {
                var card = scrapeCard(v, $);
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