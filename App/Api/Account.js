// Core
const Helper = require('./../Core/Helper');

// Container for the account submethods
const Account = { };

Account.Main = (Data, Callback) =>
{
    // Request methods
    const Methods = ['POST', 'GET', 'PUT', 'DELETE'];

    if (Methods.indexOf(Data.Method) > -1)
        Account[Data.Method](Data, Callback);
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
 * @var {string} name
 * @var {string} family
 * @var {string} fatherName
 * @var {string} phone
 * @var {string} password
 * @var {string} nationalCode
 * @var {Number} gender -- 0 -_- 1 Male 2 Female
 * @var {string} address
 * @var {string} serial
 * @var {string} image
 *
 * @description Result: 1 >> A account with that phone number already exists
 *              Result: 2 >> name (undefined)
 *              Result: 3 >> family (undefined)
 *              Result: 4 >> fatherName (undefined)
 *              Result: 5 >> phone (undefined)
 *              Result: 6 >> password (undefined)
 *              Result: 7 >> nationalCode (undefined)
 *              Result: 8 >> gender (undefined)
 *              Result: 9 >> address (undefined)
 *              Result: 10 >> serial (undefined)
 *              Result: 11 >> Could not create the new account
 *              Result: 12 >> Account was successfully created
 *              Result: 13 >> A account with that nationalCode already exists
 *              Result: 14 >> A account with that serial already exists
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

Account.POST = (Data, Callback) =>
{
    let object =
    {
        name: Data.Payload.name,
        family: Data.Payload.family,
        fatherName: Data.Payload.fatherName,
        phone: Data.Payload.phone,
        password: Data.Payload.password,
        nationalCode: Data.Payload.nationalCode,
        gender: Data.Payload.gender,
        address: Data.Payload.address,
        serial: Data.Payload.serial,
        image: Data.Payload.image,
        active: false
    };

    DB.collection('accounts').find({ }).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        let phone = result.find(res => res.phone === object.phone);

        if (result.indexOf(phone) > -1)
            return Callback(400, { Result: 1 });

        let nationalCode = result.find(res => res.nationalCode === object.nationalCode);

        if (result.indexOf(nationalCode) > -1)
            return Callback(400, { Result: 13 });

        let serial = result.find(res => res.serial === object.serial);

        if (result.indexOf(serial) > -1)
            return Callback(400, { Result: 14 });

        if (typeof object.name === 'undefined' || object.name.trim().length < 2)
            return Callback(400, { Result: 2 });

        if (typeof object.family === 'undefined' || object.family.trim().length < 2)
            return Callback(400, { Result: 3 });

        if (typeof object.fatherName === 'undefined' || object.fatherName.trim().length < 2)
            return Callback(400, { Result: 4 });

        if (typeof object.phone === 'undefined' || object.phone.trim().length !== 13)
            return Callback(400, { Result: 5 });

        if (typeof object.password === 'undefined' || object.password.trim().length < 8)
            return Callback(400, { Result: 6 });

        if (typeof object.nationalCode === 'undefined' || object.nationalCode.trim().length !== 10)
            return Callback(400, { Result: 7 });

        if (typeof object.gender === 'undefined' || typeof object.gender !== 'number' || object.gender >= 3)
            return Callback(400, { Result: 8 });

        if (typeof object.address === 'undefined' || object.address.trim().length < 2)
            return Callback(400, { Result: 9 });

        if (typeof object.serial === 'undefined' || object.serial.trim().length < 2)
            return Callback(400, { Result: 10 });

        // @TODO IMAGE

        DB.collection('accounts').insertOne({ ...object, password: Helper.Hash(object.password) }, error1 =>
        {
            if (error1)
                return Callback(500, { Result: 11 });

            return Callback(200, { Result: 12 });
        });
    });
};

/**
 *
 * @description Account information
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} phone -- query
 * @var {string} session -- Header
 *
 * @description Result: 1 >> session (undefined)
 *              Result: 2 >> session expired
 *              Result: 3 >> phone invalid
 *
 *              StatusCode = 200 OK, 400 Bad Request, 403 Forbidden, 404 Page not found
 *
 */

Account.GET = (Data, Callback) =>
{
    let phone = Data.QueryString.phone;
    let sessionID = Data.Headers.session;

    DB.collection('sessions').find({ sessionID }).limit(1).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof sessionID === 'undefined' || sessionID.trim().length !== 50)
            return Callback(404, { Result: 1 });

        if (result[0].expire < Date.now())
            return Callback(400, { Result: 2 });

        if (result[0].phone !== phone)
            return Callback(400, { Result: 3 });

        DB.collection('accounts').find({ phone }).limit(1).project({ password: 0 }).toArray((error1, result1) =>
        {
            if (error1)
                return Callback(500, error1);

            return Callback(200, result1[0]);
        });
    });
};

/**
 *
 * @description Update Account
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} name
 * @var {string} family
 * @var {string} fatherName
 * @var {string} phone
 * @var {string} password
 * @var {string} nationalCode
 * @var {number} gender -- 0 -_- 1 Male 2 Female
 * @var {string} address
 * @var {string} session -- Header
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

Account.PUT = (Data, Callback) =>
{
    let object =
    {
        name: Data.Payload.name,
        family: Data.Payload.family,
        fatherName: Data.Payload.fatherName,
        phone: Data.Payload.phone,
        password: Data.Payload.password,
        nationalCode: Data.Payload.nationalCode,
        gender: Data.Payload.gender,
        address: Data.Payload.address,
        serial: Data.Payload.serial,
        image: Data.Payload.image
    };
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
 * @var {string} session -- Header
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

Account.DELETE = (Data, Callback) =>
{
    let phone = Data.QueryString.phone;
    let sessionID = Data.Headers.session;

    DB.collection('sessions').find({ sessionID }).limit(1).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof sessionID === 'undefined' || sessionID.trim().length !== 50)
            return Callback(404, { Result: 1 });

        if (result[0].expire < Date.now())
            return Callback(400, { Result: 2 });

        if (result[0].phone !== phone)
            return Callback(400, { Result: 3 });

        DB.collection('accounts').find({ phone }).limit(1).project({ password: 0 }).toArray((error1, result1) =>
        {
            if (error1)
                return Callback(500, error1);

            DB.collection('accounts').deleteOne({ phone }, error2 =>
            {
                if (error2)
                    return Callback(500);

                return Callback(200);
            });
        });
    });
};

module.exports = Account;
