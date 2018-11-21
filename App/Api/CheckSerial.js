// Container for the account submethods
const CheckSerial = { };

CheckSerial.Main = (Data, Callback) =>
{
    // Request methods
    const Methods = ['POST'];

    if (Methods.indexOf(Data.Method) > -1)
        CheckSerial[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

/**
 *
 * @description CheckSerial Before
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} serial

 *
 * @description Result: 1 >> Serial not found or undefined
 *              Result: 2 >> Your account is not active
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

CheckSerial.POST = (Data, Callback) =>
{
    let serial = Data.Payload.serial;

    DB.collection('accounts').find({ serial }).limit(1).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (typeof result[0] === 'undefined' || result[0].serial !== serial)
            return Callback(400, { Result: 1 });

        if (result[0].active !== true)
            return Callback(400, { Result: 2 });

        return Callback(200, { Result: result[0].image });
    });
};

module.exports = CheckSerial;
