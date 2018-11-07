// Node Native
const crypto = require('crypto');

// Core
const Config = require('./Config');

// Container for all the helper
const Helper = { };

Helper.Hash = (Value) =>
{
    if (typeof Value === 'string' && Value.length > 0)
        return crypto.createHmac('sha256', Config.Hash).update(Value).digest('hex');

    return false;
};

Helper.ParseJsonToObject = (Value) =>
{
    try
    {
        return JSON.parse(Value);
    }
    catch (_Error)
    {
        return { };
    }
};

Helper.RandomString = (Length) =>
{
    Length = typeof Length === 'number' && Length > 0 ? Length : false;

    if (Length)
    {
        const Possible = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let Result = '';

        for (let I = 0; I < Length; I++)
            Result += Possible.charAt(Math.floor(Math.random() * Possible.length));

        return Result;
    }

    return false;
};

module.exports = Helper;
