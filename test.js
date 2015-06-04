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
});