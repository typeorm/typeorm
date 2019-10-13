/// <reference types="node" />
import { FruitEnum } from "../enum/FruitEnum";
export declare class Post {
    id: number;
    name: string;
    integer: number;
    int: number;
    int2: number;
    int8: number;
    tinyint: number;
    smallint: number;
    mediumint: number;
    bigint: number;
    unsignedBigInt: number;
    character: string;
    varchar: string;
    varyingCharacter: string;
    nchar: string;
    nativeCharacter: string;
    nvarchar: string;
    text: string;
    blob: Buffer;
    clob: string;
    real: number;
    double: number;
    doublePrecision: number;
    float: number;
    numeric: number;
    decimal: number;
    boolean: boolean;
    date: string;
    datetime: Date;
    simpleArray: string[];
    simpleJson: {
        param: string;
    };
    simpleEnum: string;
    simpleClassEnum1: FruitEnum;
}
