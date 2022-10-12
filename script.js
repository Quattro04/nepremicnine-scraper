
import webdriver, { By } from 'selenium-webdriver';
import fs from 'fs';
import admin from 'firebase-admin';

const REGIONS = [
   'ljubljana-mesto',
   'ljubljana-okolica',
   'juzna-primorska',
   'severna-primorska',
   'notranjska'
]

admin.initializeApp({
   credential: admin.credential.cert(JSON.parse(process.env.SERVICE_ACCOUNT))
});

const db = admin.firestore()

const getItems = async (type, driver) => {
    let rawdata = fs.readFileSync(`${type}Last.json`);
    let lastItems = JSON.parse(rawdata);

    let newItems = {};

    for(let r = 0; r < REGIONS.length; r++) {
        await driver.get(`https://www.nepremicnine.net/oglasi-prodaja/${REGIONS[r]}/${type}/${type === 'posest' ? 'zazidljiva/' : ''}?s=16`);

        const items = await driver.findElements(By.className('oglas_container'));

        for(let i = 0; i < items.length; i++) {
            const id = await items[i].getAttribute("id");
            if (id === lastItems[REGIONS[r]]) break;
            const titleElement = await items[i].findElement(By.className('title'));
            const title = await titleElement.getText();
            const anchorElement = await items[i].findElement(By.xpath(`//a[@title="${id.substring('1')}"]`));
            const url = await anchorElement.getAttribute('href');
            const sizeElement = await items[i].findElement(By.className('velikost'));
            const size = await sizeElement.getText();
            const priceElement = await items[i].findElement(By.className('cena'));
            const price = await priceElement.getText();
            const imageElement = await items[i].findElement(By.xpath(`//img[@itemprop="image"]`));
            const image = await imageElement.getAttribute('src');
    
            if (!newItems[REGIONS[r]]) newItems = { ...newItems, [REGIONS[r]]: [] };
    
            newItems[REGIONS[r]].push({ id, title, url, size, price, image, region: REGIONS[r], date: new Date().toISOString() });
        }
    }

    // Write to database
    try {
        for(let i = 0; i < Object.keys(newItems).length; i++ ) {
            let doc = await db.collection(type).doc(Object.keys(newItems)[i]).get();

            if (doc.exists) {
                const data = doc.data();
                await db.collection(type).doc(Object.keys(newItems)[i]).set({ data: [...data.data, Object.values(newItems)[i]] });
            } else {
                await db.collection(type).doc(Object.keys(newItems)[i]).set({ data: Object.values(newItems)[i] });
            }
        }
    } catch(error) {
        console.log('DATABASE WRITE ERROR: ', error);
    };

    console.log('-----------------------------------------------');
    console.log('GOT NEW ITEMS: ', Object.keys(newItems).length);
    console.log('-----------------------------------------------');

    // Update last posesti
    for (let i = 0; i < Object.keys(newItems).length; i++) {
        const region = Object.keys(newItems)[i];
        lastItems[region] = newItems[region][0].id;
    }

    fs.writeFileSync(`${type}Last.json`, JSON.stringify(lastItems, null, 4));

    return Promise.resolve();
}

const scrape = async () => {

   const driver = await new webdriver.Builder().forBrowser('firefox').build();

   await getItems("posest", driver);
   await getItems("hisa", driver);

   driver.quit();
}

const halfDayInMilliseconds = 1000 * 60 * 60 * 12;

console.log('-----------------------------------------------');
console.log('STARTING SCRAPE');
console.log('-----------------------------------------------');
scrape();
setInterval(() => {
    console.log('-----------------------------------------------');
    console.log('STARTING SCRAPE');
    console.log('-----------------------------------------------');
    scrape();
}, halfDayInMilliseconds);
