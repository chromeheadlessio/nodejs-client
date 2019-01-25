const http = require('http');
const https = require('https');
const fs = require('fs');
const urlUtil = require('url');

class Exporter {

    constructor(params) {
        this.params = params;
    }

    readFileAsync(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, fileContent) => {
                if (err) {
                    reject(err);
                } 
                resolve(fileContent);
            });
        });
    }

    writeFileAsync(filePath, content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, content, err => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }

    sendRequest(options, body) {
        return new Promise((resolve, reject) => {
            let response = "";
            let req = http.request(options, res => {
                res.setEncoding('binary');
                // res.setEncoding('utf8');
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.on('data', chunk =>  {
                    console.log('body data');
                    response += chunk;
                });
                res.on("end", () => { 
                    console.log('request end');
                    // this.response = response;
                    resolve(response);
                });
            });
            req.on('error', err => {
                console.log('problem with request: ' + err.message);
                reject(err);
            });
            
            req.write(body);
            req.end();
        });
    }

    prepareRequestData(fileContent) {
        let params = this.params;
        let upfile = params.file, pageOptions = params.pageOptions;
        let boundary = '------------------------fe017aa0c2cf6d12';
        let data = "";
        var metadata = {
            title: "sampletitle",
        };
        for(var i in metadata) {
            if ({}.hasOwnProperty.call(metadata, i)) {
                data += "--" + boundary + "\r\n";
                data += "Content-Disposition: form-data; name=\"" + i + "\"; \r\n\r\n" + metadata[i] + "\r\n";
            }
        };
        data += "--" + boundary + "\r\n";
        data += "Content-Disposition: form-data; name=\"fileToExport\"; filename=\"" 
            + upfile + "\"\r\n";
        data += "Content-Type:application/zip\r\n\r\n";
        var body = Buffer.concat([
            Buffer.from(data, "utf8"),
            Buffer.from(fileContent, 'binary'),
            Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
        ]);

        let options = { 
            host: "localhost",
            port: "1982",
            path: "/api/export",
            method: "POST",
            headers: { 
                Authorization: "Bearer " + params.authentication.secretToken,
                'content-length': Buffer.byteLength(body),
                'content-type': 'multipart/form-data;boundary=' + boundary
            },
        };

        return new Promise((resolve, reject) => resolve([options, body]));
    }

    getUrlContent(url) {
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

    getFilenameFromUrl(url) {
        return url.split('/').pop().split('#')[0].split('?')[0];
    }

    saveTempContent(html) {
        return new Promise((resolve, reject) => {
            html = html.replace(/<(link)([^>]+)href=["\']([^>]*)["\']/ig, 
                function(match, m1, m2, m3, offset, inputString) {
                    let url = m3;
                    if (url[0] === '/') {
                        url = this.httpHost + url;
                    }
                    if (url.substr(0, 4) !== 'http') {
                        url = this.baseUrl + '/' + url;
                    }
                    let filename = this.getFilenameFromUrl(url);
                    this.getUrlContent(url)
                        .then(data => {
                            this.writeFileAsync('./temp/' + filename, data);
                        });
                    return `${m1}${m2}href="${filename}"`;
                }
            );
        });
    }

    getHtmlFromParams() {
        return new Promise((resolve, reject) => {
            let params = this.params;
            params.pageOptions = pdfOptions;

            let html = '', url = '';
            if (params.html) {
                html = params.html;
                this.httpHost = 'https://127.0.0.1';
                this.baseUrl = 'https://127.0.0.1';
                resolve(html);
            } else if (params.url) {
                let url = params.url;
                if (! url.startsWith('http')) {
                    url = 'http://' + url;
                }
                let urlParse = urlUtil.parse(url);
                this.httpHost = urlParse.protocol + '//' + urlParse.hostname;
                this.baseUrl = this.httpHost + '/' + urlParse.path;
                this.getUrlContent(url)
                    .then(data => {
                        html = data;
                        resolve(html);
                    })
                    .catch(err => {
                        console.log('get url error :', err);
                        reject(err);
                    })
                ;
            }
            
        });
    }

    pdf(pdfOptions) {
        return new Promise((resolve, reject) => {
            let params = this.params;
            params.pageOptions = pdfOptions;
            let upfile = params.file;

            this.getHtmlFromParams()
                .then(html => this.saveTempContent(html))
                .then((zipFile) => this.readFileAsync(zipFile)
                .then(fileContent => this.prepareRequestData(fileContent))
                .then(([options, body]) => this.sendRequest(options, body))
                .then(response => {
                    this.response = response;
                    resolve(response);
                })
                .catch(err => {
                    console.log('pdf call catch error :', err);
                    reject(err);
                })
            ;
        });
    } 

    save(exportFile) {
        return new Promise((resolve, reject) => {
            fs.writeFile(exportFile, this.response, 'binary', 
                err => {
                    if (err) {
                        // console.log(err);
                        reject(err);
                    }
                    console.log("export file was saved!");
                    resolve();
                }
            );
        })
    }
} 


module.exports = {
    Exporter: Exporter
}

