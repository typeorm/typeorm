import { expect } from "chai"
import type { ObjectLiteral } from "../../../../src/common/ObjectLiteral"
import type { QueryDeepPartialEntity } from "../../../../src/query-builder/QueryPartialEntity"

// The definition used before cycles were detected. Types that do not contain
// themselves through arrays or unions must keep resolving to exactly this.
type LegacyQueryDeepPartialEntity<T> = _Legacy<
    ObjectLiteral extends T ? unknown : T
>

type _Legacy<T> = {
    [P in keyof T]?:
        | (T[P] extends Array<infer U>
              ? Array<_Legacy<U>>
              : T[P] extends ReadonlyArray<infer U>
                ? ReadonlyArray<_Legacy<U>>
                : _Legacy<T[P]>)
        | (() => string)
}

type Same<A, B> =
    (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2
        ? true
        : false

// the argument is checked when the test file is compiled
const sameAsLegacy = <T>(
    _same: Same<QueryDeepPartialEntity<T>, LegacyQueryDeepPartialEntity<T>>,
) => true

// same shape as `JsonValue` of the `type-fest` package
type JsonPrimitive = string | number | boolean | null
type JsonObject = { [key: string]: JsonValue } & {
    [key: string]: JsonValue | undefined
}
type JsonArray = JsonValue[] | readonly JsonValue[]
type JsonValue = JsonPrimitive | JsonObject | JsonArray

// a plain object that contains itself through arrays only
type Nested = { name: string; children: Nested[] | string }

type Tuple = [string, Tuple] | string

// arrays that contain themselves directly
type ArrayTree = { price: number } | ArrayTree[]
type ReadonlyArrayTree = { price: number } | readonly ReadonlyArrayTree[]

class Address {
    street: string
    zip?: number | null
}

class Photo {
    url: string
    tags: string[]
    readonlyTags: readonly string[]
    size: [number, number]
}

class User {
    id: number
    name: string | null
    createdAt: Date
    avatar: Buffer
    address: Address
    photos: Photo[]
    readonlyPhotos: ReadonlyArray<Photo>
    lookup: Record<string, Address>
    anything: any
    unknownValue: unknown
    neverValue: never
    state: "a" | "b" | { nested: Address }
    handler: () => void
}

// a class that contains itself through an object property, which must stay a
// partial object at every depth
class Category {
    id: number
    children: Category[]
    parent: Category | null
}

class JsonEntity {
    id: number
    data: JsonValue
}

describe("query builder > query deep partial entity", () => {
    it("should not exceed the type instantiation depth with a recursive JSON type (#8559)", () => {
        const entity: QueryDeepPartialEntity<JsonEntity> = {
            data: { a: 1, b: [{ c: null }] },
        }
        const primitive: QueryDeepPartialEntity<JsonEntity> = { data: "text" }

        expect(entity.data).to.deep.equal({ a: 1, b: [{ c: null }] })
        expect(primitive.data).to.equal("text")
    })

    it("should accept values for other self-containing types", () => {
        const nested: QueryDeepPartialEntity<{ nested: Nested }> = {
            nested: { name: "a", children: [{ children: "b" }] },
        }
        const tuple: QueryDeepPartialEntity<{ tuple: Tuple }> = {
            tuple: ["a", ["b", "c"]],
        }

        expect(nested.nested).to.have.nested.property("children[0].children")
        expect(tuple.tuple).to.have.length(2)
    })

    it("should keep the SQL expression function on every level", () => {
        const value: QueryDeepPartialEntity<User> = {
            name: () => "NOW()",
            address: { street: () => "street" },
            photos: [{ url: () => "url", tags: [] }],
        }
        const json: QueryDeepPartialEntity<JsonEntity> = {
            data: { a: () => "1" },
        }

        expect(value.name).to.be.a("function")
        expect(json.data).to.have.property("a")
    })

    it("should keep resolving types without cycles to the same type as before", () => {
        const checks = [
            sameAsLegacy<User>(true),
            sameAsLegacy<Address>(true),
            sameAsLegacy<Photo[]>(true),
            sameAsLegacy<{ a: { b: { c: { d: string[] } } } }>(true),
            sameAsLegacy<{
                a?: { b: string } | null
                c: [string, { d: Date }]
            }>(true),
            sameAsLegacy<any>(true),
            sameAsLegacy<unknown>(true),
            sameAsLegacy<ObjectLiteral>(true),
            sameAsLegacy<Record<string, { a: number[] }>>(true),
            sameAsLegacy<Category>(true),
            sameAsLegacy<{ a: Address; b: Address; c: Address[] }>(true),
        ]

        expect(checks).to.have.lengthOf(11)
    })

    it("should keep objects and SQL expressions partial in arrays that are nested in arrays", () => {
        const nested: QueryDeepPartialEntity<{ items: ArrayTree }> = {
            items: [[{ price: () => "price + 1" }]],
        }
        const readonlyNested: QueryDeepPartialEntity<{
            items: ReadonlyArrayTree
        }> = { items: [[{ price: () => "price + 1" }]] }

        expect(nested.items).to.have.nested.property("[0][0].price")
        expect(readonlyNested.items).to.have.nested.property("[0][0].price")
    })

    it("should keep arrays as declared after they are nested in themselves twice", () => {
        const plain: QueryDeepPartialEntity<{ items: ArrayTree }> = {
            items: [[[{ price: 1 }]]],
        }
        const expression: QueryDeepPartialEntity<{ items: ArrayTree }> = {
            // known limit: the expansion of a self-containing array type ends
            // at the third level, below it SQL expression functions are not
            // accepted
            // @ts-expect-error a function is not assignable to `price`
            items: [[[{ price: () => "price + 1" }]]],
        }

        expect(plain.items).to.have.nested.property("[0][0][0].price", 1)
        expect(expression.items).to.have.lengthOf(1)
    })

    it("should keep entities that contain themselves through objects partial on every level", () => {
        const value: QueryDeepPartialEntity<Category> = {
            children: [{ children: [{ parent: { id: 1 } }] }],
            parent: { parent: { parent: { id: 1 } } },
        }

        expect(value.children).to.have.length(1)
    })

    it("should still reject values of the wrong type", () => {
        const wrong: QueryDeepPartialEntity<User> = {
            // @ts-expect-error a number is not assignable to `street`
            address: { street: 1 },
        }
        const wrongJson: QueryDeepPartialEntity<JsonEntity> = {
            // @ts-expect-error a Date is not a JSON value
            data: new Date(),
        }

        const wrongNested: QueryDeepPartialEntity<JsonEntity> = {
            // @ts-expect-error a Date is not a JSON value, in nested arrays too
            data: [[new Date()]],
        }

        expect(wrong).to.be.an("object")
        expect(wrongJson).to.be.an("object")
        expect(wrongNested).to.be.an("object")
    })
})
