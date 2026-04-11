import { Column } from "typeorm"

class Post {
    @Column({ type: "int", width: 9, zerofill: true })
    postCode: number
}

// Should NOT be transformed — not a @Column decorator
const imageSize = { width: 800, height: 600 }
const progressBar = { width: 40, label: "loading" }
