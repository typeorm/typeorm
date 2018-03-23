# Entity Listeners and Subscribers

* [What is an Entity Listener](#what-is-an-entity-listener)
    * [`@AfterLoad`](#afterload)
    * [`@BeforeInsert`](#beforeinsert)
    * [`@AfterInsert`](#afterinsert)
    * [`@BeforeUpdate`](#beforeupdate)
    * [`@AfterUpdate`](#afterupdate)
    * [`@BeforeRemove`](#beforeremove)
    * [`@AfterRemove`](#afterremove)
* [What is a Subscriber](#what-is-a-subscriber)

## What is an Entity Listener

Any of your entities can have methods with custom logic that listen to specific entity events.
You must mark those methods with special decorators depending on what event you want to listen to.

### `@AfterLoad`

You can define a method with any name in entity and mark it with `@AfterLoad`
and TypeORM will call it each time the entity 
is loaded using `QueryBuilder` or repository/manager find methods.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterLoad()
    updateCounters() {
        if (this.likesCount === undefined)
            this.likesCount = 0;
    }
}
```

### `@BeforeInsert`

You can define a method with any name in entity and mark it with `@BeforeInsert`
and TypeORM will call it before the entity is inserted using repository/manager `save`.
Example:

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

You can define a method with any name in entity and mark it with `@AfterInsert`
and TypeORM will call it after the entity is inserted using repository/manager `save`.
Example:

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

You can define a method with any name in the entity and mark it with `@BeforeUpdate`
and TypeORM will call it before an existing entity is updated using repository/manager `save`. Keep in mind, however, that this will occur only when information is changed in the model. If you run `save` without modifying anything from the model, `@BeforeUpdate` and `@AfterUpdate` will not run.
Example:

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

You can define a method with any name in the entity and mark it with `@AfterUpdate`
and TypeORM will call it after an existing entity is updated using repository/manager `save`.
Example:

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

You can define a method with any name in the entity and mark it with `@BeforeRemove`
and TypeORM will call it before a entity is removed using repository/manager `remove`.
Example:

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

You can define a method with any name in the entity and mark it with `@AfterRemove`
and TypeORM will call it after the entity is removed using repository/manager `remove`.
Example:

```typescript
@Entity()
export class Post {
    
    @AfterRemove()
    updateStatus() {
        this.status = "removed";
    }
}
```

## What is a Subscriber

Marks a class as an event subscriber which can listen to specific entity events or any entity events.
Events are firing using `QueryBuilder` and repository/manager methods.
Example:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {

    
    /**
     * Indicates that this subscriber only listen to Post events.
     */
    listenTo() {
        return Post;
    }
    
    /**
     * Called before post insertion.
     */
    beforeInsert(event: InsertEvent<Post>) {
        console.log(`BEFORE POST INSERTED: `, event.entity);
    }

}
```

You can implement any method from `EntitySubscriberInterface`.
To listen to any entity you just omit `listenTo` method and use `any`:

```typescript
@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface {
    
    /**
     * Called before entity insertion.
     */
    beforeInsert(event: InsertEvent<any>) {
        console.log(`BEFORE ENTITY INSERTED: `, event.entity);
    }

}
```
