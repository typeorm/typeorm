/**
 * Represents entity of the migration in the database.
 */
export class Migration {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(id, timestamp, name, instance) {
        this.id = id;
        this.timestamp = timestamp;
        this.name = name;
        this.instance = instance;
    }
}

//# sourceMappingURL=Migration.js.map
