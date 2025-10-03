const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;
function sign(payload, expiresIn='2h'){ return jwt.sign(payload, secret, { expiresIn }); }
function verify(token){ return jwt.verify(token, secret); }
module.exports = { sign, verify };