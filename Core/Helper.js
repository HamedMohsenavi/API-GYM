// Node Native
const Crypto = require('crypto');

// Core
const Config = require('./Config');

let Helper = { };

// Create a SHA256 hash
Helper.Hash = (Value) =>
{
    if (typeof Value === 'string' && Value.length > 0)
        return Crypto.createHmac('sha256', Config.Hash).update(Value).digest('hex');

    return false;
};

Helper.ParseJsonToObject = (Value) =>
{
    try
    {
        return JSON.parse(Value);
    }
    catch (Error)
    {
        return { };
    }
};

module.exports = Helper;
