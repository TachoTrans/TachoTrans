const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const { Buffer } = require('buffer');

class Tachograf {
    constructor(path) {
        this.path = path;
        this.position = 0;
        this.JSONdata = {};
    }
    async read() {
        try {
            this.bytes = await readFileAsync(this.path);
            const tag = this.readInt(this.bytes, this.position, 2);
            const decrypted = this.readInt(this.bytes, this.position, 1);
            const length = this.readInt(this.bytes, this.position, 2);
            console.log(`rozmiar pliku: ${this.bytes.length} TAG: ${tag} decrypted: ${decrypted} length: ${length}`);
            const data = this.readBytes(this.bytes, this.position, length);
            switch (tag) {
                case 2:
                    this.decodeED_ICC(data, 'EF ICC');
                    break;
                default:
                    console.log('nieznany tag');
                    break;
            }
            console.log(JSON.stringify(this.JSONdata));
        } catch (error) {
            console.log(error);
        }
    }

    readInt(data, start, length) {
        if (start + length > data.length) {
            throw new Error('Invalid start or length value.');
        }
        let result = 0;
        for (let i = start; i < start + length; i++) {
            result = (result << 8) | (data[i] & 0xff);
        }
        this.position = start + length;
        return result;
    }

    readBytes(data, start, length) {
        if (start + length > data.length) {
            throw new Error('Invalid start or length value.');
        }
        const result = data.slice(start, start + length);
        this.position = start + length;
        return result;
    }

    decodeED_ICC(data, prefix) {
        if (data.length != 25) {
            console.log('ED_ICC length error');
            return;
        }
        const localJSONdata = {};
        const cardIccIdentification = {};
        cardIccIdentification['clockStop'] = data[0];
        this.decodeExtendedSerialNumber(this.readBytes(data, 1, 8), 'cardExtendedSerialNumber', cardIccIdentification);
        cardIccIdentification['cardApprovalNumber'] = (this.readBytes(data, 9, 8).toString());
        cardIccIdentification['cardPersonaliserID'] = this.bytesToOctetString(this.readBytes(data, 17, 1));
        cardIccIdentification['embedderICAssemblerId'] = this.bytesToOctetString(this.readBytes(data, 18, 5));
        cardIccIdentification['icIdentifer'] = this.bytesToOctetString(this.readBytes(data, 23, 2));
        localJSONdata['CardIccIdentification'] = cardIccIdentification;
        this.JSONdata[prefix] = localJSONdata;
    }

    decodeExtendedSerialNumber(data, prefix, localJson) {
        if (data.length !== 8) {
            console.log("ExtendedSerialNumber length error");
            return;
        }
        localJson[prefix] = {};
        localJson = localJson[prefix];
        // INTEGER(0..23^2-1)
        localJson["serialNumber"] = this.readInt(data, 0, 4);
        // BCDString(SIZE(2))
        localJson["monthYear"] = this.numberFromBCD(this.readBytes(data, 4, 2));
        // STRING(SIZE(1))
        localJson["type"] = data[6] & 0xFF;
        // ManufacturerCode
        localJson["manufacturerCode"] = this.bytesToOctetString(this.readBytes(data, 7, 1));
    }

    numberFromBCD(bytes) {
        let data = "";
        for (let i = 0; i < bytes.length; i++) {
            data += ((bytes[i] >> 4) & 0x0F).toString();
            data += (bytes[i] & 0x0F).toString();
        }
        return data;
    }

    bytesToOctetString(bytes) {
        let sb = "";
        for (let i = 0; i < bytes.length; i++) {
            sb += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16).toUpperCase();
        }
        return sb;
    }
}
module.exports.Tachograf = Tachograf;