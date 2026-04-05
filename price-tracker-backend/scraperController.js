const scrapeNykaa = require('./nykaaScraper');
const scrapeAmazon = require('./amazonScraper');
const scrapeFlipkart = require('./flipkartScraper');
const scrapeMyntra = require('./myntraScraper');
// We will uncomment these as we build them!
const scrapeMeesho = require('./meeshoScraper');
const scrapeAjio = require('./ajioScraper');
const scrapeSnapdeal = require('./snapdealScraper');
const scrapeTataCliq = require('./tataCliqScraper');
const scrapeJioMart = require('./jioMartScraper');
const scrapeBigBasket = require('./bigBasketScraper');

async function routeUrl(url) {
    const cleanUrl = url.toLowerCase();

    if (cleanUrl.includes('nykaa.com')) {
        console.log('Routing to Nykaa...');
        return await scrapeNykaa(url);
    } else if (cleanUrl.includes('amazon.in')) {
        console.log('Routing to Amazon...');
        return await scrapeAmazon(url);
    } else if (cleanUrl.includes('flipkart.com')) {
        console.log('Routing to Flipkart...');
        return await scrapeFlipkart(url);
    } else if (cleanUrl.includes('myntra.com')) {
        console.log('Routing to Myntra...');
        return await scrapeMyntra(url);
    } else if (cleanUrl.includes('ajio.com')) {
        console.log('Routing to Ajio...');
        return await scrapeAjio(url);
    } else if (cleanUrl.includes('meesho.com')) {
        console.log('Routing to Meesho...');
        return await scrapeMeesho(url);
    } else if (cleanUrl.includes('snapdeal.com')) {
        console.log('Routing to Snapdeal...');
        return await scrapeSnapdeal(url);
    } else if (cleanUrl.includes('tatacliq.com')) {
        console.log('Routing to TataCliq...');
        return await scrapeTataCliq(url);
    } else if (cleanUrl.includes('jiomart.com')) {
        console.log('Routing to JioMart...');
        return await scrapeJioMart(url);
    } else if (cleanUrl.includes('bigbasket.com')) {
        console.log('Routing to BigBasket...');
        return await scrapeBigBasket(url);
    }
    // We will add the other 6 routes here as we build their files!
    else {
        throw new Error('Website not supported yet! Please check the link.');
    }
}

module.exports = routeUrl;