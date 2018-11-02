let Environments = { };

Environments.Staging =
{
    Port: 3000,
    Name: 'Staging',
    Hash: 'Secret',
    MaxChecks: 5
};

Environments.Production =
{
    Port: 4000,
    Name: 'Production',
    Hash: 'Secret',
    MaxChecks: 5
};

// Detewemine which enviroment was passed as a command-line argument
let CurrentEnvironment = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : '';

// Check that the current environment is one of the environments above, if not, default to Staging
let EnvironmentToExport = typeof Environments[CurrentEnvironment] === 'object' ? Environments[CurrentEnvironment] : Environments.Staging;

module.exports = EnvironmentToExport;
