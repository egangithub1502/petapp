const CryptoJS = require('crypto-js');
require('dotenv').config();
const key = CryptoJS.enc.Hex.parse(process.env.KEY); // 256-bit key
const iv = CryptoJS.enc.Hex.parse(process.env.IV); // 128-bit IV
const jwt = require('jsonwebtoken');

// Encrypt function
function encryptData(data) {
    const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
}

// Decrypt function
function decryptData(ciphertext) {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
}
function userauth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.json({ status: false, message: 'Unauthorised User' });
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        req.userId = decoded.id;  
        next();
    } catch (error) {
        res.json({ status: false, logoutstatus: error.name === 'TokenExpiredError' ? true : false, message: 'Unauthorised Token' });

    }
}
module.exports = { encryptData, decryptData, userauth }