import { expect } from "chai"
import "../../utils/test-setup"
import { Item } from "./entity/item.entity"

describe("github issues > #9150 DeepPartial update breaks Active Record create/merge", () => {
    it("should create Item from a partial Item", async () => {
        const input: Pick<Item, "value"> = { value: 42 }
        const item = Item.create(input)
        expect(item).deep.equals(input)
    })

    it("should merge Item with a partial Item", async () => {
        const input: Pick<Item, "value"> = { value: 42 }
        const item = Item.create()
        const merge = Item.merge(item, input)
        expect(merge).deep.equals(input)
    })
})
