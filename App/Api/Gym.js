// Container for the gym submethods
const Gym = { };

Gym.Main = (Data, Callback) =>
{
    // Request methods
    const Methods = ['POST'];

    if (Methods.indexOf(Data.Method) > -1)
        Gym[Data.Method](Data, Callback);
    else
        Callback(405); // 405 Method Not Allowed
};

/**
 *
 * @description Create Gym
 *
 * @param {object} Data
 * @param {Number} Callback.StatusCode
 * @param {object} Callback.Payload
 *
 * @var {string} name
 *
 * @description Result: 1 >> A gym with that name already exists
 *              Result: 1 >> name (undefined)
 *              Result: 2 >> Could not create the new gym
 *              Result: 3 >> Gym was successfully created
 *
 *              StatusCode = 200 OK, 400 Bad Request, 500 Internal Server Error
 *
 */

Gym.POST = (Data, Callback) =>
{
    let name = Data.Payload.name;

    DB.collection('gym').find({ name }).limit(1).project({ _id: 1 }).toArray((error, result) =>
    {
        if (error)
            return Callback(500);

        if (result[0])
            return Callback(400, { Result: 1 });

        if (typeof name === 'undefined' || name.trim().length < 2)
            return Callback(400, { Result: 2 });

        DB.collection('gym').insertOne({ name }, error1 =>
        {
            if (error1)
                return Callback(500, { Result: 3 });

            return Callback(200, { Result: 4 });
        });
    });
};

module.exports = Gym;
