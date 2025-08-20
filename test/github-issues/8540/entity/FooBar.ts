import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"

@Entity()
export class Foo {
    @PrimaryColumn()
    public id!: string

    @OneToMany((type) => FooBar, (foobar) => foobar.foo)
    public foobars!: Promise<FooBar>
}

@Entity()
export class Bar {
    @PrimaryColumn()
    public id!: string

    @OneToMany((type) => FooBar, (foobar) => foobar.bar)
    public foobars!: Promise<FooBar>
}

@Entity()
export class FooBar {
    @PrimaryColumn()
    public fooId!: string

    @PrimaryColumn()
    public barId!: string

    @ManyToOne((type) => Foo, (foo) => foo.foobars)
    public foo!: Promise<Foo>

    @ManyToOne((type) => Bar, (bar) => bar.foobars)
    public bar!: Promise<Bar>

    @Column()
    public whatever!: string
}
