var TableUtils = /** @class */ (function () {
    function TableUtils() {
    }
    TableUtils.createTableColumnOptions = function (columnMetadata, driver) {
        return {
            name: columnMetadata.databaseName,
            length: columnMetadata.length,
            width: columnMetadata.width,
            charset: columnMetadata.charset,
            collation: columnMetadata.collation,
            precision: columnMetadata.precision,
            scale: columnMetadata.scale,
            zerofill: columnMetadata.zerofill,
            unsigned: columnMetadata.unsigned,
            asExpression: columnMetadata.asExpression,
            generatedType: columnMetadata.generatedType,
            default: driver.normalizeDefault(columnMetadata),
            onUpdate: columnMetadata.onUpdate,
            comment: columnMetadata.comment,
            isGenerated: columnMetadata.isGenerated,
            generationStrategy: columnMetadata.generationStrategy,
            isNullable: columnMetadata.isNullable,
            type: driver.normalizeType(columnMetadata),
            isPrimary: columnMetadata.isPrimary,
            isUnique: driver.normalizeIsUnique(columnMetadata),
            isArray: columnMetadata.isArray || false,
            enum: columnMetadata.enum ? columnMetadata.enum.map(function (val) { return val + ""; }) : columnMetadata.enum,
            enumName: columnMetadata.enumName,
            spatialFeatureType: columnMetadata.spatialFeatureType,
            srid: columnMetadata.srid
        };
    };
    return TableUtils;
}());
export { TableUtils };

//# sourceMappingURL=TableUtils.js.map
