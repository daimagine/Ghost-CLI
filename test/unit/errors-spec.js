'use strict';
const expect = require('chai').expect;
const stripAnsi = require('strip-ansi');

const errors = require('../../lib/errors');

describe('Unit: Errors', function () {
    it('type getter returns error type', function () {
        const cliError = new errors.CliError();
        expect(cliError.type).to.equal('CliError');

        const processError = new errors.ProcessError();
        expect(processError.type).to.equal('ProcessError');
    });

    describe('CliError', function () {
        it('logToFile returns what options.log is', function () {
            const errorWithLog = new errors.CliError({log: true});
            expect(errorWithLog.logToFile()).to.be.true;

            const errorWOLog = new errors.CliError({log: false});
            expect(errorWOLog.logToFile()).to.be.false;
        });

        it('logs only message by default', function () {
            const basicError = new errors.CliError('some error');

            expect(stripAnsi(basicError.toString())).to.equal('Message: some error\n');
        });

        it('logs stack trace if verbose is set', function () {
            const verboseError = new errors.CliError('some error');

            const errorOutput = stripAnsi(verboseError.toString(true));
            expect(errorOutput).to.match(/Message: some error/);
            expect(errorOutput.indexOf(verboseError.stack)).to.not.equal(-1);
        });

        it('logs help if help option is passed', function () {
            const errorWithHelp = new errors.CliError({
                message: 'some error',
                help: 'some help message'
            });

            const errorOutput = stripAnsi(errorWithHelp.toString());
            expect(errorOutput).to.match(/Message: some error/);
            expect(errorOutput).to.match(/Help: some help message/);
        });
    });

    describe('ProcessError', function () {
        it('outputs just command name by default', function () {
            const processError = new errors.ProcessError({
                cmd: 'ls -al'
            });

            const errorOutput = stripAnsi(processError.toString());
            expect(errorOutput).to.match(/Error occurred running command/);
            expect(errorOutput).to.match(/ls -al/);
        });

        it('outputs special message if process was killed', function () {
            const processError = new errors.ProcessError({
                cmd: 'npm install',
                killed: true
            });

            const errorOutput = stripAnsi(processError.toString());
            expect(errorOutput).to.match(/Error occurred running command/);
            expect(errorOutput).to.match(/npm install/);
            expect(errorOutput).to.match(/Process was killed/);
        });

        it('outputs exit code if it exists', function () {
            const processError = new errors.ProcessError({
                cmd: 'npm install',
                code: 42
            });

            const errorOutput = stripAnsi(processError.toString());
            expect(errorOutput).to.match(/Error occurred running command/);
            expect(errorOutput).to.match(/npm install/);
            expect(errorOutput).to.match(/Exit code: 42/);
        });

        it('outputs stdout and stderr in verbose mode', function () {
            const processError = new errors.ProcessError({
                cmd: 'npm install',
                stdout: 'some stdout',
                stderr: 'some stderr'
            });

            const errorOutput = stripAnsi(processError.toString(true));
            expect(errorOutput).to.match(/Error occurred running command/);
            expect(errorOutput).to.match(/npm install/);
            expect(errorOutput).to.match(/stdout/);
            expect(errorOutput).to.match(/some stdout/);
            expect(errorOutput).to.match(/stderr/);
            expect(errorOutput).to.match(/some stderr/);
        });
    });

    describe('SystemError', function () {
        it('doesn\'t log to file', function () {
            const error = new errors.SystemError({message: 'some error', log: true});
            expect(error.logToFile()).to.be.false;
        });

        it('doesn\'t return the stack, even in verbose', function () {
            const verboseError = new errors.SystemError('some error');

            const errorOutput = stripAnsi(verboseError.toString(true));
            expect(errorOutput).to.match(/Message: some error/);
            expect(errorOutput.indexOf(verboseError.stack)).to.equal(-1);
        });
    });

    describe('ConfigError', function () {
        it('doesn\'t log to file', function () {
            const error = new errors.ConfigError({message: 'some error', log: true});
            expect(error.logToFile()).to.be.false;
        });

        it('doesn\'t return the stack, even in verbose', function () {
            const verboseError = new errors.ConfigError('some error');

            const errorOutput = stripAnsi(verboseError.toString(true));
            expect(errorOutput).to.match(/Message: some error/);
            expect(errorOutput.indexOf(verboseError.stack)).to.equal(-1);
        });

        it('outputs environment with error message', function () {
            const error = new errors.ConfigError({
                message: 'Invalid database name',
                environment: 'production'
            });

            const errorOutput = stripAnsi(error.toString());
            expect(errorOutput).to.match(/Error detected in the production configuration/);
            expect(errorOutput).to.match(/Message: Invalid database name/);
        });

        it('outputs config keys/values as part of error message', function () {
            const error = new errors.ConfigError({
                message: 'Invalid database username or password',
                environment: 'production',
                config: {
                    'database.connection.username': 'root',
                    'database.connection.password': 'password'
                }
            });

            const errorOutput = stripAnsi(error.toString());
            expect(errorOutput).to.match(/Error detected in the production configuration/);
            expect(errorOutput).to.match(/Message: Invalid database username or password/);
            expect(errorOutput).to.match(/database\.connection\.username/);
            expect(errorOutput).to.match(/database\.connection\.password/);
            expect(errorOutput).to.match(/root \/ password/);
            expect(errorOutput).to.match(/Help: Run `ghost config <key> <new value>/)
        });
    });
});
