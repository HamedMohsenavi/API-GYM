// Core
const Database = require('./Database');
const Helper = require('./Helper');

// Define all the handlers
let Handler = { };

// Account Handler
Handler.Account = (Data, Callback) =>
{
    let Method = ['POST', 'GET', 'PUT', 'DELETE'];

    if (Method.indexOf(Data.Method) > -1)
        Handler._Account[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

Handler._Account = { };

/*
 * Method: POST
 * Required Data: FirstName, LastName, Phone, Password, TosAgreement
 * Optional data: None
 */
Handler._Account.POST = (Data, Callback) =>
{
    // Check the all Required fields are filled out
    let FirstName = typeof (Data.Payload.FirstName) === 'string' && Data.Payload.FirstName.trim().length > 0 ? Data.Payload.FirstName.trim() : false;
    let LastName = typeof (Data.Payload.LastName) === 'string' && Data.Payload.LastName.trim().length > 0 ? Data.Payload.LastName.trim() : false;
    let Phone = typeof (Data.Payload.Phone) === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone.trim() : false;
    let Password = typeof (Data.Payload.Password) === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password.trim() : false;
    let TosAgreement = !!(typeof (Data.Payload.TosAgreement) === 'boolean' && Data.Payload.TosAgreement === true);

    if (FirstName && LastName && Phone && Password && TosAgreement)
    {
        // Make sure that the user dosent already exist
        Database.Read('Accounts', Phone, (Error, Data) =>
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
 * @TODO: Only let an authenticated account access their object.
 */
Handler._Account.GET = (Data, Callback) =>
{
    // Required data
    let Phone = typeof Data.QueryString.Phone === 'string' && Data.QueryString.Phone.trim().length === 11 ? Data.QueryString.Phone.trim() : false;

    if (Phone)
    {
        Database.Read('Accounts', Phone, (Error, Data) =>
        {
            if (!Error && Data)
            {
                delete Data.HashedPassword;

                Callback(200, Data);
            }
            else
                Callback(404, { 'Error': 'Account Not Found' }); // 404 Page Not Found
        });
    }
    else
        Callback(400, { 'Error': 'Missing required fields' }); // 400 Bad Request
};

/*
 * Method: PUT
 * Required Data: Phone
 * Optional data: FirstName, LastName, Password (at least one must be specified)
 * @TODO: Only let an authenticated account update their own object.
 */
Handler._Account.PUT = (Data, Callback) =>
{
    // Required data
    let Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone.trim() : false;

    // Check the optional fields
    let FirstName = typeof (Data.Payload.FirstName) === 'string' && Data.Payload.FirstName.trim().length > 0 ? Data.Payload.FirstName.trim() : false;
    let LastName = typeof (Data.Payload.LastName) === 'string' && Data.Payload.LastName.trim().length > 0 ? Data.Payload.LastName.trim() : false;
    let Password = typeof (Data.Payload.Password) === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password.trim() : false;

    if (Phone)
    {
        if (FirstName || LastName || Password)
        {
            Database.Read('Accounts', Phone, (Error, Data) =>
            {
                if (!Error && Data)
                {
                    if (FirstName)
                        Data.FirstName = FirstName;

                    if (LastName)
                        Data.LastName = LastName;

                    if (Password)
                        Data.HashedPassword = Helper.Hash(Password);

                    // Store the new update
                    Database.Update('Accounts', Phone, Data, Error =>
                    {
                        if (!Error)
                            Callback(200, { 'Successfully': `Account Updated` }); // 200 OK
                        else
                            Callback(500, { 'Error': 'Could not update the account' }); // 500 Internal Server Error
                    });
                }
                else
                    Callback(404, { 'Error': 'Account Not Found' }); // 404 Page Not Found
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
 * @TODO: Only let an authenticated account update their own object.
 * @TODO: Cleanup any other data files associated with this account
 */
Handler._Account.DELETE = (Data, Callback) =>
{
    // Required data
    let Phone = typeof Data.QueryString.Phone === 'string' && Data.QueryString.Phone.trim().length === 11 ? Data.QueryString.Phone.trim() : false;

    if (Phone)
    {
        Database.Read('Accounts', Phone, (Error, Data) =>
        {
            if (!Error && Data)
            {
                Database.Delete('Accounts', Phone, Error =>
                {
                    if (!Error)
                        Callback(200, { 'Successfully': 'account deleted successfully' });
                    else
                        Callback(500, { 'Error': 'Could not delete the account' }); // 500 Internal Server Error
                });
            }
            else
                Callback(404, { 'Error': 'Account Not Found' }); // 404 Page Not Found
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
