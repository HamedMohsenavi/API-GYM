// Api
const Account = require('./Account');
const Session = require('./Session');
const CheckSerial = require('./CheckSerial');
const Gym = require('./Gym');

// Api || Router not found
const NotFound = (Data, Callback) =>
{
    Callback(404);
};

// Define a request router
const Router =
{
    Account: Account.Main,
    Session: Session.Main,
    CheckSerial: CheckSerial.Main,
    Gym: Gym.Main,
    NotFound
};

module.exports = Router;
