const chromeExport = require('./Export');
const fs = require('fs');

// let regex  = /<(link)([^>]+)href=["']([^>"']*)["']/ig;
// let s = '<link rel="stylesheet" type="text/css" href="';
// console.log(s.replace(regex, 'match')); return;

let upfile = 'c:/xampp7.2.7/htdocs/applications.html'; 
let url = 'http://localhost/applications.html';
url = 'http://localhost/koolreport/examplesLab/reports/cube/sales_by_quarters/';
let exportFile = './exports/export.pdf';
let params = {
    authentication: {
        secretToken: '6e27e9f5b6749f6a981c56c9bb70e0b94a0b9f3edf6d13facea9bbda6c9281a4'
    },
    pageWaiting: 'load',
    httpHost: null,
    baseUrl: null,
    // html: fs.readFileSync(upfile, 'utf8'),
    url: url,
    resourcePatterns: [
        {
            regex: /(KoolReport.load.resources|KoolReport.widget.init)([^"']*)["']([^"']+)["']/ig,
            replace: "<{group1}{group2}'{group3}'",
            urlGroup: "{group3}"
        }
    ]
};
let pdfOptions = {
    format: 'A4' 
};

const exporter = new chromeExport.Exporter(params);
exporter.pdf(pdfOptions)
    .then(() => exporter.save(exportFile))
    .then(() => console.log('save export file to ', exportFile))
    .catch(err => console.log('pdf call error :', err))
;