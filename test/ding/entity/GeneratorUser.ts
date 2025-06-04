import { BaseEntity, Column, Entity, Generated } from "../../../src"

import { v4 as uuidv4 } from "uuid"

@Entity({ comment: "用户表" })
export class UserGenerator extends BaseEntity {
    // 生成器可传入函数，实现任意的唯一id生成逻辑
  @Column({ type: String, length: 36, primary: true, comment: "用户ID" })
  @Generated((row) => {
    console.log(row)
    return uuidv4()
  })
  id: string

  @Column({ type: String, length: 80, comment: "用户名" })
  name: string

  @Column({ type: "simple-json", comment: "JSON数据", nullable: true })
  json: Record<string, any> | null

  @Column({
    type: "bool",
    comment: "是否在职",
    nullable: true,
    default: false,
  })
  onJob: boolean
}
