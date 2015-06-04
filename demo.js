/**
 * Created by Miguel on 3/06/2015.
 */
var scraper = require("./index");
scraper.scrapeAll().then(function (cards) {
    console.log(cards.length);
});