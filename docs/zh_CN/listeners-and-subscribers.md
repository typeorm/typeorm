# 实体监听器和订阅者
- [实体监听器和订阅者](#实体监听器和订阅者)
  - [监听器](#监听器)
    - [`@AfterLoad`](#afterload)
    - [`@BeforeInsert`](#beforeinsert)
    - [`@AfterInsert`](#afterinsert)
    - [`@BeforeUpdate`](#beforeupdate)
    - [`@AfterUpdate`](#afterupdate)
    - [`@BeforeRemove`](#beforeremove)
    - [`@AfterRemove`](#afterremove)
    - [`@BeforeSoftRemove`](#beforesoftremove)
    - [`@AfterSoftRemove`](#aftersoftremove)
    - [`@BeforeRecover`](#beforerecover)
    - [`@AfterRecover`](#afterrecover)
  - [订阅者](#订阅者)

## 监听器

任何实体都可以使用具有侦听特定实体事件的自定义逻辑的方法。
你必须使用特殊装饰器标记这些方法，具体取决于要侦听的事件。

### `@AfterLoad`

你可以在实体中定义具有任何名称的方法，并使用`@AfterLoad`标记它，TypeORM 将在每次实体时调用它
使用`QueryBuilder`或 repository/manager 查找方法加载。
例如：

```typescript
@Entity()
export class Post {
  @AfterLoad()
  updateCounters() {
    if (this.likesCount === undefined) this.likesCount = 0;
  }
}
```

### `@BeforeInsert`

你可以在实体中定义具有任何名称的方法，并使用`@BeforeInsert`标记它，并且 TypeORM 将在使用 repository/manager `save`插入实体之前调用它。
例如：

```typescript
@Entity()
export class Post {
  @BeforeInsert()
  updateDates() {
    this.createdDate = new Date();
  }
}
```

### `@AfterInsert`

你可以在实体中定义具有任何名称的方法，并使用`@AfterInsert`标记它，并且在使用 repository/manager `save`插入实体后，TypeORM 将调用它。

```typescript
@Entity()
export class Post {
  @AfterInsert()
  resetCounters() {
    this.counters = 0;
  }
}
```

### `@BeforeUpdate`

你可以在实体中定义具有任何名称的方法，并使用`@BeforeUpdate`标记它，并且 TypeORM 将在使用 repository/manager `save`更新现有实体之前调用它。 但请记住，只有在模型中更改信息时才会出现这种情况。 如果运行`save`而不修改模型中的任何内容，`@BeforeUpdate`和`@AfterUpdate`将不会运行。
例如：

```typescript
@Entity()
export class Post {
  @BeforeUpdate()
  updateDates() {
    this.updatedDate = new Date();
  }
}
```

### `@AfterUpdate`

你可以在实体中定义具有任何名称的方法，并使用`@AfterUpdate`标记它，并且在使用 repository/manager `save`更新现有实体后，TypeORM 将调用它。
例如：

```typescript
@Entity()
export class Post {
  @AfterUpdate()
  updateCounters() {
    this.counter = 0;
  }
}
```

### `@BeforeRemove`

你可以在实体中定义具有任何名称的方法，并使用`@BeforeRemove`标记它，并且 TypeORM 将在使用 repository/manager `remove`删除实体之前调用它。
例如：

```typescript
@Entity()
export class Post {
  @BeforeRemove()
  updateStatus() {
    this.status = "removed";
  }
}
```

### `@AfterRemove`

你可以在实体中定义一个具有任何名称的方法，并使用`@AfterRemove`标记它，TypeORM 将在使用 repository/manager `remove`删除实体后调用它。
例如：

```typescript
@Entity()
export class Post {
  @AfterRemove()
  updateStatus() {
    this.status = "removed";
  }
}
```

### `@BeforeSoftRemove`

你可以在实体中定义具有任何名称的方法，并使用`@BeforeSoftRemove`标记它，并且 TypeORM 将在使用 repository/manager `softRemove`删除实体之前调用它。
例如：

```typescript
@Entity()
export class Post {
  @BeforeSoftRemove()
  updateStatus() {
    this.status = "soft-removed";
  }
}
```

### `@AfterSoftRemove`

你可以在实体中定义一个具有任何名称的方法，并使用`@AfterSoftRemove`标记它，TypeORM 将在使用 repository/manager `softRemove`删除实体后调用它。
例如：

```typescript
@Entity()
export class Post {
  @AfterSoftRemove()
  updateStatus() {
    this.status = "soft-removed";
  }
}
```

### `@BeforeRecover`

你可以在实体中定义具有任何名称的方法，并使用`@BeforeRecover`标记它，并且 TypeORM 将在使用 repository/manager `recover`删除实体之前调用它。
例如：

```typescript
@Entity()
export class Post {
  @BeforeRecover()
  updateStatus() {
    this.status = "recovered";
  }
}
```

### `@AfterRecover`

你可以在实体中定义一个具有任何名称的方法，并使用`@AfterRecover`标记它，TypeORM 将在使用 repository/manager `recover`删除实体后调用它。
例如：

```typescript
@Entity()
export class Post {
  @AfterRecover()
  updateStatus() {
    this.status = "recovered";
  }
}
```

## 订阅者

将类标记为可以侦听特定实体事件或任何实体事件的事件订阅者。
使用`QueryBuilder`和存储库/管理器方法触发事件。
例如：

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
  /**
   * 表示此订阅者仅侦听Post事件。
   */
  listenTo() {
    return Post;
  }

  /**
   * 插入post之前调用。
   */
  beforeInsert(event: InsertEvent<Post>) {
    console.log(`BEFORE POST INSERTED: `, event.entity);
  }
}
```

你可以从`EntitySubscriberInterface`实现任何方法。
要监听任何实体，你只需省略`listenTo`方法并使用`any`：

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface {
  /**
   * 在实体插入之前调用。
   */
  beforeInsert(event: InsertEvent<any>) {
    console.log(`BEFORE ENTITY INSERTED: `, event.entity);
  }
}
```
