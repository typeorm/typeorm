import {
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../../../../src"
import { Code } from "./Code"

@Entity()
export class Usage {
    @PrimaryColumn()
    id: number

    @ManyToOne(() => Code)
    @JoinColumn([
        { name: "code_tenant", referencedColumnName: "tenant" },
        { name: "code_value", referencedColumnName: "latest" },
    ])
    code: Code
}
