// Node Native
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const Logger = { };

Logger.BaseDirectory = path.join(__dirname, './../../Storage/.Logger');

Logger.Append = (FileName, Data, Callback) =>
{
    fs.open(`${Logger.BaseDirectory}/${FileName}.log`, 'a', (OError, FileDescriptor) =>
    {
        if (!OError && FileDescriptor)
        {
            fs.appendFile(FileDescriptor, `${Data} \n`, AError =>
            {
                if (!AError)
                {
                    fs.close(FileDescriptor, CError =>
                    {
                        if (!CError)
                            Callback(false);
                        else
                            Callback('Error closing file that was being appended');
                    });
                }
                else
                    Callback('Error appending to file');
            });
        }
        else
            Callback('Could not open file for appending');
    });
};

Logger.List = (IncludeCompressLogs, Callback) =>
{
    fs.readdir(Logger.BaseDirectory, (RDError, Data) =>
    {
        if (!RDError && Data && Data.length > 0)
        {
            let TrimmedFileName = [];

            Data.forEach(FileName =>
            {
                if (FileName.indexOf('.log' > -1))
                    TrimmedFileName.push(FileName.replace('.log', ''));

                if (FileName.indexOf('.gz.b64') > -1 && IncludeCompressLogs)
                    TrimmedFileName.push(FileName.replace('.gz.b64', ''));
            });

            Callback(false, TrimmedFileName);
        }
        else
            Callback(RDError, Data);
    });
};

Logger.Compress = (LogID, NewFileID, Callback) =>
{
    let SourceFile = `${LogID}.log`;
    let Destination = `${NewFileID}.gz.b64`;

    fs.readFile(`${Logger.BaseDirectory}/${SourceFile}`, 'utf8', (RError, Data) =>
    {
        if (!RError && Data)
        {
            zlib.gzip(Data, (GError, _Buffer) =>
            {
                if (!GError && _Buffer)
                {
                    fs.open(`${Logger.BaseDirectory}/${Destination}`, 'wx', (OError, FileDescriptor) =>
                    {
                        if (!OError && FileDescriptor)
                        {
                            fs.writeFile(FileDescriptor, _Buffer.toString('base64'), WError =>
                            {
                                if (!WError)
                                {
                                    fs.close(FileDescriptor, CError =>
                                    {
                                        if (!CError)
                                            Callback(false);
                                        else
                                            Callback(CError);
                                    });
                                }
                                else
                                    Callback(WError);
                            });
                        }
                        else
                            Callback(OError);
                    });
                }
                else
                    Callback(RError);
            });
        }
        else
            Callback(RError);
    });
};

Logger.Decompress = (FileID, Callback) =>
{
    let FileName = `${FileID}.gz.b64`;

    fs.readFile(`${Logger.BaseDirectory}/${FileName}`, 'utf8', (RError, Data) =>
    {
        if (!RError && Data)
        {
            let InputBuffer = Buffer.from(Data, 'base64');

            zlib.unzip(InputBuffer, (UError, OutputBuffer) =>
            {
                if (!UError && OutputBuffer)
                {
                    let STR = OutputBuffer.toString();
                    Callback(false, STR);
                }
                else
                    Callback(UError);
            });
        }
        else
            Callback(RError);
    });
};

Logger.Truncate = (LogID, Callback) =>
{
    fs.truncate(`${Logger.BaseDirectory}/${LogID}.log`, 0, TError =>
    {
        if (TError)
            Callback(false);
        else
            Callback(TError);
    });
};

module.exports = Logger;
