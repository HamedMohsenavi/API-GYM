// Node Native
const path = require('path');
const fs = require('fs');

// Core
const Helper = require('./Helper');

// Container for all the database
const Database = { };

Database.BaseDirectory = path.join(__dirname, './../../Storage/.Database');

Database.Create = (Directory, FileName, Data, Callback) =>
{
    // Open the file for writing
    fs.open(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, 'wx', (OError, FileDescriptor) =>
    {
        if (!OError && FileDescriptor)
        {
            // Write file and close it
            fs.write(FileDescriptor, JSON.stringify(Data), WError =>
            {
                if (!WError)
                {
                    fs.close(FileDescriptor, CError =>
                    {
                        if (!CError)
                            Callback(false);
                        else
                            Callback('Error closing new file');
                    });
                }
                else
                    Callback('Error writing to new file');
            });
        }
        else
            Callback('Could not create new file');
    });
};

Database.Update = (Directory, FileName, Data, Callback) =>
{
    // Open the file for writing
    fs.open(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, 'r+', (OError, FileDescriptor) =>
    {
        if (!OError && FileDescriptor)
        {
            fs.ftruncate(FileDescriptor, TError =>
            {
                if (!TError)
                {
                    // Write file and close it
                    fs.write(FileDescriptor, JSON.stringify(Data), WError =>
                    {
                        if (!WError)
                        {
                            fs.close(FileDescriptor, CError =>
                            {
                                if (!CError)
                                    Callback(false);
                                else
                                    Callback('Error closing existing file');
                            });
                        }
                        else
                            Callback('Error writing to existing file');
                    });
                }
                else
                    Callback('Error truncating file');
            });
        }
        else
            Callback('Could not open file for updating, it may not exist yet');
    });
};

Database.Read = (Directory, FileName, Callback) =>
{
    fs.readFile(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, 'utf8', (RError, Data) =>
    {
        if (!RError && Data)
            Callback(false, Helper.ParseJsonToObject(Data));
        else
            Callback(RError, Data);
    });
};

Database.Delete = (Directory, FileName, Callback) =>
{
    fs.unlink(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, UError =>
    {
        if (!UError)
            Callback(false);
        else
            Callback('File not found');
    });
};

module.exports = Database;
