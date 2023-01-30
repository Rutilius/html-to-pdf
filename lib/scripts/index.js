const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const pageType = ".html";
const configType = ".json";
const resultType = ".pdf";

const pagesPath = path.resolve("src/pages");
const configsPath = path.resolve("src/configs");
const distPath = path.resolve("dist");

EnsureExist(pagesPath);
EnsureExist(configsPath);
EnsureExist(distPath);

const pagesNames = fs.readdirSync(pagesPath).filter(x => x.endsWith(pageType));
const configsNames = fs.readdirSync(configsPath).filter(x => x.endsWith(configType));

const defaultConfig = {
  content: {
    waitUntil: 'networkidle0'
  },
  pdf: {
    printBackground: true,
    format: 'A4',
  }
};

const documents = pagesNames.map(x => {
    let documentName = x.replace(pageType, "").trimEnd();

    let configs = defaultConfig;
    if(configsNames.find(y => y.startsWith(documentName))) {
      let confPath = path.resolve(configsPath, `${documentName}${configType}`);
      let file = fs.readFileSync(confPath, 'utf8');
      configs = JSON.parse(file);
    }

    let pagePath = path.resolve(pagesPath, `${documentName}${pageType}`);
    let pageHtml = fs.readFileSync(pagePath, 'utf8');

    // Import not html assets
    let regexCss = /@import[\s\t]*['"](?!http[s]?:?)(.*?)['"][\s\t]*;/g;
    let matchesCss = [...new Set([...pageHtml.matchAll(regexCss)].map(x => 1 in x ? x[1] : "").filter(x => x != ""))];
    matchesCss.forEach(x => {
      let cssPath = path.resolve(pagesPath, x);
      if(fs.existsSync(cssPath)) {
        let css = fs.readFileSync(cssPath);

        pageHtml = pageHtml.replaceAll(regexCss, css);
      }
    })
    let regexImg = /<img.*?src[\s\t]*=[\s\t]*['"](?!data:|http[s]?:)(.*?)['"]/g;
    let regexBackground = /background-image:[\s\n\t]*url[\s\n\t]*\([\s\n\t]*['"](?!data:|http[s]?:)(.*?)['"]/g;
    let matches = [...new Set([...pageHtml.matchAll(regexBackground), ...pageHtml.matchAll(regexImg)].map(x => 1 in x ? x[1] : "").filter(x => x != ""))];
    matches.forEach(x => {
      let regexExtension = /\.[0-9a-z]+$/
      let extension = x.match(regexExtension);
      
      if(extension != null && 0 in extension) {
        let imgPath = path.resolve(pagesPath, x);
      
        if(fs.existsSync(imgPath)) {
          let newBase = fs.readFileSync(imgPath).toString('base64');
          let ext = extension[0].replace(".", "");
        
          let img = `data:image/${ext};base64,${newBase}`;
      
          pageHtml = pageHtml.replaceAll(x, img);
        }
      }      
    });

    let destination = path.resolve(distPath, `${documentName}${resultType}`);
    
    console.log(`Document ${documentName} readed, rendering it`);

    return { documentName, pageHtml, configs, destination };
});

documents.forEach(async doc => {
  // Create a browser instance
  const browser = await puppeteer.launch(doc.configs["launch"]);
  // Create a new page
  const page = await browser.newPage();

  //Get HTML content from HTML file
  const html = doc.pageHtml;
  await page.setContent(html, doc.configs["content"]);

  // To reflect CSS used for screens instead of print
  await page.emulateMediaType('screen');

  // Downlaod the PDF
  const pdf = await page.pdf({
    ...doc.configs["pdf"],
    path: doc.destination,
  });
  
  // Close the browser instance
  await browser.close();

  console.log(`Rendered page: ${doc.documentName} at: ${doc.destination}`)
});

function EnsureExist(dirPath) {
  if(!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
