// Api
const Account = require('./Account');
const Session = require('./Session');

// Api || Router not found
const NotFound = (Data, Callback) =>
{
    Callback(404);
};

// Define a request router
const Router = { Account: Account.Main, Session: Session.Main, NotFound };

module.exports = Router;
