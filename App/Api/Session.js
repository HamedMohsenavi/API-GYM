// Core
const Database = require('./../Core/Database');
const Helper = require('./../Core/Helper');

// Api
const Account = require('./Account');

// Container for the session submethods
const Session = { };

Session.Main = (Data, Callback) =>
{
    // Request methods
    const Methods = ['POST', 'GET', 'PUT', 'DELETE'];

    if (Methods.indexOf(Data.Method) > -1)
        Session[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

/**
 *
 * @description Create Session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Phone
 * @var {string} Password
 * @var {string} Serial -- Header
 *
 * @description Result: 1 >> Could not create the new session
 *              Result: 2 >> The information entered is not correct (Password)
 *              Result: 3 >> The information entered is not correct (Account)
 *              Result: 4 >> Missing required fields
*               Result: 5 >> Missing required serial in header, or serial is invalid
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

Session.POST = (Data, Callback) =>
{
    const Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone : false;
    const Password = typeof Data.Payload.Password === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password : false;

    if (Phone && Password)
    {
        Database.Read('Accounts', Phone, (RError, AccountData) =>
        {
            if (!RError && AccountData)
            {
                let SHAPassword = Helper.Hash(Password);

                if (SHAPassword === AccountData.SHAPassword)
                {
                    let SessionObject = { SessionID: Helper.RandomString(20), Phone, Expire: Date.now() + 1000 * 60 * 60 * 24 };

                    // Store the session
                    Database.Create('Sessions', SessionObject.SessionID, SessionObject, CError =>
                    {
                        if (!CError)
                            Callback(200, SessionObject);
                        else
                            Callback(500, { Result: 1 });
                    });
                }
                else
                    Callback(400, { Result: 2 });
            }
            else
                Callback(400, { Result: 3 });
        });
    }
    else
        Callback(400, { Result: 4 });
};

/**
 *
 * @description Get session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Phone
 *
 * @description Result: 1 >> Session not found
 *              Result: 2 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 404 Page not found
 *
 */

Session.GET = (Data, Callback) =>
{
    const SessionID = typeof Data.QueryString.SessionID === 'string' && Data.QueryString.SessionID.trim().length === 20 ? Data.QueryString.SessionID : false;

    if (SessionID)
    {
        Database.Read('Sessions', SessionID, (RError, SessionData) =>
        {
            if (!RError && SessionData)
                Callback(200, SessionData);
            else
                Callback(404, { Result: 1 });
        });
    }
    else
        Callback(400, { Result: 2 });
};

/**
 *
 * @description Update Session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} SessionID
 * @var {string} Extend
 *
 * @description Result: 1 >> Could not update the session expration
 *              Result: 2 >> The session has already expired
 *              Result: 3 >> Session not found
 *              Result: 4 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

Session.PUT = (Data, Callback) =>
{
    const SessionID = typeof Data.Payload.SessionID === 'string' && Data.Payload.SessionID.trim().length === 20 ? Data.Payload.SessionID : false;
    const Extend = !!(typeof Data.Payload.Extend === 'boolean' && Data.Payload.Extend === true);

    if (SessionID && Extend)
    {
        Database.Read('Sessions', SessionID, (RError, SessionData) =>
        {
            if (!RError && SessionData)
            {
                if (SessionData.Expire > Date.now())
                {
                    SessionData.Expire = Date.now() + 1000 * 60 * 60 * 24;

                    // Store the new update
                    Database.Update('Sessions', SessionID, SessionData, UError =>
                    {
                        if (!UError)
                            Callback(200, SessionData);
                        else
                            Callback(500, { Result: 1 });
                    });
                }
                else
                    Callback(400, { Result: 2 });
            }
            else
                Callback(400, { Result: 3 });
        });
    }
    else
        Callback(400, { Result: 4 });
};

/**
 *
 * @description Delete session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} SessionID
 *
 * @description Result: 1 >> Session was successfully deleted
 *              Result: 2 >> Could not delete the session
 *              Result: 3 >> Session not found
 *              Result: 4 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 404 Page not found, 500 Internal Server Error
 *
 */

Session.DELETE = (Data, Callback) =>
{
    const SessionID = typeof Data.QueryString.SessionID === 'string' && Data.QueryString.SessionID.trim().length === 20 ? Data.QueryString.SessionID : false;

    if (SessionID)
    {
        Database.Read('Sessions', SessionID, (RError, SessionData) =>
        {
            if (!RError && SessionData)
            {
                Database.Delete('Sessions', SessionID, DError =>
                {
                    if (!DError)
                        Callback(200, { Result: 1 });
                    else
                        Callback(500, { Result: 2 });
                });
            }
            else
                Callback(404, { Result: 3 });
        });
    }
    else
        Callback(400, { Result: 4 });
};

/**
 *
 * @description Verify session, If a given session id is currently valid for a given account
 *
 * @param {string} SessionID
 * @param {Number} Phone
 * @param {object} Callback - True, False
 *
 */

Session.Verify = (SessionID, Phone, Callback) =>
{
    Database.Read('Sessions', SessionID, (RError, SessionData) =>
    {
        if (!RError && SessionData)
        {
            // Check that the session is for the given account and not expired
            if (SessionData.Phone === Phone && SessionData.Expire > Date.now())
                Callback(true);
            else
                Callback(false);
        }
        else
            Callback(false);
    });
};

module.exports = Session;
