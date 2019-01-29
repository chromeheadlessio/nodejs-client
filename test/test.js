const Service = require('../src/Service');
const ioHelper = require('../src/ioHelper');
const fs = require('fs');

let url;

// let regex  = /<(script|img|iframe)([^>]*)src=["']([^>"']*)["']/ig;
// let s = '<img src="https://i-vnexpress.vnecdn.net/2019/01/28/2-1548665969-1673-1548665974_500x300.jpg" class="vne_lazy_image lazyloaded" data-original="https://i-vnexpress.vnecdn.net/2019/01/28/2-1548665969-1673-1548665974_500x300.jpg" alt="Venezuela điều xe tăng, pháo tự hành tới biên giới Colombia">';
// console.log(s.replace(regex, 'match')); 
// url = "https://i-vnexpress.vnecdn.net/2019/01/28/2-1548665969-1673-1548665974_500x300.jpg";
// console.log(ioHelper.getFilenameFromUrl(url));
// return;

// ioHelper.getUrlContent('https://i-vnexpress.vnecdn.net/2019/01/28/2-1548665969-1673-1548665974_500x300.jpg')
//     .then((data) => { 
//         ioHelper.writeFileAsync('./temp/save.jpg', data, 'base64');
//     })
//     .then(() => console.log('saved image'))
// ;
// return;

let upfile = 'c:/xampp7.2.7/htdocs/applications.html'; 
let exportFilePath = './exports/export.pdf';
url = 'http://localhost/applications.html';
// url = 'http://localhost/koolreport/examplesLab/reports/cube/sales_by_quarters/';
// url = 'https://vnexpress.net/';

// let params = {
//     authentication: {
//         secretToken: '6e27e9f5b6749f6a981c56c9bb70e0b94a0b9f3edf6d13facea9bbda6c9281a4'
//     },
//     pageWaiting: 'load',
//     httpHost: null,
//     baseUrl: null,
//     // html: fs.readFileSync(upfile, 'utf8'),
//     url: url,
//     resourcePatterns: [
//         {
//             regex: /((KoolReport.load.resources|KoolReport.widget.init)\([^\)]*)["']([^"',\[\]\:]+)["']/ig,
//             replace: "{group1}'{group3}'",
//             urlGroup: "{group3}"
//         }
//     ]
// };
// let pdfOptions = {
//     format: 'A4' 
// };

// const exporter = new Exporter(params);

// exporter.pdf(pdfOptions, function() {
//     exporter.save(exportFile);
// });

// exporter.pdf(pdfOptions)
//     .then(() => exporter.save(exportFilePath))
//     .then(() => console.log('save export file to ', exportFilePath))
//     .catch(err => console.log('pdf call error :', err))
// ;

let authentication = "6e27e9f5b6749f6a981c56c9bb70e0b94a0b9f3edf6d13facea9bbda6c9281a4";
let exportParams = {
    pageWaiting: 'load',
    httpHost: null,
    baseUrl: null,
    // html: fs.readFileSync(upfile, 'utf8'),
    url: url,
    resourcePatterns: [
        {
            regex: /((KoolReport.load.resources|KoolReport.widget.init)\([^\)]*)["']([^"',\[\]\:]+)["']/ig,
            replace: "{group1}'{group3}'",
            urlGroup: "{group3}"
        }
    ]
};
let pdfOptions = {
    format: 'A4' 
};

//creata a new service object with an authentication string or object
const service = new Service(authentication);

service
    
    //set export parameters like html, url, etc
    .export2(exportParams)

    //send export paramters together with pdf, jpg or png options 
    //to chromeheadless.io service
    .pdf(pdfOptions)
    // .jpg(jpgOptions)
    // .png(pngOptions)

    //a promise is returned which if resolved would pass
    //pdf, jpg or pnd data back
    .then(data => {
        console.log('pdf data returned')
        //Service also provides a save helper function
        //to write exported data to file
        service.save(exportFilePath, data);
    })

    //a save file promise is returned
    .then(() => {
        console.log('saved export file to ', exportFilePath)
    })
    .catch(err => {
        console.log('error exporting pdf or saving file ', err)
    })
;
