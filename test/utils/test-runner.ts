import "reflect-metadata";
import "source-map-support/register";

import * as chai from "chai";
import * as cluster from "cluster";
import * as glob from "glob";
import * as Mocha from "mocha";

// Instantiate a Mocha instance.
const mocha = new Mocha({
  bail: true,
  reporter: "min",
  timeout: 60000
});

const connections = [
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

glob("./build/compiled/test/**/*.js", (err, files) => {
  if (err) {
    console.error(err);
    throw err;
  }
  files.forEach(file => {
    mocha.addFile(file);
  });
  if (cluster.isMaster) {
    connections.forEach(connection => {
      cluster.fork({ CONNECTIONS: connection });
    });
  } else {
    mocha.run(function(failures) {
      console.log(`Completed test run for ${process.env.CONNECTIONS}: ${failures ? "FAILURE" : "SUCCESS"}`);
      process.exit(failures ? 1 : 0);
    });
  }
});
