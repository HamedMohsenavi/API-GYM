// Node Native
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const { StringDecoder } = require('string_decoder');
const Decoder = new StringDecoder('utf8');

// Api router
const Router = require('./App/Api/Router');

// Core
const Config = require('./App/Core/Config');
const Helper = require('./App/Core/Helper');

// HTTPS Server Options
const Options =
{
    Key: fs.readFileSync('./Storage/HTTPS/Key.pem'),
    Cert: fs.readFileSync('./Storage/HTTPS/Cert.pem')
};

// Create servers
const HTTP = http.createServer((Request, Response) => __Server(Request, Response));
const HTTPS = https.createServer(Options, (Request, Response) => __Server(Request, Response));

// Start the servers
HTTP.listen(Config.Port.HTTP, () => console.log('\x1b[36m%s\x1b[0m', `Server Running on Port: ${Config.Port.HTTP} -- Protocol: HTTP -- Mode: ${Config.Mode} `));
HTTPS.listen(Config.Port.HTTPS, () => console.log('\x1b[33m%s\x1b[0m', `Server Running on Port: ${Config.Port.HTTPS} -- Protocol: HTTPS -- Mode: ${Config.Mode} `));

// All the server logic for both the HTTP and HTTPS server
let __Server = (Request, Response) =>
{
    // Get the URL and parse it
    let ParsedUrl = url.parse(Request.url, true);

    // Get the pathname from url (localhost:3000/foo/ -> foo)
    let PathName = ParsedUrl.pathname.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    let QueryString = ParsedUrl.query;

    // Get the HTTP method
    let Method = Request.method.toUpperCase();

    // Get the headers as an object
    let Headers = Request.headers;

    // Get the payload, if any
    let __Buffer = '';

    Request.on('data', Data =>
    {
        __Buffer += Decoder.write(Data);
    });

    Request.on('end', () =>
    {
        __Buffer += Decoder.end();

        // Choose the api this request should go to, If one is not found, use the not found
        let ChosenApi = typeof Router[PathName] !== 'undefined' ? Router[PathName] : Router.NotFound;

        // Construct the data object to send to the api
        let Data = { ParsedUrl, PathName, QueryString, Method, Headers, Payload: Helper.ParseJsonToObject(__Buffer) };

        // Route the request to the api specified in the router
        ChosenApi(Data, (StatusCode, Payload) =>
        {
            // Use the status code called back by the api, or default to 200
            StatusCode = typeof StatusCode === 'number' ? StatusCode : 200;

            // Use the payload called back by the api, or default to an empty object
            Payload = typeof Payload === 'object' ? Payload : { };

            // Convert the payload to a string
            let PayloadString = JSON.stringify(Payload);

            // Return the response
            Response.setHeader('Content-Type', 'application/json');
            Response.writeHead(StatusCode);
            Response.end(PayloadString);

            // Log the response
            console.log(StatusCode, Payload, PayloadString);
        });
    });
};
