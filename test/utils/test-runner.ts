/**
 * Execute mocha tests programmatically to take advantage of clustering to run tests in parallel.
 */

import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import * as cluster from "cluster";
import * as glob from "glob";
import * as Mocha from "mocha";
import {argv} from "yargs";

const mocha = new Mocha({
  bail: true,
  grep: new RegExp(argv.grep),
  reporter: "min",
  timeout: 60000
});

// Take environment CONNECTIONS variable or just use them all.
const connections = (process.env.CONNECTIONS &&
  process.env.CONNECTIONS.split(",")) || [
  "mysql",
  "mariadb",
  "sqlite",
  "postgres",
  "mongodb",
  "sqljs"
];

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

// Depends on `npm run compile` having executed.
glob("./test/**/*.ts", (err, files) => {
  if (err) {
    console.error(err);
    throw err;
  }
  files.forEach(file => {
    mocha.addFile(file);
  });
  if (cluster.isMaster) {
    // Create a fork for each connection.
    connections.forEach(connection => {
      cluster.fork({ CONNECTIONS: connection });
    });
    // Fail fast - kill all workers and exit on error
    cluster.on("exit", (worker, code) => {
      if (code !== 0) {
        for (let id in cluster.workers) {
          process.kill(cluster.workers[id].process.pid);
        }
        process.exit(code);
      }
    });
  } else {
    mocha.run(function(failures) {
      console.log(
        `Completed test run for ${process.env.CONNECTIONS}: ${
          failures ? "FAILURE" : "SUCCESS"
        }`
      );
      process.exit(failures ? 1 : 0);
    });
  }
});
