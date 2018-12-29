require('source-map-support/register');
require('reflect-metadata');
const chai = require('chai');
const cluster = require('cluster');
const glob = require('glob');
const Mocha = require('mocha');

// Instantiate a Mocha instance.
const mocha = new Mocha({
    bail: true,
    recursive: true,
    timeout: 60000,
});

const connections = [
    'mysql',
    'mariadb',
    'sqlite',
    'postgres',
    'mongodb',
    'sqljs',
];

chai.should();
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const testDir = './build/compiled/test';

glob(`${testDir}/**/*.js`, (err, files) => {
    files.forEach(file => {
        mocha.addFile(file);
    });
    if (cluster.isMaster) {
        connections.forEach(connection => {
            cluster.fork({ CONNECTIONS: connection });
        });
    } else {
        mocha.run(function(failures) {
            process.exit(failures ? 1 : 0);
        });
    }
});
