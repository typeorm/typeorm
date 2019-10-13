import { PrimaryGeneratedColumnNumericOptions } from "../options/PrimaryGeneratedColumnNumericOptions";
import { PrimaryGeneratedColumnUUIDOptions } from "../options/PrimaryGeneratedColumnUUIDOptions";
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(): Function;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnNumericOptions): Function;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(strategy: "increment", options?: PrimaryGeneratedColumnNumericOptions): Function;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(strategy: "uuid", options?: PrimaryGeneratedColumnUUIDOptions): Function;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(strategy: "rowid", options?: PrimaryGeneratedColumnUUIDOptions): Function;
