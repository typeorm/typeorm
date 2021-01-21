import {ObjectLiteral} from "../common/ObjectLiteral";
import {Connection} from "../connection/Connection";
import {EntityTarget} from "../common/EntityTarget";
import {AliasesLiteral, QueryFormatBuilder} from "./QueryFormatBuilder";

/**
 * Allows to build full sql queries 
 */
export class QueryFormatter {

    readonly queryFormatBuilder: QueryFormatBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, query?: string,  parameters?: ObjectLiteral, aliases?: AliasesLiteral) {
        this.queryFormatBuilder = new QueryFormatBuilder(connection);

        if(query) {
            this.queryFormatBuilder.setQuery(query);
        }

        if(parameters) {
            this.queryFormatBuilder.setParameters(parameters);
        }

        if(aliases) {
            this.queryFormatBuilder.setAliases(aliases);
        }        
    }

    setQuery(query: string): this {
        this.queryFormatBuilder.setQuery(query);
        return this;
    }

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        return this.queryFormatBuilder.getQuery();
    }
  
    addAlias(entityTarget: EntityTarget<any>, aliasName: string): this {
        this.queryFormatBuilder.addAlias(entityTarget, aliasName);
        return this;
    }

    setAliases(aliases: { [aliasName: string]: EntityTarget<any> }): this {
        this.queryFormatBuilder.setAliases(aliases);
        return this;
    }

    setParameter(key: string, value: any): this {
        this.queryFormatBuilder.setParameter(key, value);
        return this;
    }

    setParameters(parameters: ObjectLiteral): this {
        this.queryFormatBuilder.setParameters(parameters);
        return this;
    }


    printSql(): this { 
        this.queryFormatBuilder.printSql();
        return this;
    }


    getSql(): string {
        return this.queryFormatBuilder.getQueryAndParameters()[0];
    }


    getQueryAndParameters(): [string, any[]] {
        return this.queryFormatBuilder.getQueryAndParameters();
    }


    async getRawOne<T = any>(): Promise<T> {
        return this.queryFormatBuilder.getRawOne<T>();
    }


    async getRawMany<T = any>(): Promise<T[]> {
        return this.queryFormatBuilder.getRawMany<T>();
    }

    async execute(): Promise<any> {
        return this.queryFormatBuilder.execute();
    }
}
