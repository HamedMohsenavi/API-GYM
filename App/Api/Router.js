// Api
const Account = require('./Account');
const Session = require('./Session');
const Check = require('./Check');

// Api || Router not found
const NotFound = (Data, Callback) =>
{
    Callback(404);
};

// Define a request router
const Router = { Account: Account.Main, Session: Session.Main, Check: Check.Main, NotFound };

module.exports = Router;
