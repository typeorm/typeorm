import { PrimaryGeneratedColumn } from "typeorm"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity({
    name: "real_long_name_t2",
})
export class AnotherReallyLongNameForAnEntityBecauseThisIsNecessaryB {
    @PrimaryGeneratedColumn()
    id: number
}

@Entity({
    name: "real_long_name_t3",
})
export class AnotherRealLongNameForAnEntityBecauseThisIsNecessaryC {
    @PrimaryGeneratedColumn()
    id: number
}
