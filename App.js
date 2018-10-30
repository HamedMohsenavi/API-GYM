// Node Native
const HTTP = require('http');
const URL = require('url');
const { StringDecoder } = require('string_decoder');
const Decoder = new StringDecoder('utf8');

// Define all the handlers
let Handler = { };

// Handlers
Handler.Api = (Data, Callback) =>
{
    Callback(406, { 'Api': 'Gym' });
};

// Not found handlers
Handler.NotFound = (Data, Callback) =>
{
    Callback(404, { '404': 'Page Not Found' });
};

// Define the request router
let Router =
{
    Api: Handler.Api
};

HTTP.createServer((Request, Response) =>
{
    // parsed url
    let ParsedUrl = URL.parse(Request.url, true);

    // Get the path
    let PathName = ParsedUrl.pathname;
    let TrimeedPath = PathName.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object (curl http://localhost:3000?Api=Gym)
    let QueryString = ParsedUrl.query;

    // Get the HTTP method
    let Method = Request.method.toUpperCase();

    // Get the headers as an object
    let Headers = Request.headers;

    // Get the payload
    let __Buffer = '';

    Request.on('data', Data =>
    {
        __Buffer += Decoder.write(Data);
    });

    Request.on('end', () =>
    {
        __Buffer += Decoder.end();

        // Check the router for a matching path
        let Routers = typeof (Router[TrimeedPath]) !== 'undefined' ? Router[TrimeedPath] : Handler.NotFound;

        // Construct the data object to send the handler
        let Data = { TrimeedPath, QueryString, Method, Headers, __Buffer };

        // Route the request to the handler specified in the router
        Routers(Data, (StatusCode, Payload) =>
        {
            // Use the status code returned from the handler
            StatusCode = typeof StatusCode === 'number' ? StatusCode : 200;

            // Use the payload returned from the handler
            Payload = typeof Payload === 'object' ? Payload : '';

            // Convert the payload to a string
            let PayloadString = JSON.stringify(Payload);

            // Return the response
            Response.writeHead(StatusCode, { 'Content-Type': 'application/json' });
            Response.end(PayloadString);

            console.log(StatusCode, PayloadString);
        });
    });
}).listen(3000, () => console.log('Server Running on Port: 3000'));
