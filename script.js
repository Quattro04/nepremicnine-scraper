
var webdriver = require('selenium-webdriver');
const { By } = webdriver; 
var fs = require('fs');

const REGIONS = [
   'ljubljana-mesto',
   'ljubljana-okolica',
   'juzna-primorska',
   'severna-primorska',
   'notranjska'
]

const NEPREMICNINE = [
   'posest',
   'hisa'
]
 
const getPosesti = async () => {
   driver = await new webdriver.Builder().forBrowser('firefox').build();

   let rawdata = fs.readFileSync('posestiLast.json');
   let lastItems = JSON.parse(rawdata);

   newItems = {};

   for(let r = 0; r < REGIONS.length; r++) {
      await driver.get(`https://www.nepremicnine.net/oglasi-prodaja/${REGIONS[r]}/posest/zazidljiva/?s=16`);

      const items = await driver.findElements(By.className('oglas_container'));

      for(let i = 0; i < items.length; i++) {
         const id = await items[i].getAttribute("id");
         if (id === lastItems[REGIONS[r]]) break;
         const titleElement = await items[i].findElement(By.className('title'));
         const title = await titleElement.getText();
         const anchorElement = await items[i].findElement(By.xpath(`//a[@title="${id.substring('1')}"]`));
         const url = await anchorElement.getAttribute('href');

         if (!newItems[REGIONS[r]]) newItems = { ...newItems, [REGIONS[r]]: [] };

         newItems[REGIONS[r]].push({ id, title, url, region: REGIONS[r] });
      }
   }

   fs.writeFileSync("posestiNew.json", JSON.stringify(newItems, null, 4));

   // Update last posesti
   for (i = 0; i < Object.keys(newItems).length; i++) {
      const region = Object.keys(newItems)[i];
      lastItems[region] = newItems[region][0].id;
   }

   fs.writeFileSync("posestiLast.json", JSON.stringify(lastItems, null, 4));

   driver.quit();

   return Promise.resolve();
}

const getHise = async () => {
   driver = await new webdriver.Builder().forBrowser('firefox').build();

   let rawdata = fs.readFileSync('hiseLast.json');
   let lastItems = JSON.parse(rawdata);

   newItems = {};

   for(let r = 0; r < REGIONS.length; r++) {
      await driver.get(`https://www.nepremicnine.net/oglasi-prodaja/${REGIONS[r]}/hisa/?s=16`);

      const items = await driver.findElements(By.className('oglas_container'));

      for(let i = 0; i < items.length; i++) {
         const id = await items[i].getAttribute("id");
         if (id === lastItems[REGIONS[r]]) break;
         const titleElement = await items[i].findElement(By.className('title'));
         const title = await titleElement.getText();
         const anchorElement = await items[i].findElement(By.xpath(`//a[@title="${id.substring('1')}"]`));
         const url = await anchorElement.getAttribute('href');

         if (!newItems[REGIONS[r]]) newItems = { ...newItems, [REGIONS[r]]: [] };

         newItems[REGIONS[r]].push({ id, title, url, region: REGIONS[r] });
      }
   }

   fs.writeFileSync("hiseNew.json", JSON.stringify(newItems, null, 4));

   // Update last hise
   for (i = 0; i < Object.keys(newItems).length; i++) {
      const region = Object.keys(newItems)[i];
      lastItems[region] = newItems[region][0].id;
   }

   fs.writeFileSync("hiseLast.json", JSON.stringify(lastItems, null, 4));

   driver.quit();

   return Promise.resolve();
}

const scrape = async () => {
   await getPosesti();
   await getHise();
}

scrape();