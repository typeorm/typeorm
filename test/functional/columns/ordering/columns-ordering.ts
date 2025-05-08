import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { TestOrderableWithoutFieldsNoSort } from "./entity/TestOrderableWithoutFieldsNoSort"
import { TestOrderableWithFieldsNoSort } from "./entity/TestOrderableWithFieldsNoSort"
import { TestReverseOrder } from "./entity/TestReverseOrder"
import { TestSwapOrder } from "./entity/TestSwapOrder"
import { TestMoveAfterLast } from "./entity/TestMoveAfterLast"
import { TestMoveAfterMoved } from "./entity/TestMoveAfterMoved"
import { TestMoveBeforeFirst } from "./entity/TestMoveBeforeFirst"
import { TestMoveBeforeMoved } from "./entity/TestMoveBeforeMoved"
import { TestPlainEntity } from "./entity/TestPlainEntity"
import { TestInheritedAppend } from "./entity/TestInheritedAppend"
import { TestInheritedInterleave } from "./entity/TestInheritedInterleave"
import { TestInheritedMiddleInsert } from "./entity/TestInheritedMiddleInsert"
import { TestInheritedPrepend } from "./entity/TestInheritedPrepend"

// prettier-ignore
const standardOrder = ["id", "a", "b", "c", "d", "e", "f", "g", "h", "i"]

async function getTable(connection: DataSource, tableName: string) {
    const runner = connection.createQueryRunner()
    const table = (await runner.getTable(tableName))!
    await runner.release()
    return table
}

describe("columns > ordering", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [
                    TestInheritedAppend,
                    TestInheritedInterleave,
                    TestInheritedMiddleInsert,
                    TestInheritedPrepend,
                    TestMoveAfterLast,
                    TestMoveAfterMoved,
                    TestMoveBeforeFirst,
                    TestMoveBeforeMoved,
                    TestOrderableWithFieldsNoSort,
                    TestOrderableWithoutFieldsNoSort,
                    TestPlainEntity,
                    TestReverseOrder,
                    TestSwapOrder,
                ],
                // Only supported on drivers that can guarantee strict order of columns
                enabledDrivers: [
                    "mysql",
                    "postgres",
                    "mariadb",
                    "better-sqlite3",
                    "sqlite",
                    "mssql",
                    "sap",
                ],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should be a normal entity without any ordering modifications", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(connection, "test_plain_entity")
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(standardOrder)
            }),
        ))

    it("should create the columns without changing order", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_orderable_without_fields_no_sort",
                )

                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(standardOrder)
            }),
        ))

    it("should create the columns and sort without changing order", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_orderable_with_fields_no_sort",
                )

                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(standardOrder)
            }),
        ))

    it("should reverse the order of columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(connection, "test_reverse_order")

                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal([...standardOrder].reverse())
            }),
        ))

    it("should swap every pair of elements", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(connection, "test_swap_order")

                // prettier-ignore
                const expected = ["a", "id", "c", "b", "e", "d", "g", "f", "i", "h"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should move an element to after the last column (after i)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(connection, "test_move_after_last")

                // prettier-ignore
                const expected = ["id", "b", "c", "d", "e", "f", "g", "h", "i", "a"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should move an element to before the first column (before id)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_move_before_first",
                )

                // prettier-ignore
                const expected = ["b", "id", "a", "c", "d", "e", "f", "g", "h", "i"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should move a column to its position and then move the next column forwards", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_move_after_moved",
                )

                // prettier-ignore
                const expected = ["id", "e", "a", "b", "c", "d", "f", "g", "h", "i"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should move forwards and then move another column in front of that new position", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_move_before_moved",
                )

                // prettier-ignore
                const expected = ["id", "f", "c", "a", "b", "d", "e", "g", "h", "i"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should prepend inherited elements while ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_inherited_prepend",
                )

                // prettier-ignore
                const expected = ['createdAt', 'updatedAt', 'deletedAt', ...standardOrder]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should append inherited elements while ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_inherited_append",
                )

                // prettier-ignore
                const expected = [...standardOrder, 'createdAt', 'updatedAt', 'deletedAt']
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should insert inherited elements in the middle while ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_inherited_middle_insert",
                )

                // prettier-ignore
                const expected = ["id", "a", "b", "c", "d", "e", 'createdAt', 'updatedAt', 'deletedAt', "f", "g", "h", "i"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))

    it("should interleave inherited elements while ordering", () =>
        Promise.all(
            connections.map(async (connection) => {
                const table = await getTable(
                    connection,
                    "test_inherited_interleave",
                )

                // prettier-ignore
                const expected = ["id", "a", "b", "c", 'createdAt', "d", "e", 'updatedAt', "f", 'deletedAt', "g", "h", "i"]
                const columnNames = table.columns.map((col) => col.name)
                expect(columnNames).to.deep.equal(expected)
            }),
        ))
})
