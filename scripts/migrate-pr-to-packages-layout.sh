#!/usr/bin/env bash
#
# Move a pull request branch onto the packages/ layout.
#
# The `typeorm` package moved from the repository root into `packages/typeorm`.
# `src`, `test` and `extra` moved as pure renames, which is what most branches
# touch, so git can usually replay a branch across the move on its own. This
# script runs that rebase with the settings it needs, and offers a fallback for
# branches where the rebase is more trouble than it is worth.
#
# Usage:
#   scripts/migrate-pr-to-packages-layout.sh [--replay] [<upstream-ref>]
#
#   <upstream-ref>  Branch to move onto. Defaults to origin/master.
#   --replay        Skip the rebase. Take the branch's net diff, rewrite the
#                   moved paths, and apply it on top of <upstream-ref> as
#                   uncommitted changes. Use this when the rebase conflicts
#                   badly, or when the branch history is not worth preserving.
#
set -euo pipefail

REPLAY=false
UPSTREAM=""
for arg in "$@"; do
    case "$arg" in
        --replay) REPLAY=true ;;
        -h|--help) sed -n '2,25p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) UPSTREAM="$arg" ;;
    esac
done
UPSTREAM="${UPSTREAM:-origin/master}"

# Top-level paths that moved into packages/typeorm.
MOVED=(
    src test extra
    package.json gulpfile.ts
    tsconfig.json tsconfig.node.json tsconfig.browser.json
    .mocharc.json .c8rc.json stryker.config.json
    ormconfig.sample.json sonar-project.properties eslint.config.mjs
)

die() { echo "error: $*" >&2; exit 1; }

git rev-parse --git-dir >/dev/null 2>&1 || die "not inside a git repository"
git diff --quiet && git diff --cached --quiet || die "working tree is dirty; commit or set aside your changes first"
git rev-parse --verify "$UPSTREAM" >/dev/null 2>&1 || die "cannot resolve '$UPSTREAM'; fetch it first (git fetch origin)"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" != "HEAD" ] || die "detached HEAD; check out your pull request branch first"

MERGE_BASE=$(git merge-base HEAD "$UPSTREAM")

if git cat-file -e "$UPSTREAM:packages/typeorm/package.json" 2>/dev/null; then
    :
else
    die "'$UPSTREAM' does not contain packages/typeorm; fetch the latest master"
fi

if git cat-file -e "$MERGE_BASE:packages/typeorm/package.json" 2>/dev/null; then
    echo "Nothing to do: this branch is already based on the packages/ layout."
    exit 0
fi

echo "Branch:        $BRANCH"
echo "Moving onto:   $UPSTREAM"
echo "Commits ahead: $(git rev-list --count "$MERGE_BASE"..HEAD)"
echo

BACKUP="$BRANCH.pre-packages-layout"
if git rev-parse --verify "$BACKUP" >/dev/null 2>&1; then
    BACKUP="$BACKUP.$(date +%s)"
fi
git branch "$BACKUP"
echo "Saved your current branch as '$BACKUP'."
echo "If anything goes wrong: git rebase --abort; git reset --hard $BACKUP"
echo

if [ "$REPLAY" = false ]; then
    # Rename detection is the whole game here. The move renamed several thousand
    # files at once, which is far above git's default rename limits; without
    # raising them git sees deletes plus adds and every touched file conflicts.
    echo "Rebasing onto $UPSTREAM with rename detection raised..."
    if git -c merge.renameLimit=999999 -c diff.renameLimit=999999 \
           rebase --strategy-option=find-renames "$UPSTREAM"; then
        echo
        echo "Done. Your changes now live under packages/typeorm/."
        echo "Check them with: git diff $UPSTREAM...HEAD --stat"
        exit 0
    fi
    echo
    echo "The rebase stopped on a conflict. Two options:"
    echo "  1. Resolve it as usual, then: git rebase --continue"
    echo "  2. Give up on the history and replay the net change instead:"
    echo "       git rebase --abort"
    echo "       $0 --replay $UPSTREAM"
    exit 1
fi

# Replay mode: take what the branch actually changed, rewrite the paths, and
# apply it on top of the new layout. History is discarded; the net change is not.
echo "Replaying the branch's net change onto $UPSTREAM..."
PATCH=$(mktemp -t typeorm-pr-migrate)
trap 'rm -f "$PATCH"' EXIT
git diff --binary "$MERGE_BASE"..HEAD > "$PATCH"

if [ ! -s "$PATCH" ]; then
    die "this branch changes nothing against $MERGE_BASE"
fi

REWRITE=$(mktemp -t typeorm-pr-rewrite)
trap 'rm -f "$PATCH" "$REWRITE"' EXIT
cp "$PATCH" "$REWRITE"
for path in "${MOVED[@]}"; do
    # Rewrite only the a/ and b/ path prefixes git puts in diff headers, so that
    # file contents mentioning these names are left alone.
    perl -0pi -e "s{^(diff --git )a/\Q$path\E(/|\\b)}{\${1}a/packages/typeorm/$path\$2}gm;
                  s{^(--- )a/\Q$path\E(/|\\b)}{\${1}a/packages/typeorm/$path\$2}gm;
                  s{^(\\+\\+\\+ )b/\Q$path\E(/|\\b)}{\${1}b/packages/typeorm/$path\$2}gm;
                  s{^(diff --git a/\\S+ )b/\Q$path\E(/|\\b)}{\${1}b/packages/typeorm/$path\$2}gm;
                  s{^(rename from )\Q$path\E(/|\\b)}{\${1}packages/typeorm/$path\$2}gm;
                  s{^(rename to )\Q$path\E(/|\\b)}{\${1}packages/typeorm/$path\$2}gm;" "$REWRITE"
done

git checkout -q "$UPSTREAM" -- . 2>/dev/null || true
git reset -q --hard "$UPSTREAM"

if git apply --3way "$REWRITE"; then
    echo
    echo "Applied. Your changes are in the working tree, under packages/typeorm/."
    echo "Review them, then commit:"
    echo "  git status"
    echo "  git commit -am '<your message>'"
    echo
    echo "Your original branch is still at '$BACKUP'."
else
    echo
    echo "The patch did not apply cleanly. Resolve the conflicts git left behind," >&2
    echo "or restore your branch with: git reset --hard $BACKUP" >&2
    exit 1
fi
