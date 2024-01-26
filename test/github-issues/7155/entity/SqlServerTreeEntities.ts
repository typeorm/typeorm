import {
    Column,
    Entity,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
} from "../../../../src"

@Entity()
@Tree("closure-table")
export class SqlServerSingleIdClosure {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @TreeChildren()
    children: SqlServerSingleIdClosure[]

    @TreeParent()
    parent: SqlServerSingleIdClosure | null
}

@Entity()
@Tree("nested-set")
export class SqlServerSingleIdNested {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @TreeChildren()
    children: SqlServerSingleIdNested[]

    @TreeParent()
    parent: SqlServerSingleIdNested | null
}

@Entity()
@Tree("materialized-path")
export class SqlServerSingleIdMaterialized {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    name: string

    @TreeChildren()
    children: SqlServerSingleIdMaterialized[]

    @TreeParent()
    parent: SqlServerSingleIdMaterialized | null
}

@Entity()
@Tree("nested-set")
export class SqlServerMultiIdNested {
    @PrimaryColumn()
    column: string

    @PrimaryColumn()
    row: number

    @Column({ nullable: true })
    name: string

    @TreeChildren()
    children: SqlServerMultiIdNested[]

    @TreeParent()
    parent: SqlServerMultiIdNested | null
}

@Entity()
@Tree("materialized-path")
export class SqlServerMultiIdMaterialized {
    @PrimaryColumn()
    column: string

    @PrimaryColumn()
    row: number

    @Column({ nullable: true })
    name: string

    @TreeChildren()
    children: SqlServerMultiIdMaterialized[]

    @TreeParent()
    parent: SqlServerMultiIdMaterialized | null
}
