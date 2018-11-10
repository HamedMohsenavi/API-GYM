// Core
const Database = require('./../Core/Database');
const Helper = require('./../Core/Helper');

// Api
const Session = require('./Session');

// Container for all the check submethods
const Check = { };

Check.Main = (Data, Callback) =>
{
    // Request methods
    const Methods = ['POST', 'GET', 'PUT', 'DELETE'];

    if (Methods.indexOf(Data.Method) > -1)
        Check[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

/**
 *
 * @description Create Check
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Protocol
 * @var {string} Method
 * @var {string} Website
 * @var {object} StatusCode
 * @var {Number} Timeout
 *
 * @description Result: 1 >> Check was successfully created
 *              Result: 2 >> Could not update the account with the new check
 *              Result: 3 >> Could not create the new check
 *              Result: 4 >> The account already has the maximum number of checks (5)
 *              Result: 5 >> Please login to your account
 *              Result: 6 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 500 Internal Server Error
 *
 */

Check.POST = (Data, Callback) =>
{
    // Check that all required fields are filled out
    const Protocol = typeof Data.Payload.Protocol === 'string' && ['http', 'https'].indexOf(Data.Payload.Protocol) > -1 ? Data.Payload.Protocol : false;
    const Method = typeof Data.Payload.Method === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(Data.Payload.Method) > -1 ? Data.Payload.Method : false;
    const Website = typeof Data.Payload.Website === 'string' && Data.Payload.Website.trim().length > 0 ? Data.Payload.Website.trim() : false;
    const StatusCode = typeof Data.Payload.StatusCode === 'object' && Data.Payload.StatusCode instanceof Array && Data.Payload.StatusCode.length > 0 ? Data.Payload.StatusCode : false;
    const Timeout = typeof Data.Payload.Timeout === 'number' && Data.Payload.Timeout % 1 === 0 && Data.Payload.Timeout >= 1 && Data.Payload.Timeout <= 5 ? Data.Payload.Timeout : false;

    if (Protocol && Method && Website && StatusCode && Timeout)
    {
        // Get the session from the header
        const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

        // Lookup the account by reading the session
        Database.Read('Sessions', SessionID, (RError, SessionData) =>
        {
            if (!RError && SessionData)
            {
                let Phone = SessionData.Phone;

                // Lookup the account data
                Database.Read('Accounts', Phone, (RAError, AccountData) =>
                {
                    if (!RAError && AccountData)
                    {
                        const AccountChecks = typeof AccountData.Checks === 'object' && AccountData.Checks instanceof Array ? AccountData.Checks : [];

                        // Verify that the account has less than the number of max checks per account
                        if (AccountChecks.length < 5)
                        {
                            // Create a random id for the check
                            let CheckID = Helper.RandomString(20);

                            // Create the check object, and include the account phone
                            const CheckObject = { CheckID, Phone, Protocol, Method, Website, StatusCode, Timeout };

                            // Save the object
                            Database.Create('Checks', CheckID, CheckObject, CError =>
                            {
                                if (!CError)
                                {
                                    // Add the check id to the account object
                                    AccountData.UpdatedAt = Date.now();
                                    AccountData.Checks = AccountChecks;
                                    AccountData.Checks.push(CheckID);

                                    // Save the new account data
                                    Database.Update('Accounts', Phone, AccountData, UError =>
                                    {
                                        if (!UError)
                                            Callback(200, { Result: 1, CheckObject });
                                        else
                                            Callback(500, { Result: 2 });
                                    });
                                }
                                else
                                    Callback(500, { Result: 3 });
                            });
                        }
                        else
                            Callback(400, { Result: 4 });
                    }
                    else
                        Callback(403);
                });
            }
            else
                Callback(403, { Result: 5 });
        });
    }
    else
        Callback(400, { Result: 6 });
};

/**
 *
 * @description Check information
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} CheckID
 * @var {string} SessionID -- session Header
 *
 * @description Result: 1 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 404 Page not found
 *
 */

Check.GET = (Data, Callback) =>
{
    // Check for required field
    const CheckID = typeof Data.QueryString.CheckID === 'string' && Data.QueryString.CheckID.trim().length === 20 ? Data.QueryString.CheckID : false;

    if (CheckID)
    {
        // Lookup the check
        Database.Read('Checks', CheckID, (RError, CheckData) =>
        {
            if (!RError && CheckData)
            {
                // Get the session from the header
                const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

                // Verify that the given session is valid and belongs to the account who created the check
                Session.Verify(SessionID, CheckData.Phone, SessionIsValid =>
                {
                    if (SessionIsValid)
                    {
                        // Return the check data
                        Callback(200, { CheckData });
                    }
                    else
                        Callback(403);
                });
            }
            else
                Callback(404);
        });
    }
    else
        Callback(400, { Result: 1 });
};

/**
 *
 * @description Update Check
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} CheckID
 * @var {string} session -- Header
 * 
 * @var {string} Protocol
 * @var {string} Method
 * @var {string} Website
 * @var {object} StatusCode
 * @var {Number} Timeout
 *
 * @description Result: 1 >> Could not update the check
 *              Result: 2 >> Check id dose not exist
 *              Result: 3 >> Missing fields to update
 *              Result: 4 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 404 Page not found
 *
 */

Check.PUT = (Data, Callback) =>
{
    // Check for required field
    const CheckID = typeof Data.Payload.CheckID === 'string' && Data.Payload.CheckID.trim().length === 20 ? Data.Payload.CheckID : false;

    // Check for the optional fields
    const Protocol = typeof Data.Payload.Protocol === 'string' && ['http', 'https'].indexOf(Data.Payload.Protocol) > -1 ? Data.Payload.Protocol : false;
    const Method = typeof Data.Payload.Method === 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(Data.Payload.Method) > -1 ? Data.Payload.Method : false;
    const Website = typeof Data.Payload.Website === 'string' && Data.Payload.Website.trim().length > 0 ? Data.Payload.Website.trim() : false;
    const StatusCode = typeof Data.Payload.StatusCode === 'object' && Data.Payload.StatusCode instanceof Array && Data.Payload.StatusCode.length > 0 ? Data.Payload.StatusCode : false;
    const Timeout = typeof Data.Payload.Timeout === 'number' && Data.Payload.Timeout % 1 === 0 && Data.Payload.Timeout >= 1 && Data.Payload.Timeout <= 5 ? Data.Payload.Timeout : false;

    // Check to make sure check id is valid
    if (CheckID)
    {
        // Check to make sure one or more optional fields has been sent
        if (Protocol || Method || Website || StatusCode || Timeout)
        {
            // Lookup the check
            Database.Read('Checks', CheckID, (RError, CheckData) =>
            {
                if (!RError && CheckData)
                {
                    // Get the session from the header
                    const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

                    // Verify that the given session is valid and belongs to the account who created the check
                    Session.Verify(SessionID, CheckData.Phone, SessionIsValid =>
                    {
                        if (SessionIsValid)
                        {
                            // Update the check where necessary
                            if (Protocol)
                                CheckData.Protocol = Protocol;
                            if (Method)
                                CheckData.Method = Method;
                            if (Website)
                                CheckData.Website = Website;
                            if (StatusCode)
                                CheckData.StatusCode = StatusCode;
                            if (Timeout)
                                CheckData.Timeout = Timeout;

                            // Store the new update
                            Database.Update('Checks', CheckID, CheckData, UError =>
                            {
                                if (!UError)
                                    Callback(200, { CheckData });
                                else
                                    Callback(500, { Result: 1 });
                            });
                        }
                        else
                            Callback(403);
                    });                    
                }
                else
                    Callback(400, { Result: 2 });
            });
        }
        else
            Callback(400, { Result: 3 });
    }
    else
        Callback(400, { Result: 4 });
};

/**
 *
 * @description Delete Check
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Phone
 * @var {string} session -- Header
 *
 * @description Result: 1 >> Could not update the account
 *              Result: 2 >> Could not find the check on the account object, so could not remove it
 *              Result: 3 >> Could not find the user who created the check, so could not remove the check from the list of checks on the account object
 *              Result: 4 >> Could not delete the check
 *              Result: 5 >> Check id dose not exist
 *              Result: 6 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 404 Bad Request
 *
 */

Check.DELETE = (Data, Callback) =>
{
    // Check for required field
    const CheckID = typeof Data.QueryString.CheckID === 'string' && Data.QueryString.CheckID.trim().length === 20 ? Data.QueryString.CheckID : false;

    if (CheckID)
    {
        // Lookup the check
        Database.Read('Checks', CheckID, (RError, CheckData) =>
        {
            if (!RError && CheckData)
            {
                // Get the session from the header
                const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

                // Verify that the given session is valid for the phone number
                Session.Verify(SessionID, CheckData.Phone, SessionIsValid =>
                {
                    if (SessionIsValid)
                    {
                        // Delete the check data
                        Database.Delete('Checks', CheckID, DError =>
                        {
                            if (!DError)
                            {
                                Database.Read('Accounts', CheckData.Phone, (RAError, AccountData) =>
                                {
                                    if (!RAError && AccountData)
                                    {
                                        const AccountChecks = typeof AccountData.Checks === 'object' && AccountData.Checks instanceof Array ? AccountData.Checks : [];

                                        let CheckPosition = AccountChecks.indexOf(CheckID);

                                        if (CheckPosition > -1)
                                        {
                                            AccountChecks.splice(CheckPosition, 1);

                                            // Re-save the account data
                                            Database.Update('Accounts', CheckData.Phone, AccountData, DError =>
                                            {
                                                if (!DError)
                                                    Callback(200);
                                                else
                                                    Callback(500, { Result: 1 });
                                            });
                                        }
                                        else
                                            Callback(500, { Result: 2 });
                                    }
                                    else
                                        Callback(404, { Result: 3 });
                                });
                            }
                            else
                                Callback(500, { Result: 4 });
                        });
                    }
                    else
                        Callback(403);
                });
            }
            else
                Callback(400, { Result: 5 });
        });
    }
    else
        Callback(400, { Result: 6 });
};

module.exports = Check;
