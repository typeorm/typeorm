import { Column } from "typeorm"

// Two-arg decorator form: type string as first positional arg, options object
// as second arg — e.g. `@Column('integer', { width: 10, zerofill: true })`.
// Both `width` and `zerofill` must be removed from the options object; the
// positional type string is left untouched.
class Post {
    @Column("integer", { width: 10, zerofill: true })
    postCode: number

    @Column("int", { width: 4, zerofill: false, nullable: true })
    areaCode: number
}
