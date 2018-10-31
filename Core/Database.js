// Node Native
const FileSystem = require('fs');
const Path = require('path');

// Core
const Helper = require('./Helper');

let Database = { };

Database.BaseDirectory = Path.join(__dirname, '/../.Database');

Database.Create = (Directory, FileName, Data, Callback) =>
{
    // Open the file for writing
    FileSystem.open(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, 'wx', (Error, FileDescriptor) =>
    {
        if (!Error && FileDescriptor)
        {
            let StringData = JSON.stringify(Data);

            // Write file and close it
            FileSystem.write(FileDescriptor, StringData, Error =>
            {
                if (!Error)
                {
                    FileSystem.close(FileDescriptor, Error =>
                    {
                        if (!Error)
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
    FileSystem.open(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, 'r+', (Error, FileDescriptor) =>
    {
        if (!Error && FileDescriptor)
        {
            let StringData = JSON.stringify(Data);

            FileSystem.ftruncate(FileDescriptor, Error =>
            {
                if (!Error)
                {
                    // Write file and close it
                    FileSystem.write(FileDescriptor, StringData, Error =>
                    {
                        if (!Error)
                        {
                            FileSystem.close(FileDescriptor, Error =>
                            {
                                if (!Error)
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

Database.Delete = (Directory, FileName, Callback) =>
{
    FileSystem.unlink(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, Error =>
    {
        if (!Error)
            Callback(false);
        else
            Callback('File not found');
    });
};

Database.Read = (Directory, FileName, Callback) =>
{
    FileSystem.readFile(`${Database.BaseDirectory}/${Directory}/${FileName}.json`, 'utf8', (Error, Data) =>
    {
        if (!Error && Data)
            Callback(false, Helper.ParseJsonToObject(Data));
        else
            Callback(Error, Data);
    });
};

module.exports = Database;
