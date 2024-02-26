import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    TableInheritance,
    ViewEntity,
    ViewColumn
} from "../../../../../src"

@Entity()
@TableInheritance({ pattern: "STI", column: "type" })
export class VersionedRootEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar")
    type: string
}

// Typically here, a filtered view of versioned root entity -- for example, only latest versions
@ViewEntity({
    expression: `
        select * from versioned_root_entity;
    `,
})
export class RootEntity extends VersionedRootEntity {}


// Here a non filtered view of root entity with an additional field
@ViewEntity({
    expression: `
        select *, 'thisisAnOtherField' as "otherField" from versioned_root_entity;
    `,
})
export class EnrichedRootEntity extends VersionedRootEntity {
    @ViewColumn()
    otherField:string;
}


