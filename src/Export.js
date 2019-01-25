const http = require('http');
const https = require('https');
const fs = require('fs');

class Exporter {

    constructor(params) {
        this.params = params;
    }

    export(format, pageOtions) {
        var boundary = '------------------------fe017aa0c2cf6d12';
        let upfile = this.params.file;
        fs.readFile(upfile, (err, fileContent) => {
            if(err){
                console.error(err);
            }
            let data = "";
            var metadata = {
                token: "### access token ###",
                channels: "sample",
                filename: "samplefilename",
                title: "sampletitle",
            };
            for(var i in metadata) {
                if ({}.hasOwnProperty.call(metadata, i)) {
                    data += "--" + boundary + "\r\n";
                    data += "Content-Disposition: form-data; name=\"" + i + "\"; \r\n\r\n" + metadata[i] + "\r\n";
                }
            };
            data += "--" + boundary + "\r\n";
            data += "Content-Disposition: form-data; name=\"fileToExport\"; filename=\"" + upfile + "\"\r\n";
            data += "Content-Type:text/html\r\n\r\n";
            var body = Buffer.concat([
                    Buffer.from(data, "utf8"),
                    new Buffer(fileContent, 'binary'),
                    Buffer.from("\r\n--" + boundary + "--\r\n", "utf8"),
            ]);

            let options = {
                host: "localhost",
                port: "1982",
                path: "/api/export",
                method: "POST",
                headers: { 
                    Authorization: "Bearer " + this.params.authentication.secretToken,
                    'content-length': Buffer.byteLength(body),
                    'content-type': 'multipart/form-data;boundary=' + boundary
                },
            }; 
            let response = '';
            return new Promise((resolve, reject) => {
                let req = http.request(options, function(res) {
                    res.setEncoding('binary');
                    console.log('STATUS: ' + res.statusCode);
                    console.log('HEADERS: ' + JSON.stringify(res.headers));
                    // res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        console.log('body data');
                        response += chunk;
                    });
                    res.on("end", function(){ 
                        console.log('request end');
                        fs.writeFile('./exports/export.pdf', response, 'binary', function(err) {
                            if(err) {
                                return console.log(err);
                            }
                            console.log("export file was saved!");
                        });
                        resolve(this); 
                    });
                });
                req.write(body);
                req.on('error', function(e) {
                    console.log('problem with request: ' + e.message);
                    reject(e);
                });
                
                req.end();
            });
        });

        // const formData = {
        //     // Pass a simple key-value pair
        //     exportFormat: format,
        //     // Pass data via Buffers
        //     // my_buffer: Buffer.from([1, 2, 3]),
        //     // Pass data via Streams
        //     fileToExport: fs.createReadStream(this.params.file),
        //     // Pass multiple values /w an Array
        //     // attachments: [
        //     //     fs.readFileSync(this.params.file)
        //     //     fs.createReadStream(__dirname + '/attachment2.jpg')
        //     // ],
        //     // Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS}
        //     // Use case: for some types of streams, you'll need to provide "file"-related information manually.
        //     // See the `form-data` README for more information about options: https://github.com/form-data/form-data
        //     // fileToUpload: {
        //     //     value:  fs.createReadStream(this.params.file),
        //     //     options: {
        //     //         contentType: 'text/html'
        //     //     }
        //     // }
        // };
        // return new Promise((resolve, reject) => {
        //     request.post(
        //         {
        //             url:'http://localhost:1982/api/export', 
        //             //encoding to be used on setEncoding of response data. 
        //             // If null, the body is returned as a Buffer. 
        //             // Anything else (including the default value of undefined)
        //             // will be passed as the encoding parameter to toString() 
        //             // (meaning this is effectively utf8 by default). 
        //             // (Note: if you expect binary data, you should set encoding: null.)
        //             encoding: null, 
        //             headers: { 
        //                 "Authorization": "Bearer " + this.params.authentication.secretToken,
        //                 "Content-Type": "multipart/form-data",
        //             },
        //             formData: formData
        //         }, 
        //         function optionalCallback(err, httpResponse, body) {
        //             if (err) {
        //                 console.error('upload failed:', err);
        //                 reject(err);
        //             }
        //             // console.error('response =', httpResponse);
        //             // this.response = body;
        //             fs.writeFile('export.pdf', body, 'binary', function(err) {
        //                 if (err) {
        //                     console.log('error while writing file :', err);
        //                 } else {
        //                     console.log('file saved successfully!');
        //                 }
        //             }); 
        //             resolve(body); 
        //         }
        //     );
        // });
    } 

    pdf(pdfOptions) {
        let body = this.export('pdf', pdfOptions);
        console.log("await export finished");
        
        return this;
    } 

    download(exportFile) {
        fs.writeFile(exportFile, this.response, function(err) {
            if(err) {
                return console.log(err);
            }
            console.log("export file was saved!");
        });
    }
} 


module.exports = {
    Exporter: Exporter
}

