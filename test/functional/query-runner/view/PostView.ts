import {ViewColumn, ViewEntity} from "../../../../src";

@ViewEntity({
    expression: `SELECT * FROM "post"`
    // expression: `SELECT \`post\`.\`id\`, \`post\`.\`version\` FROM \`post\``
})
export class PostView {
    @ViewColumn()
    id: number

    @ViewColumn()
    type: string;
}
