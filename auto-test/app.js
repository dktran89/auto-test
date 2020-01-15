const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const ejs = require('ejs')
const port = 3000
const folderUploads = 'uploads/img'
const linkUploads = '/uploads/img'
const pathUploads = path.join(__dirname, linkUploads);

app.set('view engine', 'ejs');
app.use(linkUploads, express.static(folderUploads));
app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.get('/', (req, res) => {
  res.render('index')
})

async function addTimeAndScreenShot(page) {
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
        path: `./uploads/img/img-${(new Date()).getTime()}.jpg`,
        fullPage: true
    });
}

async function submitAndWaitPageLoadFinish(page, button) {
    await Promise.all([
        button.click(),
        page.waitForNavigation({
            waitUntil: 'networkidle0'
        }),
    ]);
}

app.get('/alligator', (req, res) => {
  (async() => {
      const browser = await puppeteer.launch();
      let page = await browser.newPage();
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
      await addTimeAndScreenShot(page)
      await submitAndWaitPageLoadFinish(page, await page.$('a[href="/react/typescript-with-react/"]'))
      await addTimeAndScreenShot(page)
      const fullLinkUploads = `${req.protocol}://${req.headers.host}${linkUploads}`;

      fs.readdir(pathUploads, async function(err, files) {
          var fileName = []

          if (err) throw err
          files.map((file) => {
              fileName.push(file)
          });

        let html = `
          <div class="container">
            <h2 class="text-center bold">AUTOMATICAL TEST</h2>
            <div class="row">
              <div class="col-lg-12">
                ${fileName.map((file, key) => `<p><img src="${fullLinkUploads + '/' + file}" alt = "${file}" /></p>`).join('')}
              </div>
            </div>
          </div>
        `;
        page = await browser.newPage();
        await page.setContent(html);

        // PDF
        await page.addStyleTag({
            url: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
        })
        await page.addStyleTag({
            content: `
        html {-webkit-print-color-adjust: exact;}
        h2 {color: #414141;}
        `
        })
        await page.pdf({
            path: `uploads/File.pdf`,
            format: 'Tabloid',
            margin: {
                top: "1cm",
                bottom: "1cm",
                left: "1cm",
                right: "1cm"
            },
            printBackground: true,
        })
        await browser.close()
        await res.redirect('back')
      })
  })();
})

app.get('/itviec', (req, res) => {
  (async() => {
      let browser = await puppeteer.launch({headless: false});
      let page = await browser.newPage();

      await page.setViewport({
          width: 1820,
          height: 1170
      });
      await page.goto('https://itviec.com/', {waitUntil: 'domcontentloaded'})
      await page.evaluate(() => {
          document.querySelector('.ui-autocomplete-input').value = 'tester';
      })

      await submitAndWaitPageLoadFinish(page, await page.$('.search_button'))

      const element = await page.$("h1");
      const allJob = await page.evaluate(element => element.textContent, element)   

      let jobs = await page.$$eval('#jobs .first-group .job .job__body .title a', async (links) => {
        let jobs = []

        links.map((link) => {
          let item = [link.getAttribute('href'), link.textContent]
          jobs.push(item)
        })
        return jobs; 
      })   

      //PDF
        let html = `
          <div class="container">
            <h2 class="text-center bold">AUTOMATICAL TEST</h2>
            <div class="row">
              <div class="col-lg-12">
                ${jobs.map((item, key) => `
                  <p><a target="_blank" href="https://itviec.com/${item[0]}">${item[1]}</a></p>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        page = await browser.newPage();
        await page.setContent(html);

        // PDF
        await page.addStyleTag({
            url: "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
        })
        await page.addStyleTag({
            content: `
        html {-webkit-print-color-adjust: exact;}
        h2 {color: #414141;}
        `
        })
        await page.pdf({
            path: `uploads/File.pdf`,
            format: 'Tabloid',
            margin: {
                top: "1cm",
                bottom: "1cm",
                left: "1cm",
                right: "1cm"
            },
            printBackground: true,
        })
        await browser.close()
        await res.redirect('back')   
  })();
})