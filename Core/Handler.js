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

// Not found handlers
Handler.NotFound = (Data, Callback) =>
{
    Callback(404, { '404': 'Page Not Found' });
};

module.exports = Handler;
