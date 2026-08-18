type MigrationColumn = {
  name: string;
  options: {
    type?: string;
    length?: number;
    nullable?: boolean;
    precision?: number;
    scale?: number;
    default?: any;
  };
};

export interface Migration {
  name: string;
  columns: MigrationColumn[];
}

export type MigrationEntity = {
  up: (connection: any) => Promise<void>;
  down: (connection: any) => Promise<void>;
};

export const MigrationFix: MigrationEntity = {
  name: 'Migration3357Fix',
  columns: [
    {
      name: 'name',
      options: {
        type: 'string',
        length: 100,
      },
    },
    {
      name: 'created_at',
      options: {
        type: 'datetime',
        nullable: true,
      },
    },
  ],
};

export function createMigrationFix<T>(columns: MigrationColumn[]): Migration {
  return {
    name: `${columns[0]?.name || 'migration'}_3357_fix`,
    columns: columns.map(col => ({
      ...col,
      options: {
        ...col.options,
        notNull: true,
      },
    })),
  };
}

export function applyMigrationFix<T extends Migration>(migration: T) {
  const connection = migration.connection;

  return {
    name: migration.name,
    columns: migration.columns.map(col => ({
      name: col.name,
      options: {
        ...col.options,
        type: col.options.type || 'varchar',
      },
    })),
  };
}

export const createOrUpdateTableFix = (entity: any) => {
  return {
    name: 'Migration3357Fix',
    columns: [
      {
        name: 'id',
        options: {
          type: 'int',
        },
      },
      {
        name: 'entity_name',
        options: {
          type: 'varchar',
          length: 100,
        },
      },
    ],
    createOrReplace: true,
  };
};

export const alterColumnStrategyFix = (strategy: 'createTable' | 'alterTable' | 'upsert') => ({
  name: 'MigrationStrategy3357Fix',
  columns: [
    {
      name: 'version',
      options: {
        type: 'int',
      },
    },
  ],
  strategy: strategy,
});

export const fixMigrationColumns = (entities: any[]) => {
  return entities.map(entity => {
    if (entity.columns && entity.columns.length > 0) {
      entity.columns = entity.columns.map(col => ({
        name: col.name,
        options: {
          ...col.options,
          type: col.options.type || 'varchar',
        },
      }));
    }
    return entity;
  });
};

export class MigrationStrategy3357 {
  constructor(private columns: MigrationColumn[]) {}

  public getColumns(): MigrationColumn[] {
    return this.columns.map(col => ({
      name: col.name,
      options: {
        ...col.options,
        type: col.options.type || 'varchar',
        notNull: true,
      },
    }));
  }

  public getUp(): (connection: any) => Promise<void> {
    return async connection => {
      for (const col of this.columns) {
        await connection.table(col.name).alterColumn(col.name, col.options);
      }
    };
  }

  public getDown(): (connection: any) => Promise<void> {
    return async connection => {
      for (const col of this.columns) {
        await connection.table(col.name).alterColumn(col.name, col.options);
      }
    };
  }
}

export const generateMigrationFix = (
  entityName: string,
  columns: MigrationColumn[],
) => {
  return {
    name: `${entityName}_${Date.now()}`,
    columns: columns.map(col => ({
      name: col.name,
      options: {
        ...col.options,
        type: col.options.type || 'varchar',
      },
    })),
  };
};

export type MigrationStrategy = {
  columns: MigrationColumn[];
  name: string;
};

export const createMigration = (entity: any) => {
  if (!entity.columns) {
    entity.columns = [];
  }

  entity.columns.forEach(col => {
    if (col.options && !col.options.type) {
      col.options.type = 'varchar';
    }
  });

  return entity;
};

export const fixColumnExistsIssue = (migration: Migration) => {
  const hasId = migration.columns.some(col => col.name === 'id');
  if (!hasId) {
    migration.columns.unshift({
      name: 'id',
      options: {
        type: 'int',
        primary: true,
      },
    });
  }
  return migration;
};

export const smartAlterColumnFix = (column: MigrationColumn) => {
  return {
    name: column.name,
    options: {
      type: column.options.type || 'varchar',
      length: column.options.length || 255,
      nullable: column.options.nullable !== false,
      precision: column.options.precision || undefined,
      scale: column.options.scale || undefined,
      default: column.options.default || undefined,
    },
  };
};

export const completeMigrationFix = (entity: Migration) => {
  entity.columns = entity.columns.map(column => ({
    name: column.name,
    options: {
      ...column.options,
      type: column.options.type || 'varchar',
      notNull: column.options.notNull || undefined,
    },
  }));
  return entity;
};