# 使用 Validation

要使用验证，请使用[class-validator](https://github.com/pleerock/class-validator)。
示例如何在 TypeORM 中使用 class-validator：

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { Contains, IsInt, Length, IsEmail, IsFQDN, IsDate, Min, Max } from "class-validator";

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Length(10, 20)
  title: string;

  @Column()
  @Contains("hello")
  text: string;

  @Column()
  @IsInt()
  @Min(0)
  @Max(10)
  rating: number;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  @IsFQDN()
  site: string;

  @Column()
  @IsDate()
  createDate: Date;
}
```

验证:

```typescript
import { getManager } from "typeorm";
import { validate } from "class-validator";

let post = new Post();
post.title = "Hello"; // 不应该通过
post.text = "this is a great post about hell world"; //不应该通过
post.rating = 11; //不应该通过
post.email = "google.com"; //不应该通过
post.site = "googlecom"; //不应该通过

const errors = await validate(post);
if (errors.length > 0) {
  throw new Error(`Validation failed!`);
} else {
  await getManager().save(post);
}
```
