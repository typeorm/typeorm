import {EntityMetadata} from "../../metadata/EntityMetadata";
import {Alias} from "./Alias";
import {Connection} from "../../connection/Connection";

/**
 */
export class AliasMap {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    aliases: Alias[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    addMainAlias(alias: Alias) {
        if (this.hasMainAlias)
            this.aliases.splice(this.aliases.indexOf(this.mainAlias), 1);

        alias.isMain = true;
        this.aliases.push(alias);
    }

    addAlias(alias: Alias) {
        this.aliases.push(alias);
    }

    get hasMainAlias() {
        return !!this.aliases.find(alias => alias.isMain);
    }

    get mainAlias() {
        const alias = this.aliases.find(alias => alias.isMain);
        if (!alias)
            throw new Error(`Main alias is not set.`);

        return alias;
    }

    findAliasByName(name: string) {
        return this.aliases.find(alias => alias.name === name);
    }

    findAliasByParent(parentAliasName: string, parentPropertyName: string) {
        return this.aliases.find(alias => {
            return alias.parentAliasName === parentAliasName && alias.parentPropertyName === parentPropertyName;
        });
    }

    /**
     * @deprecated
     */
    getEntityMetadataByAlias(alias: Alias): EntityMetadata|undefined {
        if (alias.metadata) {
            // todo: use connection.getMetadata instead?
            return alias.metadata;

        } else if (alias.parentAliasName && alias.parentPropertyName) {

            const parentAlias = this.findAliasByName(alias.parentAliasName);
            if (!parentAlias)
                throw new Error(`Alias "${alias.parentAliasName}" was not found`);

            const parentEntityMetadata = this.getEntityMetadataByAlias(parentAlias);
            if (!parentEntityMetadata)
                throw new Error("Cannot get entity metadata for the given alias " + alias.name);

            if (!parentEntityMetadata.hasRelationWithPropertyName(alias.parentPropertyName))
                throw new Error("Relation metadata for " + alias.parentAliasName + "#" + alias.parentPropertyName + " was not found.");

            const relation = parentEntityMetadata.findRelationWithPropertyName(alias.parentPropertyName);
            return relation.inverseEntityMetadata;
        }

        return undefined;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

}