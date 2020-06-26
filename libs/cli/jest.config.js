module.exports = {
  name: 'cli',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/libs/cli',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
