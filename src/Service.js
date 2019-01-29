const Exporter = require('./Exporter');
const ioHelper = require('./ioHelper');

class Service {

    constructor(authentication) {
        if (typeof authentication === 'string') {
            authentication = {
                secretToken: authentication
            };
        }
        this.export = new Exporter(authentication);
    }

    export2(params) {
        this.export.params = params;
        return this;
    }

    pdf(pdfOptions) {
        return this.export.pdf(pdfOptions);
    }

    save(filePath, data, option) {
        option = option || 'base64';
        return ioHelper.writeFileAsync(filePath, data, option);
    }
}

module.exports = Service;

