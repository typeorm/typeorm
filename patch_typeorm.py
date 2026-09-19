import re

def patch_base_query_runner():
    file = "packages/typeorm/src/query-runner/BaseQueryRunner.ts"
    with open(file, "r") as f:
        content = f.read()

    # Find isColumnChanged signature
    # oldColumn: TableColumn,
    # newColumn: TableColumn,
    # checkDefault?: boolean,
    # checkComment?: boolean,
    # checkEnum = true,
    # ): boolean {
    
    start_str = "    ): boolean {\n        return ("
    replace_str = """    ): boolean {
        const isVector = oldColumn.type === "vector" || oldColumn.type === "halfvec" || newColumn.type === "vector" || newColumn.type === "halfvec";
        return (
            oldColumn.type !== newColumn.type ||
            (!isVector && oldColumn.length !== newColumn.length) ||"""
            
    content = content.replace(start_str + "\n            oldColumn.type !== newColumn.type ||\n            oldColumn.length !== newColumn.length ||", replace_str)
    
    with open(file, "w") as f:
        f.write(content)

def patch_postgres():
    file = "packages/typeorm/src/driver/postgres/PostgresQueryRunner.ts"
    with open(file, "r") as f:
        content = f.read()

    # In Postgres drop block
    # if (
    #     oldColumn.type !== newColumn.type ||
    #     newColumn.isArray !== oldColumn.isArray ||
    
    start_str = "        if (\n            oldColumn.type !== newColumn.type ||\n"
    replace_str = """        const isVector = oldColumn.type === "vector" || oldColumn.type === "halfvec" || newColumn.type === "vector" || newColumn.type === "halfvec"
        if (
            oldColumn.type !== newColumn.type ||
            (isVector && oldColumn.length !== newColumn.length) ||
"""
    content = content.replace(start_str, replace_str)
    
    # In Postgres ALTER COLUMN block
    #             upQueries.push(
    #                 new Query(
    #                     `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
    #                         newColumn.name
    #                     }" TYPE ${this.driver.createFullType(newColumn)}`,
    #                 ),
    #             )
    
    alter_str = """            if (
                newColumn.length !== oldColumn.length ||
                newColumn.precision !== oldColumn.precision ||
                newColumn.scale !== oldColumn.scale
            ) {
                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
                            newColumn.name
                        }" TYPE ${this.driver.createFullType(newColumn)}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
                            newColumn.name
                        }" TYPE ${this.driver.createFullType(oldColumn)}`,
                    ),
                )
            }"""
            
    new_alter_str = """            if (
                newColumn.length !== oldColumn.length ||
                newColumn.precision !== oldColumn.precision ||
                newColumn.scale !== oldColumn.scale
            ) {
                let upType = this.driver.createFullType(newColumn)
                let downType = this.driver.createFullType(oldColumn)

                if (newColumn.generatedType === "STORED" && newColumn.asExpression) {
                    upType += ` GENERATED ALWAYS AS (${newColumn.asExpression}) STORED`
                }
                if (oldColumn.generatedType === "STORED" && oldColumn.asExpression) {
                    downType += ` GENERATED ALWAYS AS (${oldColumn.asExpression}) STORED`
                }

                upQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
                            newColumn.name
                        }" TYPE ${upType}`,
                    ),
                )
                downQueries.push(
                    new Query(
                        `ALTER TABLE ${this.escapePath(table)} ALTER COLUMN "${
                            newColumn.name
                        }" TYPE ${downType}`,
                    ),
                )
            }"""
            
    content = content.replace(alter_str, new_alter_str)
    
    with open(file, "w") as f:
        f.write(content)

def patch_mysql():
    file = "packages/typeorm/src/driver/mysql/MysqlQueryRunner.ts"
    with open(file, "r") as f:
        content = f.read()

    # In MySQL drop block
    #         if (
    #             (newColumn.isGenerated !== oldColumn.isGenerated &&
    #                 newColumn.generationStrategy !== "uuid") ||
    #             oldColumn.type !== newColumn.type ||
    #             (oldColumn.generatedType &&
    
    start_str = """        if (
            (newColumn.isGenerated !== oldColumn.isGenerated &&
                newColumn.generationStrategy !== "uuid") ||
            oldColumn.type !== newColumn.type ||"""
            
    replace_str = """        const isVector = oldColumn.type === "vector" || newColumn.type === "vector"
        if (
            (newColumn.isGenerated !== oldColumn.isGenerated &&
                newColumn.generationStrategy !== "uuid") ||
            oldColumn.type !== newColumn.type ||
            (isVector && oldColumn.length !== newColumn.length) ||"""
            
    content = content.replace(start_str, replace_str)
    
    with open(file, "w") as f:
        f.write(content)

patch_base_query_runner()
patch_postgres()
patch_mysql()
print("Patched drivers!")
