const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const port = 3000
const folderUploads = 'uploads'
const linkUploads = '/uploads'
const pathUploads = path.join(__dirname, linkUploads);

app.use(linkUploads, express.static(folderUploads));
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.get('/', (req, res) => res.send('Hello World!'))

async function addTimeAndScreenShot(page, linkSaveImage) {
    await page.evaluate(() => {
        const body = document.getElementsByTagName("body")[0];

        //add time
        const time = document.createElement("p");
        const textTime = document.createTextNode(new Date());
        time.appendChild(textTime);
        time.style.cssText = `
          background-color: #f8f9fa;
          position: absolute;
          right: 0;
          border-radius: 5px;
          text-align: center;
          color: green;
          padding: 5px;
          margin: 10px;
          z-index: 1000`;
        body.insertBefore(time, body.childNodes[0]);

        //add link
        const link = document.createElement("p");
        const textLink = document.createTextNode(location.href);
        link.appendChild(textLink);
        link.style.cssText = `
          background-color: #f8f9fa;
          color: green;
          position: absolute;
          padding: 5px;
          margin: 10px;
          left: 0;
          border-radius: 5px;
          text-align: left;
           z-index: 1000`;
        body.insertBefore(link, body.childNodes[0]);
    });
    await page.screenshot({
        path: `.\\uploads\\` + linkSaveImage,
        fullPage: true
    });
}

async function submitAndWaitPageLoadFinish(page, button) {
    await Promise.all([
        button.click(),
        page.waitForNavigation({
            waitUntil: 'load'
        }),
    ]);
}

app.get('/tiki', (req, res) => {
    (async () => {
        res.send('Waiting...')
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({
            width: 1820,
            height: 1170
        });
        await page.goto('https://alligator.io/')
        await page.evaluate(() => {
            const link = document.querySelector('[href="/react/typescript-with-react/"]');
            link.style.cssText = `
              border: 5px dashed red;`;
        })
        const image_1 = 'example-1.png'
        const image_2 = 'example-2.png'
        await addTimeAndScreenShot(page, image_1)
        await submitAndWaitPageLoadFinish(page, await page.$('a[href="/react/typescript-with-react/"]'))
        await addTimeAndScreenShot(page, image_2)
        const fullLinkUploads = `${req.protocol}://${req.headers.host}${linkUploads}`;

        let fileName = []
        fs.readdir(pathUploads, function (err, files) {
          if (err) throw err
            files.forEach(function (file) {
              fileName.push(file)
          });
        });

        console.log(fileName)

        // PDF
        let html = `
          <div class="container">
            <h2 class="text-center bold">AUTOMATICAL TEST</h2>
            <div class="row">
              <div class="col-lg-12">
                <p class="img"><img src="${fullLinkUploads}/${image_1}" alt="${image_1}" /></p>
                <p class="img"><img src="${fullLinkUploads}/${image_2}" alt="${image_2}" /></p>
              </div>
            </div>
          </div>
        `;
        await page.setContent(html);
        await page.addStyleTag({
          url: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
        })
        await page.addStyleTag({content: `
            html {-webkit-print-color-adjust: exact;}
            h2 {color: #414141;}
            `})
        await page.pdf({
            path: `uploads\\File.pdf`,
            format: 'Tabloid',
            margin: { top: "1cm", bottom: "1cm", left: "1cm", right: "1cm" },
            printBackground : true,
        })
        await browser.close();
    })();
})
