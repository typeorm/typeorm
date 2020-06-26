import { ViewColumn, ViewEntity } from "@typeorm/core";

@ViewEntity({
    expression: `
    SELECT \`post\`.\`id\` \`id\`, \`post\`.\`name\` AS \`name\`, \`category\`.\`name\` AS \`categoryName\`
    FROM \`post\` \`post\`
    LEFT JOIN \`category\` \`category\` ON \`post\`.\`categoryId\` = \`category\`.\`id\`
`
})
export class PostCategory {

    @ViewColumn()
    id: number;

    @ViewColumn({name: "name"})
    postName: string;

    @ViewColumn()
    categoryName: string;

}
