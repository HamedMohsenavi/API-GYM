// Node Native
const crypto = require('crypto');
const https = require('https');

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

// @TODO: Get Token
Helper.SendSMS = (Phone, Message, Callback) =>
{
    Phone = typeof Phone === 'object' && Phone instanceof Array ? Phone : false;
    Message = typeof Message === 'object' && Message instanceof Array ? Message : false;

    if (Phone && Message)
    {
        const SendMessage = JSON.stringify(
        {
            Messages: Message,
            MobileNumbers: Phone,
            LineNumber: Config.SMS.LineNumber,
            SendDateTime: '',
            CanContinueInCaseOfError: 'false'
        });

        const RequestDetails =
        {
            hostname: 'RestfulSms.com',
            path: '/api/MessageSend',
            method: 'POST',
            headers:
            {
                'Content-Type': 'application/json',
                'Content-Length': SendMessage.length,
                'x-sms-ir-secure-token': ''
            }
        };

        const Request = https.request(RequestDetails, Response =>
        {
            let _Buffer = '';
            let Status = Response.statusCode;

            Response.on('data', Data =>
            {
                _Buffer = JSON.parse(Data);
            });

            Response.on('end', () =>
            {
                if (_Buffer.IsSuccessful && Status === 201)
                    Callback('Sent');
                else
                    Callback('Failed');
            });
        });

        Request.on('error', _Error =>
        {
            Callback(_Error);
        });

        Request.write(SendMessage);
        Request.end();
    }
    else
        Callback('Missing required fields');
};

module.exports = Helper;
