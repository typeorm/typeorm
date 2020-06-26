module.exports = {
  name: 'driver-sqlite-abstract',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/driver/sqlite-abstract',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
