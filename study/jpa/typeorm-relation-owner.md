# 연관관계 주인과 1:N 매핑 (JPA vs TypeORM)

## 개요

JPA에서 1:N 단방향은 `@JoinColumn` 유무에 따라 **외래키 방식** 또는 **조인 테이블 방식**이 결정된다.
TypeORM은 1:N 단방향 자체를 지원하지 않으며, 반드시 N쪽에 `@ManyToOne`을 선언해야 한다.

---

## 1. JPA의 1:N 단방향 — 두 가지 동작

### `@JoinColumn` 없이 — 조인 테이블 생성

```java
@Entity
public class Team {
    @OneToMany
    private List<Member> members;
}
// → team_members(team_id, members_id) 조인 테이블 자동 생성
```

### `@JoinColumn` 있으면 — N 테이블에 외래키

```java
@Entity
public class Team {
    @OneToMany
    @JoinColumn(name = "team_id")
    private List<Member> members;
}
// → member.team_id 외래키 사용 (조인 테이블 없음)
```

1:N 단방향에서 `@JoinColumn`을 붙이면 1쪽(Team)이 연관관계의 주인이 되어 N쪽(Member) 테이블의 외래키를 관리한다. 이 경우 Member 엔티티에는 Team에 대한 참조가 없으므로, INSERT 후 별도 UPDATE로 외래키를 설정하는 비효율이 발생한다.

### 실전 패턴: cascade + orphanRemoval

```java
@Entity
public class Article {
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "article_id")
    private List<Image> images = new ArrayList<>();
}

@Entity
public class Image {
    // Article에 대한 참조 없음 — 단방향
}
```

- Image 테이블에 `article_id` 외래키가 생김
- Image **엔티티**에는 Article 참조가 없음 (단방향)
- `cascade = ALL` — Article 저장/삭제 시 Image도 함께 처리
- `orphanRemoval = true` — 컬렉션에서 제거된 Image는 자동 DELETE

```java
article.getImages().remove(0);   // 컬렉션에서 제거
// → flush 시 해당 Image가 DB에서 DELETE됨
```

---

## 2. TypeORM: 1:N 단방향 불가능

### `@OneToMany`의 `inverseSide`가 필수

`src/decorator/relations/OneToMany.ts`:

```typescript
export function OneToMany<T>(
    typeFunctionOrTarget: ...,
    inverseSide: string | ((object: T) => any),   // ← 필수 파라미터
    options?: RelationOptions,
)
```

`@ManyToOne`의 `inverseSide`는 선택적:

```typescript
export function ManyToOne<T>(
    typeFunctionOrTarget: ...,
    inverseSide?: string | ((object: T) => any),  // ← 선택적 파라미터
    options?: RelationOptions,
)
```

`@OneToMany`는 반드시 반대편 `@ManyToOne`을 가리키는 `inverseSide`를 명시해야 한다.
단방향 `@OneToMany`가 **문법적으로 불가능**하다.

### 소스 코드의 JSDoc이 명시하는 규칙

`src/decorator/relations/OneToMany.ts:8-9`:

> Entity2 is the owner of the relationship, and stores the id of Entity1 on its side of the relation.

**N쪽(`@ManyToOne`)이 항상 연관관계의 주인**이다.

---

## 3. 연관관계 주인(owner) 결정 로직

`src/metadata/RelationMetadata.ts:600-608`:

```typescript
registerJoinColumns(joinColumns, inverseJoinColumns) {
    this.isOwning =
        this.isManyToOne ||                            // ManyToOne → 항상 owner
        ((this.isManyToMany || this.isOneToOne) &&     // ManyToMany, OneToOne →
            this.joinColumns.length > 0)               //   @JoinColumn이 있으면 owner

    this.isOneToOneOwner = this.isOneToOne && this.isOwning
    this.isWithJoinColumn = this.isManyToOne || this.isOneToOneOwner
}
```

| 관계 타입     | owner 조건              |
| ------------- | ----------------------- |
| `@ManyToOne`  | **항상 owner**          |
| `@OneToMany`  | **절대 owner 아님**     |
| `@OneToOne`   | `@JoinColumn`이 있는 쪽 |
| `@ManyToMany` | `@JoinColumn`이 있는 쪽 |

`@OneToMany`는 `isOwning` 조건에 포함되지 않으므로, 어떤 경우에도 owner가 될 수 없다.

---

## 4. TypeORM에서 1:N을 선언하는 방법

### 양방향 (일반적인 방법)

```typescript
// N쪽 — owner, 외래키 보유
@Entity()
class Member {
    @ManyToOne(() => Team, (team) => team.members)
    team: Team // member.teamId 외래키 자동 생성
}

// 1쪽 — inverse side, 외래키 없음
@Entity()
class Team {
    @OneToMany(() => Member, (member) => member.team)
    members: Member[] // 외래키 없음, member.team을 참조할 뿐
}
```

### N:1 단방향 (`@ManyToOne`만 사용)

```typescript
// ManyToOne만 단방향으로 사용 — OK
@Entity()
class Member {
    @ManyToOne(() => Team)
    team: Team // member.teamId 외래키 생성
}

// Team에는 아무 관계 선언 없음
@Entity()
class Team {
    // members 필드 없음 — Member 쪽에서만 참조
}
```

`@ManyToOne`은 `inverseSide`가 선택적이므로 단방향으로 사용할 수 있다.

---

## 5. JPA의 Article-Image 패턴을 TypeORM으로

JPA에서는 1:N 단방향 + cascade + orphanRemoval로 깔끔하게 처리했지만,
TypeORM에서는 양방향으로 만들어야 한다.

```typescript
@Entity()
class Article {
    @OneToMany(() => Image, (image) => image.article, {
        cascade: true,
    })
    images: Image[]
}

@Entity()
class Image {
    @ManyToOne(() => Article, (article) => article.images, {
        onDelete: "CASCADE",
        orphanedRowAction: "delete", // ← JPA orphanRemoval = true에 대응
    })
    article: Article // ← JPA 버전에는 없지만 TypeORM에서는 필수
}
```

### cascade 비교

| JPA `CascadeType` | TypeORM `cascade` 옵션 | 설명                                           |
| ----------------- | ---------------------- | ---------------------------------------------- |
| `PERSIST`         | `cascade: ["insert"]`  | 부모 저장 시 자식도 INSERT                     |
| `MERGE`           | `cascade: ["update"]`  | 부모 저장 시 자식도 UPDATE                     |
| `REMOVE`          | `cascade: ["remove"]`  | 부모 삭제 시 자식도 DELETE                     |
| `ALL`             | `cascade: true`        | 모든 작업 전파                                 |
| —                 | `onDelete: "CASCADE"`  | DB 레벨 FK CASCADE (JPA의 cascade와 다른 계층) |

### orphanRemoval — TypeORM의 `orphanedRowAction`

#### JPA: `orphanRemoval = true`

```java
// JPA — 컬렉션에서 제거하면 자동 DELETE
article.getImages().remove(0);
// flush 시 → DELETE FROM image WHERE id = ?
```

영속성 컨텍스트가 컬렉션의 변경사항을 추적하여, flush 시점에 반영한다.

#### TypeORM: `orphanedRowAction`

`@ManyToOne` 쪽(N쪽)에 선언하는 `RelationOptions`:

```typescript
orphanedRowAction?: "nullify" | "delete" | "soft-delete" | "disable"
```

| 값              | 동작                                             |
| --------------- | ------------------------------------------------ |
| `"nullify"`     | FK를 `null`로 설정 (기본값)                      |
| `"delete"`      | DB에서 row 삭제 — **JPA `orphanRemoval = true`** |
| `"soft-delete"` | soft delete 처리                                 |
| `"disable"`     | 아무것도 안 함, relation 유지                    |

```typescript
// TypeORM — orphanedRowAction: "delete" 사용 시
article.images = article.images.filter((img) => img.id !== removeTargetId)
await manager.save(article)
// → DB의 기존 images와 비교 → 빠진 image를 DELETE
```

#### 메커니즘 차이

JPA는 영속성 컨텍스트가 컬렉션 변경을 추적하지만,
TypeORM은 `save()` 시점에 **DB에서 현재 자식 목록을 조회**하고, **전달된 컬렉션과 비교**하여 차이분을 처리한다.

`OneToManySubjectBuilder.ts`의 동작:

1. DB에서 부모에 연결된 자식의 relation ID 목록 조회
2. `save()`로 전달된 자식의 relation ID 목록 수집
3. `EntityMetadata.difference()`로 **DB에는 있지만 전달된 목록에는 없는 것** = orphan 식별
4. `relation.inverseRelation.orphanedRowAction`에 따라 처리

`@ManyToOne` 쪽에 선언하지만, 실제 처리 로직은 `OneToManySubjectBuilder`가 `@OneToMany` relation을 순회하면서
그 **inverse relation(`@ManyToOne`)의 `orphanedRowAction`** 을 참조하는 구조다.

#### 주의: `orphanedRowAction` 기본값은 `"nullify"`

`RelationMetadata.ts:337`:

```typescript
this.orphanedRowAction = args.options.orphanedRowAction || "nullify"
```

명시적으로 `"delete"`를 지정하지 않으면 FK를 `null`로 설정할 뿐 row를 삭제하지 않는다.
`orphanedRowAction: "disable"`를 지정하면 orphan 비교 자체를 건너뛴다.

#### 주의: `@OneToMany`에 설정하면 silent failure

`orphanedRowAction`은 공용 `RelationOptions`에 정의되어 있어서
`@OneToMany`에도 타입 에러 없이 설정할 수 있다. **하지만 런타임에서 무시된다.**

```typescript
// ✗ 작동하지 않음 — @OneToMany에 설정
@OneToMany(() => Image, (image) => image.article, {
    cascade: true,
    orphanedRowAction: "delete", // ← 무시됨!
})
images: Image[]
```

```typescript
// ✓ 올바른 설정 — @ManyToOne에 설정
@ManyToOne(() => Article, (article) => article.images, {
    orphanedRowAction: "delete", // ← 여기에 설정해야 동작
})
article: Article
```

`OneToManySubjectBuilder`가 항상 `relation.inverseRelation.orphanedRowAction`으로 읽기 때문이다.
`@OneToMany`의 `orphanedRowAction`을 읽는 코드는 TypeORM 어디에도 없다.

JPA의 `orphanRemoval`은 `@OneToMany`에 설정하고, TypeORM의 `cascade`도 보통 `@OneToMany`에 설정하므로
`orphanedRowAction`도 같은 쪽에 둘 거라고 기대하기 쉽지만, 실제로는 `@ManyToOne`에만 유효하다.
타입은 허용하는데 런타임은 무시하는 전형적인 silent failure 패턴이므로 주의가 필요하다.

관련 이슈: [typeorm/typeorm#12033](https://github.com/typeorm/typeorm/issues/12033)

### Cascade Remove vs Orphan Remove

두 개념 모두 자식 엔티티를 삭제하지만, **트리거 조건**이 다르다.

|               | Cascade Remove                                              | Orphan Remove                 |
| ------------- | ----------------------------------------------------------- | ----------------------------- |
| **동작 시점** | 부모가 삭제될 때                                            | 컬렉션에서 자식이 빠질 때     |
| **부모 상태** | 삭제됨                                                      | 살아있음                      |
| **의미**      | "부모가 죽으면 자식도 죽는다"                               | "부모에게 버림받으면 죽는다"  |
| **JPA**       | `CascadeType.REMOVE`                                        | `orphanRemoval = true`        |
| **TypeORM**   | `cascade: ["remove"]` (ORM) / `onDelete: "CASCADE"` (DB FK) | `orphanedRowAction: "delete"` |

```java
// Cascade Remove — 부모 자체를 삭제하면 자식도 함께 삭제
em.remove(article);  // → Article DELETE + 모든 Image DELETE

// Orphan Remove — 부모는 유지, 컬렉션에서 빠진 자식만 삭제
article.getImages().remove(0);  // → 해당 Image만 DELETE
em.flush();
```

Cascade Remove만 설정하면 `article.getImages().remove(0)`을 해도 Image는 삭제되지 않는다.
Orphan Remove만 설정하면 `em.remove(article)`로 Article을 삭제할 때 자식 Image가 함께 삭제되지 않는다.
따라서 실전에서는 `cascade = ALL, orphanRemoval = true`를 함께 사용하는 것이 일반적이다.

---

## 6. JPA의 `mappedBy` vs TypeORM의 `inverseSide`

```java
// JPA — mappedBy를 inverse side에만 붙임
@OneToMany(mappedBy = "team")        // "나는 owner가 아니다, team 필드가 owner다"
private List<Member> members;
```

```typescript
// TypeORM — 양쪽 모두 상대방을 가리킴
@OneToMany(() => Member, (member) => member.team)   // member.team이 owner
members: Member[]

@ManyToOne(() => Team, (team) => team.members)      // 나(team 필드)가 owner
team: Team
```

JPA는 `mappedBy`를 **inverse side에만** 붙이지만, TypeORM은 **양쪽 모두** `inverseSide`를 명시한다.

---

## 비교 요약

|                          | JPA                                     | TypeORM                                                     |
| ------------------------ | --------------------------------------- | ----------------------------------------------------------- |
| **1:N 단방향 (1쪽에만)** | 가능 — `@JoinColumn` 없으면 조인 테이블 | **불가능** — `inverseSide` 필수                             |
| **N:1 단방향 (N쪽에만)** | 가능                                    | 가능 — `@ManyToOne`만 사용                                  |
| **1:N 양방향**           | `@OneToMany(mappedBy)` + `@ManyToOne`   | `@OneToMany(inverseSide)` + `@ManyToOne(inverseSide)`       |
| **연관관계 주인 결정**   | `mappedBy`가 없는 쪽                    | **항상 `@ManyToOne` (N쪽)** — 코드로 고정                   |
| **1쪽이 owner**          | 가능 (`@OneToMany` + `@JoinColumn`)     | 불가능                                                      |
| **조인 테이블 (1:N)**    | `@OneToMany` 단방향 시 기본 동작        | 없음 — M:N에서만 사용                                       |
| **cascade**              | `CascadeType.ALL` 등                    | `cascade: true` 또는 배열로 지정                            |
| **orphanRemoval**        | `orphanRemoval = true`                  | `orphanedRowAction: "delete"` (`@ManyToOne`에 선언)         |
| **owner 판별 코드**      | 런타임 파싱 (`mappedBy` 속성)           | `RelationMetadata.isOwning` (`isManyToOne`이면 무조건 true) |

---

## 관련 소스 파일

| 파일                                                         | 역할                                         |
| ------------------------------------------------------------ | -------------------------------------------- |
| `src/decorator/relations/OneToMany.ts`                       | `@OneToMany` — `inverseSide` 필수 파라미터   |
| `src/decorator/relations/ManyToOne.ts`                       | `@ManyToOne` — `inverseSide` 선택적 파라미터 |
| `src/metadata/RelationMetadata.ts:600`                       | `registerJoinColumns()` — owner 결정 로직    |
| `src/metadata-args/RelationMetadataArgs.ts`                  | 관계 메타데이터 인터페이스                   |
| `src/persistence/subject-builder/OneToManySubjectBuilder.ts` | orphanedRowAction 처리 로직                  |
| `src/decorator/options/RelationOptions.ts`                   | `orphanedRowAction` 옵션 정의                |
