const Config = { };

Config.Staging =
{
    Port: { HTTP: 3000, HTTPS: 3001 },
    Mode: 'Staging',
    Hash: 'Secret'
};

Config.Production =
{
    Port: { HTTP: 5000, HTTPS: 5001 },
    Mode: 'Production',
    Hash: 'Secret'
};

// Determine which environment was passed as a command-line argument
const CurrentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : '';

// Check that the current environment is one of the environments above, if not, default to staging
let Environment = typeof Config[CurrentEnvironment] === 'object' ? Config[CurrentEnvironment] : Config.Staging;

module.exports = Environment;
