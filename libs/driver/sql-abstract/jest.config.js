module.exports = {
  name: 'driver-sql-abstract',
  preset: '../../../jest.config.js',
  coverageDirectory: '../../../coverage/libs/driver/sql-abstract',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
