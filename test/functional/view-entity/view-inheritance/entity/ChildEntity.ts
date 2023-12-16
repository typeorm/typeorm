import { ChildEntity, Column, ViewEntity } from "../../../../../src"
import { VersionedRootEntity } from "./RootEntity"

@ChildEntity("ChildEntity")
export class VersionedChilddEntity extends VersionedRootEntity {
    @Column()
    additionalField: string
}

// Typically here, a filtered view of versioned root entity -- for example, only latest versions
@ViewEntity({
    expression: `
        select * from versioned_childd_entity;
    `,
})
export class ChilddEntity extends VersionedChilddEntity {}
