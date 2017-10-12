# Find Options

All repository and manager `find` methods accept special options you can use to query data you need without using `QueryBuilder`:

* `select` - indicates which properties of the main object must be selected

```typescript
userRepository.find({ select: ["firstName", "lastName"] });
```

* `relations` - relations needs to be loaded with the main entity.

```typescript
userRepository.find({ relations: ["profile", "photos", "videos"] });
```

* `join` - joins needs to be performed for the entity. Extended version of "relations".

```typescript
userRepository.find({ 
    join: {
        alias: "user",
        leftJoinAndSelect: {
            "profile": "user.profile",
            "photo": "user.photos",
            "video": "user.videos"
        }
    }
});
```

* `where` - simple conditions by which entity should be queried.

```typescript
userRepository.find({ where: { firstName: "Timber", lastName: "Saw" } });
```

* `order` - selection order.

```typescript
userRepository.find({ 
    order: {
        "name": "ASC",
        "id": "DESC"
    }
});
```
```typescript
// or use array
userRepository.find({ 
    order: [["name", "ASC"], ["id", "DESC"]]
});
```

`find` methods which return multiple entities (`find`, `findAndCount`, `findByIds`) also accept following options:

* `skip` - offset (paginated) from where entities should be taken.

```typescript
userRepository.find({ 
    skip: 5
});
```

* `take` - limit (paginated) - max number of entities that should be taken.

```typescript
userRepository.find({ 
    take: 10
});
```

Complete example of find options:

```typescript
userRepository.find({ 
    select: ["firstName", "lastName"],
    relations: ["profile", "photos", "videos"],
    where: { 
        firstName: "Timber", 
        lastName: "Saw" 
    },
    order: {
        "name": "ASC",
        "id": "DESC"
    },
    skip: 5,
    take: 10
});
```