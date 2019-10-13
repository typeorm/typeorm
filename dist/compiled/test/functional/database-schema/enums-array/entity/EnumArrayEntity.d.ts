export declare enum NumericEnum {
    ADMIN = 0,
    EDITOR = 1,
    MODERATOR = 2,
    GHOST = 3
}
export declare enum StringEnum {
    ADMIN = "a",
    EDITOR = "e",
    MODERATOR = "m",
    GHOST = "g"
}
export declare enum StringNumericEnum {
    ONE = "1",
    TWO = "2",
    THREE = "3",
    FOUR = "4"
}
export declare enum HeterogeneousEnum {
    NO = 0,
    YES = "YES"
}
export declare type ArrayDefinedStringEnumType = "admin" | "editor" | "ghost";
export declare type ArrayDefinedNumericEnumType = 11 | 12 | 13;
export declare class EnumArrayEntity {
    id: number;
    numericEnums: NumericEnum[];
    stringEnums: StringEnum[];
    stringNumericEnums: StringNumericEnum[];
    heterogeneousEnums: HeterogeneousEnum[];
    arrayDefinedStringEnums: ArrayDefinedStringEnumType[];
    arrayDefinedNumericEnums: ArrayDefinedNumericEnumType[];
    enumWithoutDefault: StringEnum[];
    legacyDefaultAsString: StringEnum[];
}
