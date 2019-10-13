/// <reference types="node" />
import { FruitEnum } from "../enum/FruitEnum";
export declare class Post {
    id: number;
    name: string;
    bit: boolean;
    tinyint: number;
    smallint: number;
    int: number;
    bigint: string;
    decimal: number;
    dec: number;
    numeric: number;
    float: number;
    real: number;
    smallmoney: number;
    money: number;
    uniqueidentifier: string;
    char: string;
    varchar: string;
    text: string;
    nchar: string;
    nvarchar: string;
    ntext: string;
    binary: Buffer;
    varbinary: Buffer;
    image: Buffer;
    rowversion: Buffer;
    dateObj: Date;
    date: string;
    datetime: Date;
    datetime2: Date;
    smalldatetime: Date;
    timeObj: Date;
    time: string;
    datetimeoffset: Date;
    geometry1: string;
    geometry2: string;
    geometry3: string;
    simpleArray: string[];
    simpleJson: {
        param: string;
    };
    simpleEnum: string;
    simpleClassEnum1: FruitEnum;
}
