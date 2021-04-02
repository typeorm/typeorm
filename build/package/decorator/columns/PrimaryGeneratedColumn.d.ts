import { PrimaryGeneratedColumnNumericOptions } from "../options/PrimaryGeneratedColumnNumericOptions";
import { PrimaryGeneratedColumnUUIDOptions } from "../options/PrimaryGeneratedColumnUUIDOptions";
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(): PropertyDecorator;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(options: PrimaryGeneratedColumnNumericOptions): PropertyDecorator;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(strategy: "increment", options?: PrimaryGeneratedColumnNumericOptions): PropertyDecorator;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(strategy: "uuid", options?: PrimaryGeneratedColumnUUIDOptions): PropertyDecorator;
/**
 * Column decorator is used to mark a specific class property as a table column.
 */
export declare function PrimaryGeneratedColumn(strategy: "rowid", options?: PrimaryGeneratedColumnUUIDOptions): PropertyDecorator;
