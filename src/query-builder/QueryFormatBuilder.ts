import {EntityTarget} from "../common/EntityTarget";
import {SelectQueryBuilder} from "./SelectQueryBuilder";

/**
 * Allows to build full sql queries 
 */
export class QueryFormatBuilder extends SelectQueryBuilder<any> {

     /**
     * Full query
     */
    query: string;


    /**
     * Set full query
     */
    setQuery(query: string): this {
        this.query = query;
        return this;
    }

    /**
     * Gets generated sql query without parameters being replaced.
     */
    getQuery(): string {
        return this.createSql();
    }
   

    addAlias(entityTarget: EntityTarget<any>, aliasName: string): this {
        if (this.connection.hasMetadata(entityTarget)) {
            const metadata = this.connection.getMetadata(entityTarget);

            this.expressionMap.createAlias({
                type: "other",
                name: aliasName,
                metadata: this.connection.getMetadata(entityTarget),
                tablePath: metadata.tablePath,
            });
        }

        return this;
    }

    setAliases(aliases: { [aliasName: string]: EntityTarget<any> }): this {
        Object.keys(aliases).forEach((key) => this.addAlias(aliases[key], key));
        return this;
    }

  

    /**
     * Escape RegExp
     */

    protected escapeRegExp(s: String) {
        return s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
    }

    /**
     * Replaces all entity's aliases to name in the given statement.
     */

    protected replacePropertyAliases(statement: string) {
        const replacements: { [key: string]: string } = {};

        for (const alias of this.expressionMap.aliases) {
            if (alias.tablePath && alias.type === "other") {
                replacements[alias.name] =
                    this.getTableName(alias.tablePath) +
                    " " +
                    this.escape(alias.name);
                    
                const columnAliases: string[] = [];

                for (const column of alias.metadata.columns) {
                    const columnAlias = 
                        `${alias.name}.${column.propertyName}`  +
                        " AS " +
                        this.escape(column.propertyName);

                    replacements[`${alias.name}.${column.propertyName}`] = columnAlias;
                    columnAliases.push(columnAlias);
                }
        
                replacements[`${alias.name}.*`] = columnAliases.join(", ");
            }
        }
        
        const replacementKeys = Object.keys(replacements);

        statement = statement.replace(
            new RegExp(
               `(?<=[ =\(]|^)` + `\\&(${replacementKeys.map(this.escapeRegExp).join("|")})` + `(?=[ =\)\,]|$)`,
                "gm"
            ),
            (_, p) => replacements[p]
        );

        return statement;
    }


    protected createSql(): string {
        let sql = this.query;
        sql = this.replacePropertyAliases(sql);
        sql = this.replacePropertyNames(sql);
        return sql;
    }


}
