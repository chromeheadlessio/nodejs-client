const fs = require('fs');
const http = require('http');
const https = require('https');

module.exports = {
    readFileAsync: (filePath) => {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, fileContent) => {
                if (err) {
                    reject(err);
                } 
                resolve(fileContent);
            });
        });
    },

    writeFileAsync: (filePath, content, mode = 'utf8') => {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, content, mode, 
                err => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                }
            );
        });
    },

    makeDirAsync: (dirPath) => {
        return new Promise((resolve, reject) => {
            fs.mkdir(dirPath, { recursive: true }, (err) => {
                if (err) reject(err);
                resolve(dirPath);
            });
        });
    },

    getUrlContent: (url) => {
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
    },

    getFilenameFromUrl: (url) => {
        return url.split('/').pop().split('#')[0].split('?')[0];
    }
}