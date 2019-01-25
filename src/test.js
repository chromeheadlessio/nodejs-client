// const chromeExport = require('./Export');
const http = require('http');
const https = require('https');
const fs = require('fs');


function getFilenameFromUrl(url) {
    return url.split('/').pop().split('#')[0].split('?')[0];
}
function getUrlContent(url) {
    return new Promise((resolve, reject) => {
        let client = url.startsWith('https') ? https : http;
        let req = client.get(url, res => {
            let data = '';

            // A chunk of data has been recieved.
            res.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            res.on('end', () => {
                resolve(data);
            });

        })
        req.on("error", (err) => {
            reject(err);
        });
    });
};
function writeFileAsync(filePath, content) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, content, err => {
            if (err) {
                reject(err);
            }
            resolve();
        });
    });
} 
let n = 0;
html = '<link rel="shortcut icon" href="https://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico?v=4f32ecc8f43d">';
html = html.replace(/<(link)([^>]+)href=["\']([^>]*)["\']/ig, 
    function(match, m1, m2, m3, offset, inputString) {
        console.log('\n\n\nregex match number ' + (++n));
        console.log(match);
        console.log(m1);
        console.log(m2);
        console.log(m3);
        console.log(offset);
        console.log(inputString);

        let url = m3;
        if (url[0] === '/') {
            url = this.httpHost + url;
        }
        if (url.substr(0, 4) !== 'http') {
            url = this.baseUrl + '/' + url;
        }
        let filename = getFilenameFromUrl(url);
        console.log('filename =', filename);
        getUrlContent(url)
            .then(data => {
                writeFileAsync('./temp/' + filename, data);
            })
        return `${m1}${m2}href="${filename}"`;
    }
);
console.log('new html =', html);
return;

// const urlUtil = require('url');
// let urlParse = urlUtil.parse('http://user1:pass1@stackoverflow.com/questions/17184791');
// console.log(urlParse.protocol);
// console.log(urlParse);
// return;

// let upfile = 'c:/xampp7.2.7/htdocs/applications.zip'; 
// let exportFile = './exports/export.pdf';
// let params = {
//     authentication: {
//         secretToken: '6e27e9f5b6749f6a981c56c9bb70e0b94a0b9f3edf6d13facea9bbda6c9281a4'
//     },
//     pageWaiting: 'load',
//     httpHost: null,
//     baseUrl: null,
//     html: fs.createReadStream(upfile),
//     url: null,
//     file: upfile
// };
// let pdfOptions = {
//     format: 'A4' 
// };

// const exporter = new chromeExport.Exporter(params);
// exporter.pdf(pdfOptions)
//     .then(() => exporter.save(exportFile))
//     .then(() => console.log('save export file to ', exportFile))
//     .catch(err => console.log('pdf call error :', err))
// ;