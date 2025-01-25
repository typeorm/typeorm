// https://github.com/mochajs/mocha/blob/main/example/config/.mocharc.js

module.exports = {
    bail: true,
    'check-leaks': true,
    color: true,
    file: ['./build/compiled/test/utils/test-setup.js'],
    spec: ["./build/compiled/test"],
    timeout: "90000",
    // jobs: 1,
    // parallel: false,
    recursive: true,
};