const http = require('http');
const https = require('https');
const fs = require('fs');
const urlUtil = require('url');
const uuidGen = require('./uuidv4');
const AdmZip = require('adm-zip');

class Exporter {

    constructor(params) {
        this.params = params;
        this.tempDir = './temp';
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

    makeDirAsync(dirPath) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dirPath, { recursive: true }, (err) => {
                if (err) reject(err);
                resolve(dirPath);
            });
        });
    }

    sendRequest(options, body) {
        return new Promise((resolve, reject) => {
            let response = "";
            // let req = http.request(options, res => {
            let req = https.request(options, res => {
                res.setEncoding('binary');
                // res.setEncoding('utf8');
                console.log('STATUS: ' + res.statusCode);
                console.log('HEADERS: ' + JSON.stringify(res.headers));
                res.on('data', chunk =>  {
                    // console.log('body data'); 
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
        return new Promise((resolve, reject) => {
            fileContent = this.zip.toBuffer(); 
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
                fileContent,
                // Buffer.from(fileContent, 'binary'),
                Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
            ]);
    
            let options = { 
                // host: "localhost",
                // port: "1982",
                host: "service.chromeheadless.io",
                // port: "1982",
                path: "/api/export",
                method: "POST",
                headers: { 
                    Authorization: "Bearer " + params.authentication.secretToken,
                    'content-length': Buffer.byteLength(body),
                    'content-type': 'multipart/form-data;boundary=' + boundary
                },
            };
            resolve([options, body]);
        }); 
    }

    getUrlContent(url, showLastChunk) {
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

    makeUuidTempDir() {
        return new Promise((resolve, reject) => {
            this.makeDirAsync(this.tempDir + "/" + this.uuid)
                .then(dirPath => {
                    this.uuidTempDir = dirPath;
                    resolve(dirPath);
                })
                .catch(err => reject(err))
            ;
        });
    }

    saveTempContent() {
        let zip = this.zip = new AdmZip();
        let html = this.html;
        // console.log('this.html =', html);
        let resourcePatterns = [
            {
                regex: /<(link)([^>]+)href=["']([^>"']*)["']/ig,
                replace: "<{group1}{group2}href='{group3}'",
                urlGroup: "{group3}"
            },
            {
                regex: /<(script|img|iframe)([^>]+)src=["']([^>"']*)["']/ig,
                replace: "<{group1}{group2}src='{group3}'",
                urlGroup: "{group3}"
            }
        ];
        if (this.params.resourcePatterns) {
            resourcePatterns = resourcePatterns.concat(this.params.resourcePatterns);
        }
        let fileList = {};
        let numGroup = 1, urlOrder = 1;
        let regex = /\{group(\d+)\}/ig;
        
        return new Promise((resolve, reject) => {
            let getContentPromises = [];
            let replaceUrls = (html, rp) => {
                let flag = true;
                while (flag) {
                    flag = false;
                    html = html.replace(rp.regex, 
                        (...args) => {
                            let match = args[0];
                            // console.log('regex match =', match);
                            let url = args[urlOrder];
                            let urlOffset = match.indexOf(url);
                            let subMatch = match.substr(0, urlOffset);
                            // console.log('subMatch =', subMatch);
                            let repSubMatch = replaceUrls(subMatch, rp);
                            // console.log('repSubMatch =', repSubMatch);
                            if (repSubMatch !== subMatch) {
                                // console.log('repSubMatch !== subMatch');
                                flag = true;
                                return repSubMatch + match.substr(urlOffset);
                            }
                            // console.log('found url =', url);
                            url = url.replace(/\\/g, "");
                            if (url[0] === '/') {
                                url = this.httpHost + url;
                            }
                            if (url.substr(0, 4) !== 'http') {
                                url = this.baseUrl + '/' + url;
                            }
                            let filename = this.getFilenameFromUrl(url);
                            if (! fileList[filename]) {
                                console.log('retrieve url =', url);
                                fileList[filename] = true;
                                // console.log('filename =', filename);
                                let p = this.getUrlContent(url);
                                p.then(data => {
                                    zip.addFile(filename, Buffer.from(data, 'binary'));
                                })
                                .catch(err => {
                                    console.log('error retrieving ', filename, err);
                                });
                                getContentPromises.push(p);
                            }
                            let replaceStr = rp.replace;
                            for (let j=1; j<=numGroup; j+=1) {
                                let groupStr = j === urlOrder ? filename : args[j];
                                replaceStr = replaceStr.replace(`{group${j}}`, groupStr);
                            }
                            // console.log('replaceStr =', replaceStr);
                            return replaceStr;
                        }
                    );
                }
                return html;
            };
            for (let i=0; i<resourcePatterns.length; i+=1) {
                let rp = resourcePatterns[i];
                rp.replace.replace(regex, function(match, g1) {
                    g1 *= 1;
                    if (g1 > numGroup) numGroup = g1;
                    return match;
                });
                rp.replace.replace(regex, function(match, g1) {
                    urlOrder = 1 * g1;
                    return match;
                });
                console.log("numGroup =", numGroup);
                console.log("urlOrder =", urlOrder);
                html = replaceUrls(html, rp);
            }
            Promise.all(getContentPromises)
                .then(res => {
                    console.log('getContentPromises resolved');
                    zip.addFile("export.html", Buffer.alloc(html.length, html));
                    let zipFilePath = this.tempDir + "/" + this.uuid + ".zip";
                    zip.writeZip(zipFilePath);
                    resolve(zipFilePath);
                })
                .catch(err => reject(err))
            ;
        });
    }

    getHtmlFromParams() {
        return new Promise((resolve, reject) => {
            let params = this.params;

            let url = '';
            if (params.html) { 
                this.html = params.html;
                this.httpHost = 'http://127.0.0.1';
                this.baseUrl = 'http://127.0.0.1';
                resolve(this.html);
            } else if (params.url) {
                let url = params.url;
                if (! url.startsWith('http')) {
                    url = 'http://' + url;
                }
                let urlParse = urlUtil.parse(url);
                this.httpHost = urlParse.protocol + '//' + urlParse.hostname;
                let baseUrl = this.httpHost + '/' + urlParse.path;
                while (baseUrl.substr(-1) === '/') baseUrl = baseUrl.slice(0, -1);
                this.baseUrl = baseUrl;
                console.log('this.baseUrl =', this.baseUrl);
                this.getUrlContent(url)
                    .then(data => {
                        this.html = data;
                        resolve(this.html);
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
            this.uuid = uuidGen();

            this.getHtmlFromParams()
                // .then(() => this.makeUuidTempDir())
                .then(() => this.saveTempContent())
                // .then(zipFilePath => this.readFileAsync(zipFilePath))
                .then(() => this.prepareRequestData())
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

