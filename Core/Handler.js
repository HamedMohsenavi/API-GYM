// Core
const Database = require('./Database');
const Helper = require('./Helper');
const Config = require('./Config');

// Define all the handlers
let Handler = { };
Handler._Account = { };
Handler._Token = { };
Handler._Check = { };

// Request methods
const Method = ['POST', 'GET', 'PUT', 'DELETE'];

// Account Handler
Handler.Account = (Data, Callback) =>
{
    if (Method.indexOf(Data.Method) > -1)
        Handler._Account[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

// Token Handler
Handler.Token = (Data, Callback) =>
{
    if (Method.indexOf(Data.Method) > -1)
        Handler._Token[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

// Check Handler
Handler.Check = (Data, Callback) =>
{
    if (Method.indexOf(Data.Method) > -1)
        Handler._Check[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

/*
 * Method: POST
 * Required Data: FirstName, LastName, Phone, Password, TosAgreement
 * Optional data: None
 */
Handler._Account.POST = (Data, Callback) =>
{
    // Check the all Required fields are filled out
    const FirstName = typeof Data.Payload.FirstName === 'string' && Data.Payload.FirstName.trim().length > 0 ? Data.Payload.FirstName.trim() : false;
    const LastName = typeof Data.Payload.LastName === 'string' && Data.Payload.LastName.trim().length > 0 ? Data.Payload.LastName.trim() : false;
    const Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone.trim() : false;
    const Password = typeof Data.Payload.Password === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password.trim() : false;
    const TosAgreement = !!(typeof Data.Payload.TosAgreement === 'boolean' && Data.Payload.TosAgreement === true);

    if (FirstName && LastName && Phone && Password && TosAgreement)
    {
        // Make sure that the user dosent already exist
        Database.Read('Accounts', Phone, (Error, AccountData) =>
        {
            if (Error)
            {
                let HashedPassword = Helper.Hash(Password);

                if (HashedPassword)
                {
                    let AccountObject = { FirstName, LastName, Phone, HashedPassword, TosAgreement };

                    // Store a account
                    Database.Create('Accounts', Phone, AccountObject, Error =>
                    {
                        if (!Error)
                            Callback(200, { 'Successfully': 'Account created' }); // 200 OK
                        else
                            Callback(500, { 'Error': 'Could not create the new account' }); // 500 Internal Server Error
                    });
                }
                else
                    Callback(500, { 'Error': 'Could not hash the account password' }); // 500 Internal Server Error
            }
            else
                Callback(400, { 'Error': 'A account with that phone number already exists' }); // 400 Bad Request
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: GET
 * Required Data: Phone
 * Optional data: None
 */
Handler._Account.GET = (Data, Callback) =>
{
    // Required data
    const Phone = typeof Data.QueryString.Phone === 'string' && Data.QueryString.Phone.trim().length === 11 ? Data.QueryString.Phone.trim() : false;

    if (Phone)
    {
        // Get the token from headers
        const Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

        // Verify that the given token is valid for the phone number
        Handler._Token.Verify(Token, Phone, TokenIsValid =>
        {
            if (TokenIsValid)
            {
                Database.Read('Accounts', Phone, (Error, AccountData) =>
                {
                    if (!Error && AccountData)
                    {
                        delete AccountData.HashedPassword;

                        Callback(200, AccountData);
                    }
                    else
                        Callback(400, { 'Error': 'Account Not Found' }); // 400 Bad Request
                });
            }
            else
                Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: PUT
 * Required Data: Phone
 * Optional data: FirstName, LastName, Password (at least one must be specified)
 */
Handler._Account.PUT = (Data, Callback) =>
{
    // Required data
    const Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone.trim() : false;

    // Check the optional fields
    const FirstName = typeof Data.Payload.FirstName === 'string' && Data.Payload.FirstName.trim().length > 0 ? Data.Payload.FirstName.trim() : false;
    const LastName = typeof Data.Payload.LastName === 'string' && Data.Payload.LastName.trim().length > 0 ? Data.Payload.LastName.trim() : false;
    const Password = typeof Data.Payload.Password === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password.trim() : false;

    if (Phone)
    {
        if (FirstName || LastName || Password)
        {
            // Get the token from headers
            const Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

            // Verify that the given token is valid for the phone number
            Handler._Token.Verify(Token, Phone, TokenIsValid =>
            {
                if (TokenIsValid)
                {
                    Database.Read('Accounts', Phone, (Error, AccountData) =>
                    {
                        if (!Error && AccountData)
                        {
                            if (FirstName)
                                AccountData.FirstName = FirstName;

                            if (LastName)
                                AccountData.LastName = LastName;

                            if (Password)
                                AccountData.HashedPassword = Helper.Hash(Password);

                            // Store the new update
                            Database.Update('Accounts', Phone, AccountData, Error =>
                            {
                                if (!Error)
                                    Callback(200, { 'Successfully': `Account Updated` }); // 200 OK
                                else
                                    Callback(500, { 'Error': 'Could not update the account' }); // 500 Internal Server Error
                            });
                        }
                        else
                            Callback(400, { 'Error': 'Account Not Found' }); // 400 Bad Request
                    });
                }
                else
                    Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
            });
        }
        else
            Callback(400, { 'Error': 'Missing fields to update' }); // 400 Bad Request
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: DELETE
 * Required Data: Phone
 * Optional data: None
 */
Handler._Account.DELETE = (Data, Callback) =>
{
    // Required data
    let Phone = typeof Data.QueryString.Phone === 'string' && Data.QueryString.Phone.trim().length === 11 ? Data.QueryString.Phone.trim() : false;

    if (Phone)
    {
        // Get the token from headers
        let Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

        // Verify that the given token is valid for the phone number
        Handler._Token.Verify(Token, Phone, TokenIsValid =>
        {
            if (TokenIsValid)
            {
                Database.Read('Accounts', Phone, (Error, AccountData) =>
                {
                    if (!Error && AccountData)
                    {
                        Database.Delete('Accounts', Phone, Error =>
                        {
                            if (!Error)
                            {
                                // Delete each of the checks associated with the account
                                const AccountCheck = typeof AccountData.Check === 'object' && AccountData.Check instanceof Array ? AccountData.Check : [ ];

                                if (AccountCheck.length > 0)
                                {
                                    let Count = 0;
                                    let Errors = false;

                                    AccountCheck.forEach(CheckID =>
                                    {
                                        Database.Delete('Checks', CheckID, Error =>
                                        {
                                            if (Error)
                                                Errors = true;

                                            Count++;

                                            if (Count === AccountCheck.length)
                                            {
                                                if (!Errors)
                                                    Callback(200, { 'Successfully': `The check was successfully deleted` }); // 200 OK
                                            }
                                            else
                                                Callback(500, { 'Error': 'Errors encountered while attempting to delete all of the account checks' });
                                        });
                                    });
                                }
                                else
                                    Callback(200, { 'Successfully': `The account was successfully deleted` }); // 200 OK
                            }
                            else
                                Callback(500, { 'Error': 'Could not delete the account' }); // 500 Internal Server Error
                        });
                    }
                    else
                        Callback(400, { 'Error': 'Account Not Found' }); // 400 Bad Request
                });
            }
            else
                Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: POST
 * Required Data: Phone, Password
 * Optional data: None
 */
Handler._Token.POST = (Data, Callback) =>
{
    // Required data
    const Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone.trim() : false;
    const Password = typeof Data.Payload.Password === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password.trim() : false;

    if (Phone && Password)
    {
        Database.Read('Accounts', Phone, (Error, AccountData) =>
        {
            if (!Error && AccountData)
            {
                let HashedPassword = Helper.Hash(Password);

                if (HashedPassword === AccountData.HashedPassword)
                {
                    let TokenObject = { Phone, Token: Helper.RandomString(15), Expire: Date.now() + 1000 * 60 * 60 };

                    // Store the token
                    Database.Create('Tokens', TokenObject.Token, TokenObject, Error =>
                    {
                        if (!Error)
                            Callback(200, TokenObject);
                        else
                            Callback(500, { 'Error': 'Could not create the new token' }); // 500 Internal Server Error
                    });
                }
                else
                    Callback(400, { 'Error': 'The information entered is not correct' }); // 400 Bad Request
            }
            else
                Callback(400, { 'Error': 'The information entered is not correct' }); // 404 Page Not Found
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: GET
 * Required Data: Token
 * Optional data: None
 */
Handler._Token.GET = (Data, Callback) =>
{
    // Required data
    let Token = typeof Data.QueryString.Token === 'string' && Data.QueryString.Token.trim().length === 15 ? Data.QueryString.Token.trim() : false;

    if (Token)
    {
        Database.Read('Tokens', Token, (Error, TokenData) =>
        {
            if (!Error && TokenData)
                Callback(200, TokenData);
            else
                Callback(400, { 'Error': 'Token Not Found' }); // 400 Bad Request
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: PUT
 * Required Data: Token, Extend
 * Optional data: None
 */
Handler._Token.PUT = (Data, Callback) =>
{
    // Required data
    const Token = typeof Data.Payload.Token === 'string' && Data.Payload.Token.trim().length === 15 ? Data.Payload.Token.trim() : false;
    const Extend = !!(typeof Data.Payload.Extend === 'boolean' && Data.Payload.Extend === true);

    if (Token && Extend)
    {
        Database.Read('Tokens', Token, (Error, TokenData) =>
        {
            if (!Error && TokenData)
            {
                if (TokenData.Expire > Date.now())
                {
                    TokenData.Expire = Date.now() * 1000 * 60 * 60;

                    // Store the new updates
                    Database.Update('Tokens', Token, Error =>
                    {
                        if (!Error)
                            Callback(200, { 'Successfully': `Token Updated` }); // 200 OK
                        else
                            Callback(500, { 'Error': 'Could not update the token' }); // 500 Internal Server Error
                    });
                }
                else
                    Callback(400, { 'Error': 'The token has already expired' }); // 400 Bad Request
            }
            else
                Callback(400, { 'Error': 'Token Not Found' }); // 400 Bad Request
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: DELETE
 * Required Data: Token
 * Optional data: None
 */
Handler._Token.DELETE = (Data, Callback) =>
{
    // Required data
    const Token = typeof Data.QueryString.Token === 'string' && Data.QueryString.Token.trim().length === 15 ? Data.QueryString.Token.trim() : false;

    if (Token)
    {
        Database.Read('Tokens', Token, (Error, TokenData) =>
        {
            if (!Error && TokenData)
            {
                Database.Delete('Tokens', Token, Error =>
                {
                    if (!Error)
                        Callback(200, { 'Successfully': 'Token deleted successfully' });
                    else
                        Callback(500, { 'Error': 'Could not delete the account' }); // 500 Internal Server Error
                });
            }
            else
                Callback(400, { 'Error': 'Token Not Found' }); // 400 Bad Request
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

// Verify if a given token id is currently valid for a given account
Handler._Token.Verify = (Token, Phone, Callback) =>
{
    Database.Read('Tokens', Token, (Error, TokenData) =>
    {
        if (!Error && TokenData)
        {
            if (TokenData.Phone === Phone && TokenData.Expire > Date.now())
                Callback(true);
            else
                Callback(false);
        }
        else
            Callback(false);
    });
};

/*
 * Method: POST
 * Required Data: Protocol, URL, Methods, SuccessCodes, TimeoutSeconds
 * Optional data: None
 */
Handler._Check.POST = (Data, Callback) =>
{
    // Required data
    const Protocol = typeof Data.Payload.Protocol === 'string' ? Data.Payload.Protocol : false;
    const URL = typeof Data.Payload.URL === 'string' && Data.Payload.URL.trim().length > 0 ? Data.Payload.URL.trim() : false;
    const Methods = typeof Data.Payload.Methods === 'string' && Method.indexOf(Data.Payload.Methods) > -1 ? Data.Payload.Methods : false;
    const SuccessCodes = typeof Data.Payload.SuccessCodes === 'object' && Data.Payload.SuccessCodes instanceof Array && Data.Payload.SuccessCodes.length > 0 ? Data.Payload.SuccessCodes : false;
    const TimeoutSeconds = typeof Data.Payload.TimeoutSeconds === 'number' && Data.Payload.TimeoutSeconds % 1 === 0 && Data.Payload.TimeoutSeconds >= 1 && Data.Payload.TimeoutSeconds <= 5 ? Data.Payload.TimeoutSeconds : false;

    console.log(Protocol, URL, Methods, SuccessCodes, TimeoutSeconds);

    if (Protocol && URL && Methods && SuccessCodes && TimeoutSeconds)
    {
        // Get the token from headers
        const Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

        Database.Read('Tokens', Token, (Error, TokenData) =>
        {
            if (!Error && TokenData)
            {
                const Phone = TokenData.Phone;

                Database.Read('Accounts', Phone, (Error, AccountData) =>
                {
                    if (!Error && AccountData)
                    {
                        const AccountCheck = typeof AccountData.Check === 'object' && AccountData.Check instanceof Array ? AccountData.Check : [ ];

                        // Verify account
                        if (AccountCheck.length < Config.MaxChecks)
                        {
                            let CheckObject = { ID: Helper.RandomString(15), Phone, Protocol, URL, Methods, SuccessCodes, TimeoutSeconds };

                            // Save the object
                            Database.Create('Checks', CheckObject.ID, CheckObject, Error =>
                            {
                                if (!Error)
                                {
                                    // Add the check id to the account object
                                    AccountData.Check = AccountCheck;
                                    AccountData.Check.push(CheckObject.ID);

                                    // Save the new account data
                                    Database.Update('Accounts', Phone, AccountData, Error =>
                                    {
                                        if (!Error)
                                            Callback(200, CheckObject);
                                        else
                                            Callback(500, { 'Error': 'Could not update the account with the new check' }); // 500 Internal Server Error
                                    });
                                }
                                else
                                    Callback(500, { 'Error': 'Could not create the new check' }); // 500 Internal Server Error
                            });
                        }
                        else
                            Callback(400, { 'Error': `The account already has the maximum number of checks (${Config.MaxChecks})` }); // 400 Bad Request
                    }
                    else
                        Callback(400, { 'Error': 'Account Not Found' }); // 400 Bad Request
                });
            }
            else
                Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
        });
    }
    else
        Callback(400, { 'Error': 'Missing required inputs' }); // 400 Bad Request
};

/*
 * Method: GET
 * Required Data: CheckID
 * Optional data: None
 */
Handler._Check.GET = (Data, Callback) =>
{
    // Required data
    const CheckID = typeof Data.QueryString.ID === 'string' && Data.QueryString.ID.trim().length === 15 ? Data.QueryString.ID.trim() : false;

    if (CheckID)
    {
        Database.Read('Checks', CheckID, (Error, CheckData) =>
        {
            if (!Error && CheckData)
            {
                // Get the token from headers
                const Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

                // Verify that the given token is valid and belongs to the user who created the check
                Handler._Token.Verify(Token, CheckData.Phone, TokenIsValid =>
                {
                    if (TokenIsValid)
                        Callback(200, CheckData);
                    else
                        Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
                });
            }
            else
                Callback(400, { 'Error': 'Check id Not Found' }); // 400 Bad Request
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: PUT
 * Required Data: CheckID
 * Optional data: Protocol, URL, Methods, SuccessCodes, TimeoutSeconds
 */
Handler._Check.PUT = (Data, Callback) =>
{
    // Required data
    const CheckID = typeof Data.Payload.ID === 'string' && Data.Payload.ID.trim().length === 15 ? Data.Payload.ID.trim() : false;

    // Check the optional fields
    const Protocol = typeof Data.Payload.Protocol === 'string' ? Data.Payload.Protocol : false;
    const URL = typeof Data.Payload.URL === 'string' && Data.Payload.URL.trim().length > 0 ? Data.Payload.URL.trim() : false;
    const Methods = typeof Data.Payload.Methods === 'string' && Method.indexOf(Data.Payload.Methods) > -1 ? Data.Payload.Methods : false;
    const SuccessCodes = typeof Data.Payload.SuccessCodes === 'object' && Data.Payload.SuccessCodes instanceof Array && Data.Payload.SuccessCodes.length > 0 ? Data.Payload.SuccessCodes : false;
    const TimeoutSeconds = typeof Data.Payload.TimeoutSeconds === 'number' && Data.Payload.TimeoutSeconds % 1 === 0 && Data.Payload.TimeoutSeconds >= 1 && Data.Payload.TimeoutSeconds <= 5 ? Data.Payload.TimeoutSeconds : false;

    if (CheckID)
    {
        if (Protocol || URL || Methods || SuccessCodes || TimeoutSeconds)
        {
            Database.Read('Checks', CheckID, (Error, CheckData) =>
            {
                if (!Error && CheckData)
                {
                    // Get the token from headers
                    const Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

                    // Verify that the given token is valid and belongs to the user who created the check
                    Handler._Token.Verify(Token, CheckData.Phone, TokenIsValid =>
                    {
                        if (TokenIsValid)
                        {
                            if (Protocol)
                                CheckData.Protocol = Protocol;

                            if (URL)
                                CheckData.URL = URL;

                            if (Methods)
                                CheckData.Methods = Methods;

                            if (SuccessCodes)
                                CheckData.SuccessCodes = SuccessCodes;

                            if (TimeoutSeconds)
                                CheckData.TimeoutSeconds = TimeoutSeconds;

                            // Store the new updates
                            Database.Update('Checks', CheckID, CheckData, Error =>
                            {
                                if (!Error)
                                    Callback(200, { 'Successfully': `Check Updated` }); // 200 OK
                                else
                                    Callback(500, { 'Error': 'Could not update the check' }); // 500 Internal Server Error
                            });
                        }
                        else
                            Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
                    });
                }
                else
                    Callback(400, { 'Error': 'Check id does not exist' }); // 400 Bad Request
            });
        }
        else
            Callback(400, { 'Error': 'Missing fields to update' }); // 400 Bad Request
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: DELETE
 * Required Data: CheckID
 * Optional data: None
 */
Handler._Check.DELETE = (Data, Callback) =>
{
    // Required data
    let CheckID = typeof Data.QueryString.ID === 'string' && Data.QueryString.ID.trim().length === 15 ? Data.QueryString.ID.trim() : false;

    if (CheckID)
    {
        Database.Read('Checks', CheckID, (Error, CheckData) =>
        {
            if (!Error && CheckData)
            {
                // Get the token from headers
                let Token = typeof Data.Headers.token === 'string' ? Data.Headers.token : false;

                // Verify that the given token is valid for the phone number
                Handler._Token.Verify(Token, CheckData.Phone, TokenIsValid =>
                {
                    if (TokenIsValid)
                    {
                        // Delete Check Data
                        Database.Delete('Checks', CheckID, Error =>
                        {
                            if (!Error)
                            {
                                Database.Read('Accounts', CheckData.Phone, (Error, AccountData) =>
                                {
                                    if (!Error && AccountData)
                                    {
                                        const AccountCheck = typeof AccountData.Check === 'object' && AccountData.Check instanceof Array ? AccountData.Check : [ ];
                                        let CheckPosition = AccountCheck.indexOf(CheckID);

                                        if (CheckPosition > -1)
                                        {
                                            AccountCheck.splice(CheckPosition, 1);

                                            // Resave the account data
                                            Database.Update('Accounts', CheckData.Phone, AccountData, Error =>
                                            {
                                                if (!Error)
                                                    Callback(200, { 'Successfully': `Check deleted from account ${CheckData.Phone}` }); // 200 OK
                                                else
                                                    Callback(500, { 'Error': 'Could not update the account' }); // 500 Internal Server Error
                                            });
                                        }
                                        else
                                            Callback(500, { 'Error': 'Could not find the check on the account object' }); // 500 Internal Server Error
                                    }
                                    else
                                        Callback(500, { 'Error': 'Could not find the account who created the check' }); // 500 Internal Server Error
                                });
                            }
                            else
                                Callback(500, { 'Error': 'Could not delete the check data' }); // 500 Internal Server Error
                        });
                    }
                    else
                        Callback(403, { 'Error': 'Missing required token in header, or token is invalid' }); // 403 Forbidden
                });
            }
            else
                Callback(400, { 'Error': 'The specified check id does not exist' }); // 400 Bad Request
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

// Not found handlers
Handler.NotFound = (Data, Callback) =>
{
    Callback(404, { '404': 'Page Not Found' });
};

module.exports = Handler;
