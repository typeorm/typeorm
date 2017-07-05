export interface DataTypeDefaults {
    [type: string]: {
        length?: number;
        precision?: number;
        scale?: number;
    };
}