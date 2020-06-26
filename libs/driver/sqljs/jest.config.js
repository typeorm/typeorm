module.exports = {
  name: 'driver-sqljs',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/driver/sqljs',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
