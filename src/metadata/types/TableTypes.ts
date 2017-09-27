/**
 * Table type. Tables can be abstract, closure, junction, embedded, etc.
 */
export type TableType = "regular"|"abstract"|"junction"|"closure"|"closure-junction"|
    "embeddable"|"single-table-child"|"class-table-child";
