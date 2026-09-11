# Moving a pull request onto the packages/ layout

The `typeorm` package moved out of the repository root and into
`packages/typeorm`. If your pull request was opened before that change, its
files no longer exist where it expects them.

Everything moved as a pure rename, with no change to file contents. Git records
those renames at 100% similarity, so in most cases it can replay your branch
across the move without your help.

## What moved

| Before                                            | After                             |
| ------------------------------------------------- | --------------------------------- |
| `src/`                                            | `packages/typeorm/src/`           |
| `test/`                                           | `packages/typeorm/test/`          |
| `extra/`                                          | `packages/typeorm/extra/`         |
| `package.json`                                    | `packages/typeorm/package.json`   |
| `gulpfile.ts`                                     | `packages/typeorm/gulpfile.ts`    |
| `tsconfig*.json`                                  | `packages/typeorm/tsconfig*.json` |
| `.mocharc.json`, `.c8rc.json`                     | `packages/typeorm/`               |
| `stryker.config.json`, `sonar-project.properties` | `packages/typeorm/`               |
| `ormconfig.sample.json`                           | `packages/typeorm/`               |
| `eslint.config.mjs`                               | `packages/typeorm/`               |

The repository root keeps `docs/`, `docker/`, `docker-compose.yml`,
`resources/`, the markdown files and the shared tooling config. A new root
`package.json` holds the workspace and delegates `compile`, `package`, `test`
and `typecheck` to `packages/typeorm`.

Import paths inside the package are unaffected, because `src` and `test` moved
together and kept their relative positions.

## Option 1: the script

```shell
git fetch origin
scripts/migrate-pr-to-packages-layout.sh
```

It saves your branch first, then rebases onto `origin/master` with git's rename
limits raised. Pass a different base as an argument if you need one.

If the rebase conflicts badly and the branch history is not worth keeping:

```shell
git rebase --abort
scripts/migrate-pr-to-packages-layout.sh --replay
```

Replay mode takes what your branch actually changed, rewrites the moved paths,
and leaves the result in your working tree for you to review and commit.

## Option 2: by hand

The only thing the plain rebase needs is a rename limit high enough for a move
of this size. Git's default is well below the number of files that moved, and
without raising it git sees deletes and adds rather than renames, which turns
every touched file into a conflict.

```shell
git fetch origin
git -c merge.renameLimit=999999 -c diff.renameLimit=999999 rebase origin/master
```

## Option 3: hand it to a coding agent

Paste this into an agent working in your checkout:

```text
The typeorm repository moved the `typeorm` package from the repository root
into `packages/typeorm`. My branch predates that move and needs to be rebased
onto it.

These top-level paths moved into `packages/typeorm/`, as pure renames with no
change to file contents: src, test, extra, package.json, gulpfile.ts,
tsconfig.json, tsconfig.node.json, tsconfig.browser.json, .mocharc.json,
.c8rc.json, stryker.config.json, ormconfig.sample.json,
sonar-project.properties, eslint.config.mjs.

Please:
1. Confirm the working tree is clean, and create a backup branch first.
2. Run `git fetch origin`.
3. Rebase my branch onto origin/master. Because several thousand files were
   renamed in one commit, raise git's rename limits or the rebase will report
   conflicts on every file I touched:
   git -c merge.renameLimit=999999 -c diff.renameLimit=999999 rebase origin/master
4. If conflicts remain, resolve them by applying my change to the file at its
   new path under packages/typeorm/. Do not reintroduce any file at an old
   top-level path such as src/ or test/.
5. When the rebase finishes, show me `git diff origin/master...HEAD --stat` and
   confirm every path in it starts with packages/typeorm/ (or is a file I
   deliberately changed outside the package).
6. Do not force push. Show me the result and let me decide.
```

## Checking the result

Every path in your diff should now sit under `packages/typeorm/`:

```shell
git diff origin/master...HEAD --stat
```

Then reinstall and run the checks from the repository root:

```shell
pnpm install
pnpm run package
pnpm run lint
```
