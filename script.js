
import webdriver, { By } from 'selenium-webdriver';
import fs from 'fs';
// import { initializeApp } from 'firebase/app';
// import { getAuth, signInWithCustomToken } from "firebase/auth";
import admin from 'firebase-admin';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore/lite';
// import firebaseConfig from 'config/config.json';
import serviceAccount  from './config/auth.json' assert {type: 'json'};

const REGIONS = [
   'ljubljana-mesto',
   'ljubljana-okolica',
   'juzna-primorska',
   'severna-primorska',
   'notranjska'
]

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore()

try
{
   await db.collection("items")
      .set("123141")
      .update({
         "id": "123141",
         "title": "BEST HOUSE",
         "url": "www",
         "region": "neki"
      })
}
catch(err)
{
   console.log(err)
}
 
const getPosesti = async (driver) => {
   let rawdata = fs.readFileSync('posestiLast.json');
   let lastItems = JSON.parse(rawdata);

   let newItems = {};

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

         // addDoc(db, { id, title, url, region: REGIONS[r] })
      }
   }

   fs.writeFileSync("posestiNew.json", JSON.stringify(newItems, null, 4));

   // return Promise.resolve();

   // Update last posesti
   for (let i = 0; i < Object.keys(newItems).length; i++) {
      const region = Object.keys(newItems)[i];
      lastItems[region] = newItems[region][0].id;
   }

   fs.writeFileSync("posestiLast.json", JSON.stringify(lastItems, null, 4));

   return Promise.resolve();
}

const getHise = async (driver) => {
   let rawdata = fs.readFileSync('hiseLast.json');
   let lastItems = JSON.parse(rawdata);

   let newItems = {};

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
   for (let i = 0; i < Object.keys(newItems).length; i++) {
      const region = Object.keys(newItems)[i];
      lastItems[region] = newItems[region][0].id;
   }

   fs.writeFileSync("hiseLast.json", JSON.stringify(lastItems, null, 4));

   return Promise.resolve();
}

const scrape = async () => {

   const driver = await new webdriver.Builder().forBrowser('firefox').build();

   await getPosesti(driver);
   await getHise(driver);

   driver.quit();
}

// scrape();