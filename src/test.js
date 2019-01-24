import Export from './Export';
import fs from 'fs';

let upfile = 'c:/xampp7.2.7/htdocs/applications.html';
let params = {
    authentication: {
        secretToken: '6e27e9f5b6749f6a981c56c9bb70e0b94a0b9f3edf6d13facea9bbda6c9281a4'
    },
    pageWaiting: 'load',
    httpHost: null,
    baseUrl: null,
    html: fs.createReadStream(upfile),
    url: null,
    file: upfile
};
let pdfOptions = {
    format: 'A4'
};

Export.create(params)
    .pdf(pdfOptions)
    // .download('export.pdf')
;