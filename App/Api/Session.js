// Core
const Helper = require('./../Core/Helper');

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
 *
 * @description Result: 1 >> The information entered is not correct (Phone, Password)
 *              Result: 2 >> Session was successfully created
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

Session.POST = (Data, Callback) =>
{
    let phone = Data.Payload.phone;
    let password = Data.Payload.password;

    DB.collection('accounts').find({ phone, password: Helper.Hash(password) }).limit(1).project({ _id: 1 }).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof result[0] === 'undefined')
            return Callback(400, { Result: 1 });

        let SessionObject = { sessionID: Helper.RandomString(50), phone, expire: Date.now() + 1000 * 60 * 60 * 24 };

        DB.collection('sessions').insertOne({ ...SessionObject }, error1 =>
        {
            if (error1)
                return Callback(500);

            return Callback(200, { Result: 2 });
        });
    });
};

/**
 *
 * @description Get session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} phone
 *
 * @description Result: 1 >> Session not found
 *
 *              StatusCode = 200 OK, 400 Bad Request, 404 Page not found
 *
 */

Session.GET = (Data, Callback) =>
{
    const sessionID = Data.QueryString.sessionID;

    DB.collection('sessions').find({ sessionID }).limit(1).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof sessionID === 'undefined' || sessionID.trim().length !== 50)
            return Callback(400, { Result: 1 });

        return Callback(200, result[0]);
    });
};

/**
 *
 * @description Update Session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} sessionID
 * @var {string} extend
 *
 * @description Result: 1 >> Session not found
 *              Result: 2 >> Missing required fields
 *              Result: 2 >> The session has already expired
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

Session.PUT = (Data, Callback) =>
{
    const sessionID = Data.Payload.sessionID;
    const extend = Data.Payload.extend;

    DB.collection('sessions').find({ sessionID }).limit(1).project({ _id: 1 }).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof sessionID === 'undefined' || sessionID.trim().length !== 50)
            return Callback(404, { Result: 1 });

        if (typeof extend === 'undefined' || typeof extend !== 'boolean' || extend === false)
            return Callback(400, { Result: 2 });

        if (result[0].expire < Date.now())
            return Callback(400, { Result: 3 });

        DB.collection('sessions').updateOne({ sessionID }, { $set: { expire: Date.now() + 1000 * 60 * 60 * 24 * 6 } }, error1 =>
        {
            if (error1)
                return Callback(500);

            return Callback(200);
        });
    });
};

/**
 *
 * @description Delete session
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} sessionID
 *
 * @description Result: 1 >> Session not found
 *
 *              StatusCode = 200 OK, 400 Bad Request, 404 Page not found, 500 Internal Server Error
 *
 */

Session.DELETE = (Data, Callback) =>
{
    const sessionID = Data.QueryString.sessionID;

    DB.collection('sessions').find({ sessionID }).limit(1).project({ _id: 1 }).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof sessionID === 'undefined' || sessionID.trim().length !== 50)
            return Callback(404, { Result: 1 });

        DB.collection('sessions').deleteOne({ sessionID }, error1 =>
        {
            if (error1)
                return Callback(500);

            return Callback(200);
        });
    });
};

module.exports = Session;
