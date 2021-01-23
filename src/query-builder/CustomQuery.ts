import {ObjectLiteral} from "../common/ObjectLiteral";
import {Connection} from "../connection/Connection";
import {EntityTarget} from "../common/EntityTarget";
import {AliasesLiteral, CustomQueryBuilder} from "./CustomQueryBuilder";

/**
 * Allows to build entire sql queries 
 */
export class CustomQuery {

    readonly customQueryBuilder: CustomQueryBuilder;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, query?: string,  parameters?: ObjectLiteral, aliases?: AliasesLiteral) {
        this.customQueryBuilder = new CustomQueryBuilder(connection);

        if(query) {
            this.customQueryBuilder.setQuery(query);
        }

        if(parameters) {
            this.customQueryBuilder.setParameters(parameters);
        }

        if(aliases) {
            this.customQueryBuilder.setAliases(aliases);
        }        
    }

    setQuery(query: string): this {
        this.customQueryBuilder.setQuery(query);
        return this;
    }

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        return this.customQueryBuilder.getQuery();
    }
  
    addAlias(entityTarget: EntityTarget<any>, aliasName: string): this {
        this.customQueryBuilder.addAlias(entityTarget, aliasName);
        return this;
    }

    setAliases(aliases: { [aliasName: string]: EntityTarget<any> }): this {
        this.customQueryBuilder.setAliases(aliases);
        return this;
    }

    setParameter(key: string, value: any): this {
        this.customQueryBuilder.setParameter(key, value);
        return this;
    }

    setParameters(parameters: ObjectLiteral): this {
        this.customQueryBuilder.setParameters(parameters);
        return this;
    }


    printSql(): this { 
        this.customQueryBuilder.printSql();
        return this;
    }


    getSql(): string {
        return this.customQueryBuilder.getQueryAndParameters()[0];
    }


    getQueryAndParameters(): [string, any[]] {
        return this.customQueryBuilder.getQueryAndParameters();
    }

    async execute(): Promise<any> {
        return this.customQueryBuilder.execute();
    }


    async getRawOne<T = any>(): Promise<T> {
        return this.customQueryBuilder.getRawOne<T>();
    }

    async getRawMany<T = any>(): Promise<T[]> {
        return this.customQueryBuilder.getRawMany<T>();
    }
}
