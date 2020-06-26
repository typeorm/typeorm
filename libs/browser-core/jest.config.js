module.exports = {
  name: 'browser-core',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/libs/browser-core',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
