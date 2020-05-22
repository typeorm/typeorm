import {ViewColumn} from "../../../../../src/decorator/columns/ViewColumn";
import {ViewEntity} from "../../../../../src/decorator/entity-view/ViewEntity";

@ViewEntity({ expression: `
    SELECT \`post\`.\`id\` \`id\`, \`post\`.\`name\` AS \`name\`, \`category\`.\`name\` AS \`categoryName\`
    FROM \`post\` \`post\`
    LEFT JOIN \`category\` \`category\` ON \`post\`.\`categoryId\` = \`category\`.\`id\`
`})
export class PostCategory {

    @ViewColumn()
    id: number;

    @ViewColumn({ name: "name" })
    postName: string;

    @ViewColumn()
    categoryName: string;

}
