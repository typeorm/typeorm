import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Tree,
    TreeChildren,
    TreeParent,
    UpdateDateColumn
} from "@typeorm/core";

@Entity()
@Tree("closure-table")
export class File {
    @PrimaryGeneratedColumn() id: number;

    @Column("text", {
        nullable: false,
        name: "name"
    })
    name: string;

    @Column("integer", {
        nullable: true
    })
    parentId: number;

    @TreeParent() parent: File;

    @TreeChildren() children: File[];

    @Column("timestamp with time zone")
    @CreateDateColumn()
    created: Date;

    @Column("timestamp with time zone")
    @UpdateDateColumn()
    modified: Date;
}
