/**
 * Represents entity of the migration in the database.
 */
var Migration = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function Migration(id, timestamp, name, instance) {
        this.id = id;
        this.timestamp = timestamp;
        this.name = name;
        this.instance = instance;
    }
    return Migration;
}());
export { Migration };

//# sourceMappingURL=Migration.js.map
