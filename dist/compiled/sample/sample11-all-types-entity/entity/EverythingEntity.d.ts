export declare enum SampleEnum {
    ONE = "one",
    TWO = "two"
}
export declare class EverythingEntity {
    id: number;
    name: string;
    text: string;
    shortTextColumn: string;
    numberColumn: number;
    integerColumn: number;
    intColumn: number;
    smallintColumn: number;
    bigintColumn: number;
    floatColumn: number;
    doubleColumn: number;
    decimalColumn: number;
    date: Date;
    dateColumn: Date;
    timeColumn: Date;
    isBooleanColumn: boolean;
    isSecondBooleanColumn: boolean;
    jsonColumn: any;
    alsoJson: any;
    simpleArrayColumn: string[];
    enum: SampleEnum;
    createdDate: Date;
    updatedDate: Date;
}
