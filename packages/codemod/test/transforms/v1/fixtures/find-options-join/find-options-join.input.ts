import { DataSource } from "typeorm"

// Case 1: leftJoinAndSelect → should get TODO (migrates to relations)
const a = await repository.find({
    join: {
        alias: "post",
        leftJoinAndSelect: {
            categories: "post.categories",
            author: "post.author",
        },
    },
})

// Case 2: innerJoinAndSelect with lock → should get TODO (migrates to QueryBuilder)
const b = await repository.findOne({
    join: {
        alias: "post",
        innerJoinAndSelect: {
            categories: "post.categories",
        },
    },
    lock: { mode: "pessimistic_write", tables: ["category"] },
})

// Case 3: unrelated object with a `join` key that is NOT a find-options join
// (no `alias` sibling property) — should NOT get TODO
const c = processOptions({
    join: { separator: "," },
})

// Case 4: string-literal key — should still be detected via `getStringValue`.
// The trailing `;` below exists because jscodeshift/recast emits it when the
// block is reprinted, and `prettier-ignore` stops Prettier from stripping it.
// prettier-ignore
const d = await repository.find({
    "join": {
        "alias": "post",
        "leftJoinAndSelect": { categories: "post.categories" },
    },
});
