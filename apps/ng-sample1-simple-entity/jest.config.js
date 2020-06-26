module.exports = {
  name: 'ng-sample1-simple-entity',
  preset: '../../jest.config.js',
  coverageDirectory: '../../coverage/apps/ng-sample1-simple-entity',
  snapshotSerializers: [
    'jest-preset-angular/build/AngularNoNgAttributesSnapshotSerializer.js',
    'jest-preset-angular/build/AngularSnapshotSerializer.js',
    'jest-preset-angular/build/HTMLCommentSerializer.js',
  ],
};
