import {RelationMetadata} from "../metadata/RelationMetadata";
import {Connection} from "../connection/Connection";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {RelationLoader} from "../query-builder/RelationLoader";

/**
 * Wraps entities and creates getters/setters for their relations
 * to be able to lazily load relations when accessing these relations.
 */
export class LazyRelationsWrapper {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Wraps given entity and creates getters/setters for its given relation
     * to be able to lazily load data when accessing these relation.
     */
    wrap(object: ObjectLiteral, relation: RelationMetadata) {
        const relationLoader = new RelationLoader(this.connection);
        const dataIndex = "__" + relation.propertyName + "__"; // in what property of the entity loaded data will be stored
        const promiseIndex = "__promise_" + relation.propertyName + "__"; // in what property of the entity loading promise will be stored
        const resolveIndex = "__has_" + relation.propertyName + "__"; // indicates if relation data already was loaded or not, we need this flag if loaded data is empty

        Object.defineProperty(object, relation.propertyName, {
            get: function() {
                if (this[resolveIndex] === true) // if related data already was loaded then simply return it
                    return Promise.resolve(this[dataIndex]);

                if (this[promiseIndex]) // if related data is loading then return a promise relationLoader loads it
                    return this[promiseIndex];

                // nothing is loaded yet, load relation data and save it in the model once they are loaded
                this[promiseIndex] = relationLoader.load(relation, this).then(result => {
                    this[dataIndex] = result;
                    this[resolveIndex] = true;
                    delete this[promiseIndex];
                    return this[dataIndex];

                });
                return this[promiseIndex];
            },
            set: function(value: any|Promise<any>) {
                if (value instanceof Promise) { // if set data is a promise then wait for its resolve and save in the object
                    value.then(result => {
                        this[dataIndex] = result;
                        this[resolveIndex] = true;
                    });

                } else { // if its direct data set (non promise, probably not safe-typed)
                    this[dataIndex] = value;
                    this[resolveIndex] = true;
                }
            },
            configurable: true
        });
    }

}