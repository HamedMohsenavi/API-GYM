// Core
const Database = require('./../Core/Database');
const Helper = require('./../Core/Helper');

// Api
const Session = require('./Session');

// Container for the account submethods
const _Account = { };

const Account = (Data, Callback) =>
{
    // Request methods
    const Methods = ['POST', 'GET', 'PUT', 'DELETE'];

    if (Methods.indexOf(Data.Method) > -1)
        _Account[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

/**
 *
 * @description Create Account
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Name
 * @var {string} Family
 * @var {string} FatherName
 * @var {string} Phone
 * @var {string} Password
 * @var {string} NationalCode
 * @var {Number} Gender -- 1 Male 2 Female
 * @var {string} Address
 *
 * @description Result: 1 >> Account was successfully created
 *              Result: 2 >> Could not create the new account
 *              Result: 3 >> Could not hash the account password
 *              Result: 4 >> A account with that phone number already exists
 *              Result: 5 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

_Account.POST = (Data, Callback) =>
{
    // Check that all required fields are filled out
    const Name = typeof Data.Payload.Name === 'string' && Data.Payload.Name.trim().length > 0 ? Data.Payload.Name : false;
    const Family = typeof Data.Payload.Family === 'string' && Data.Payload.Family.trim().length > 0 ? Data.Payload.Family : false;
    const FatherName = typeof Data.Payload.FatherName === 'string' && Data.Payload.FatherName.trim().length > 0 ? Data.Payload.FatherName : false;
    const Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone : false;
    const Password = typeof Data.Payload.Password === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password : false;
    const NationalCode = typeof Data.Payload.NationalCode === 'string' && Data.Payload.NationalCode.trim().length === 10 ? Data.Payload.NationalCode : false;
    const Gender = typeof Data.Payload.Gender === 'number' && (Data.Payload.Gender === 1 || Data.Payload.Gender === 2) ? Data.Payload.Gender : false;
    const Address = typeof Data.Payload.Address === 'string' && Data.Payload.Address.trim().length > 0 ? Data.Payload.Address : false;

    if (Name && Family && FatherName && Phone && Password && NationalCode && Gender && Address)
    {
        // Make sure that the account dosent already exist
        Database.Read('Accounts', Phone, RError =>
        {
            if (RError)
            {
                let SHAPassword = Helper.Hash(Password);

                if (SHAPassword)
                {
                    let AccountObject = { Name, Family, FatherName, Phone, SHAPassword, NationalCode, Gender, Address, Active: false, CreatedAt: Date.now(), UpdatedAt: Date.now() };

                    // Store the account
                    Database.Create('Accounts', Phone, AccountObject, CError =>
                    {
                        if (!CError)
                            Callback(200, { Result: 1 });
                        else
                            Callback(500, { Result: 2 });
                    });
                }
                else
                    Callback(500, { Result: 3 });
            }
            else
                Callback(400, { Result: 4 });
        });
    }
    else
        Callback(400, { Result: 5 });
};

/**
 *
 * @description Account information
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Phone
 *
 * @description Result: 1 >> Account not found
 *              Result: 2 >> Missing required session in header, or session is invalid
 *              Result: 3 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 404 Bad Request
 *
 */

_Account.GET = (Data, Callback) =>
{
    // Check for required field
    const Phone = typeof Data.QueryString.Phone === 'string' && Data.QueryString.Phone.trim().length === 11 ? Data.QueryString.Phone : false;

    if (Phone)
    {
        // Get the session from the header
        const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

        // Verify that the given token is valid for the phone number
        Session.Verify(SessionID, Phone, SessionIsValid =>
        {
            if (SessionIsValid)
            {
                Database.Read('Accounts', Phone, (RError, AccountData) =>
                {
                    if (!RError && AccountData)
                    {
                        delete AccountData.SHAPassword;
                        Callback(200, AccountData);
                    }
                    else
                        Callback(404, { Result: 1 });
                });
            }
            else
                Callback(403, { Result: 2 });
        });
    }
    else
        Callback(400, { Result: 3 });
};

/**
 *
 * @description Update Account
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Name
 * @var {string} Family
 * @var {string} FatherName
 * @var {string} Phone
 * @var {string} Password
 * @var {string} NationalCode
 * @var {Number} Gender -- 1 Male 2 Female
 * @var {string} Address
 *
 * @description Result: 1 >> Account was successfully updated
 *              Result: 2 >> Could not update the account
 *              Result: 3 >> The specified account does not exist
 *              Result: 4 >> Missing required session in header, or session is invalid
 *              Result: 5 >> Missing fields to update
 *              Result: 6 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 500 Internal Server Error
 *
 */

_Account.PUT = (Data, Callback) =>
{
    // Check for required field
    const Phone = typeof Data.Payload.Phone === 'string' && Data.Payload.Phone.trim().length === 11 ? Data.Payload.Phone : false;

    // Check for optional fields
    const Name = typeof Data.Payload.Name === 'string' && Data.Payload.Name.trim().length > 0 ? Data.Payload.Name : false;
    const Family = typeof Data.Payload.Family === 'string' && Data.Payload.Family.trim().length > 0 ? Data.Payload.Family : false;
    const FatherName = typeof Data.Payload.FatherName === 'string' && Data.Payload.FatherName.trim().length > 0 ? Data.Payload.FatherName : false;
    const Password = typeof Data.Payload.Password === 'string' && Data.Payload.Password.trim().length > 8 ? Data.Payload.Password : false;
    const NationalCode = typeof Data.Payload.NationalCode === 'string' && Data.Payload.NationalCode.trim().length === 10 ? Data.Payload.NationalCode : false;
    const Gender = typeof Data.Payload.Gender === 'number' && (Data.Payload.Gender === 1 || Data.Payload.Gender === 2) ? Data.Payload.Gender : false;
    const Address = typeof Data.Payload.Address === 'string' && Data.Payload.Address.trim().length > 0 ? Data.Payload.Address : false;

    if (Phone)
    {
        if (Name || Family || FatherName || Password || NationalCode || Gender || Address)
        {
            // Get the session from the header
            const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

            // Verify that the given token is valid for the phone number
            Session.Verify(SessionID, Phone, SessionIsValid =>
            {
                if (SessionIsValid)
                {
                    Database.Read('Accounts', Phone, (RError, AccountData) =>
                    {
                        if (!RError && AccountData)
                        {
                            if (Name)
                                AccountData.Name = Name;
                            if (Family)
                                AccountData.Family = Family;
                            if (FatherName)
                                AccountData.FatherName = FatherName;
                            if (Password)
                                AccountData.SHAPassword = Helper.Hash(Password);
                            if (NationalCode)
                                AccountData.NationalCode = NationalCode;
                            if (Gender)
                                AccountData.Gender = Gender;
                            if (Address)
                                AccountData.Address = Address;
        
                            AccountData.UpdatedAt = Date.now();
        
                            // Store the new updates
                            Database.Update('Accounts', Phone, AccountData, UError =>
                            {
                                if (!UError)
                                    Callback(200, { Result: 1 });
                                else
                                    Callback(500, { Result: 2 });
                            });
                        }
                        else
                            Callback(400, { Result: 3 });
                    });
                }
                else
                    Callback(403, { Result: 4 });
            });
        }
        else
            Callback(400, { Result: 5 });
    }
    else
        Callback(400, { Result: 6 });
};

/**
 *
 * @description Delete Account
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} Phone
 *
 * @description Result: 1 >> Account was successfully deleted
 *              Result: 2 >> Could not delete the account
 *              Result: 3 >> Account not found
 *              Result: 4 >> Missing required session in header, or session is invalid
 *              Result: 5 >> Missing required fields
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 404 Bad Request
 *
 */

_Account.DELETE = (Data, Callback) =>
{
    // Check for required field
    const Phone = typeof Data.QueryString.Phone === 'string' && Data.QueryString.Phone.trim().length === 11 ? Data.QueryString.Phone : false;

    if (Phone)
    {
        // Get the session from the header
        const SessionID = typeof Data.Headers.session === 'string' ? Data.Headers.session : false;

        // Verify that the given token is valid for the phone number
        Session.Verify(SessionID, Phone, SessionIsValid =>
        {
            if (SessionIsValid)
            {
                Database.Read('Accounts', Phone, (RError, AccountData) =>
                {
                    if (!RError && AccountData)
                    {
                        Database.Delete('Accounts', Phone, DError =>
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
                Callback(403, { Result: 4 });
        });
    }
    else
        Callback(400, { Result: 5 });
};

module.exports = Account;
