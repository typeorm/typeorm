/**
 * Table type. Tables can be abstract, closure, junction, embedded, etc.
 */
export type TableType = "regular" | "view" | "junction" | "closure" | "closure-junction" | "entity-child";
