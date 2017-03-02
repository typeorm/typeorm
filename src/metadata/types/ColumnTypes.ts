/**
 * All data types that column can be.
 */
export type ColumnType = "string"|"text"|"number"|"integer"|"int"|"smallint"|"bigint"|"float"|"double"|
                         "decimal"|"date"|"time"|"datetime"|"boolean"|"json"|"jsonb"|"simple_array"|"uuid";

/**
 * All data types that column can be.
 */
export class ColumnTypes {

    /**
     * SQL VARCHAR type. Your class's property type should be a "string".
     */
    static STRING: ColumnType = "string";

    /**
     * SQL CLOB type. Your class's property type should be a "string".
     */
    static TEXT: ColumnType = "text";

    /**
     * SQL FLOAT type. Your class's property type should be a "number".
     */
    static NUMBER: ColumnType = "number";

    /**
     * SQL INT type. Your class's property type should be a "number".
     */
    static INTEGER: ColumnType = "integer";

    /**
     * SQL INT type. Your class's property type should be a "number".
     */
    static INT: ColumnType = "int";

    /**
     * SQL SMALLINT type. Your class's property type should be a "number".
     */
    static SMALLINT: ColumnType = "smallint";

    /**
     * SQL BIGINT type. Your class's property type should be a "number".
     */
    static BIGINT: ColumnType = "bigint";

    /**
     * SQL FLOAT type. Your class's property type should be a "number".
     */
    static FLOAT: ColumnType = "float";

    /**
     * SQL FLOAT type. Your class's property type should be a "number".
     */
    static DOUBLE: ColumnType = "double";

    /**
     * SQL DECIMAL type. Your class's property type should be a "string".
     */
    static DECIMAL: ColumnType = "decimal";

    /**
     * SQL DATETIME type. Your class's property type should be a "Date" object.
     */
    static DATE: ColumnType = "date";

    /**
     * SQL TIME type. Your class's property type should be a "Date" object.
     */
    static TIME: ColumnType = "time";

    /**
     * SQL DATETIME/TIMESTAMP type. Your class's property type should be a "Date" object.
     */
    static DATETIME: ColumnType = "datetime";

    /**
     * SQL BOOLEAN type. Your class's property type should be a "boolean".
     */
    static BOOLEAN: ColumnType = "boolean";

    /**
     * SQL CLOB type. Your class's property type should be any Object.
     */
    static JSON: ColumnType = "json";

    /**
     * Postgres jsonb type. Your class's property type should be any Object.
     */
    static JSONB: ColumnType = "jsonb";

    /**
     * SQL CLOB type. Your class's property type should be array of string. Note: value in this column should not contain
     * a comma (",") since this symbol is used to create a string from the array, using .join(",") operator.
     */
    static SIMPLE_ARRAY: ColumnType = "simple_array";

    /**
     * UUID type. Serialized to a string in typescript or javascript
     */
    static UUID: ColumnType = "uuid";

    /**
     * Checks if given type in a string format is supported by ORM.
     */
    static isTypeSupported(type: string) {
        return this.supportedTypes.indexOf(<ColumnType> type) !== -1;
    }

    /**
     * Returns list of all supported types by the ORM.
     */
    static get supportedTypes() {
        return [
            this.STRING,
            this.TEXT,
            this.NUMBER,
            this.INTEGER,
            this.INT,
            this.SMALLINT,
            this.BIGINT,
            this.FLOAT,
            this.DOUBLE,
            this.DECIMAL,
            this.DATE,
            this.TIME,
            this.DATETIME,
            this.BOOLEAN,
            this.JSON,
            this.JSONB,
            this.SIMPLE_ARRAY,
            this.UUID
        ];
    }

    /**
     * Tries to guess a column type from the given function.
     */
    static determineTypeFromFunction(type: Function): ColumnType|undefined {
        if (type instanceof Date) {
            return ColumnTypes.DATETIME;

        } else if (type instanceof Function) {
            const typeName = (<any>type).name.toLowerCase();
            switch (typeName) {
                case "number":
                    return ColumnTypes.NUMBER;
                case "boolean":
                    return ColumnTypes.BOOLEAN;
                case "string":
                    return ColumnTypes.STRING;
                case "date":
                    return ColumnTypes.DATETIME;
                case "object":
                    return ColumnTypes.JSON;
            }

        } else if (type instanceof Object) {
            return ColumnTypes.JSON;

        }

        return undefined;
    }

    static typeToString(type: Function): string {
        return (type as any).name.toLowerCase();
    }

    /**
     * Checks if column type is numeric.
     */
    static isNumeric(type: ColumnType) {
        return  type === ColumnTypes.NUMBER ||
                type === ColumnTypes.INT ||
                type === ColumnTypes.INTEGER ||
                type === ColumnTypes.BIGINT ||
                type === ColumnTypes.SMALLINT ||
                type === ColumnTypes.DOUBLE ||
                type === ColumnTypes.FLOAT;
    }

}