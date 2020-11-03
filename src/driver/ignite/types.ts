export interface IgniteTable {
  AFFINITY_KEY_COLUMN: string;
  CACHE_ID: number;
  CACHE_NAME: string;
  IS_INDEX_REBUILD_IN_PROGRESS: boolean;
  KEY_ALIAS: string;
  KEY_TYPE_NAME: string;
  SCHEMA_NAME: string;
  TABLE_NAME: string;
  VALUE_ALIAS: string;
  VALUE_TYPE_NAME: string;
}

export interface IgniteTableColumn {
  AAFFINITY_COLUMN: boolean;
  AUTO_INCREMENT: boolean;
  COLUMN_NAME: string;
  DEFAULT_VALUE: string | null;
  NULLABLE: boolean;
  PK: boolean;
  PRECISION: number;
  SCALE: number;
  SCHEMA_NAME: string;
  TABLE_NAME: string;
  TYPE: string;
}

export interface IgniteTableIndex {
  INDEX_NAME: string;
  INDEX_TYPE: string;
  /**
   * @example
   * '"ID" ASC, "COUNTRYCODE" ASC, "COUNTRYCODE" ASC'
   */
  COLUMNS: string;
  SCHEMA_NAME: string;
  TABLE_NAME: string;
  CACHE_NAME: string;
  CACHE_ID: number;
  INLINE_SIZE: number;
  IS_PK: boolean;
  IS_UNIQUE: boolean;
}

export interface IgniteSchema {
  NAME: string;
  PREDEFINED: boolean;
}
