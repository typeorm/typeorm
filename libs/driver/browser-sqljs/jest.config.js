module.exports = {
  name: 'driver-browser-sqljs',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/driver/browser-sqljs',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
