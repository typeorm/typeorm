module.exports = {
  name: 'driver-cordova',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/driver/cordova',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
