import { Driver } from "../driver/Driver";
export declare class TreeRepositoryNotSupportedError extends Error {
    name: string;
    constructor(driver: Driver);
}
