# Contributing to TypeORM

We would love for you to contribute to TypeORM and help make it even better than it is today!
As a contributor, here are the guidelines we would like you to follow:

- [Question or Problem?](#question)
- [Issues and Bugs](#issue)
- [Feature Requests](#feature)
- [Submission Guidelines](#submit)
- [Contributing to Documentation](#submit-docs)
- [Commit Message Format](#commit)

## <a name="question"></a> Got a Question or Problem?

If you have a question or want community support:

- You can create a question on [StackOverflow](https://stackoverflow.com/questions/tagged/typeorm) where the questions should be tagged with tag `typeorm`.
- You can ask on [Discord](https://discord.gg/cC9hkmUgNa)

## <a name="issue"></a> Found a security vulnerability?

If you find a security vulnerability or something that should be discussed privately, please contact us at [maintainers@typeorm.io](mailto:maintainers@typeorm.io).

## <a name="issue"></a> Found a Bug?

If you find a bug in the source code, you can help us by [submitting an issue](#submit-issue) to our
[GitHub Repository](https://github.com/typeorm/typeorm).
Even better, you can [submit a Pull Request](#submit-pr) with a fix.

## <a name="feature"></a> Missing a Feature?

You can _request_ a new feature by [submitting an issue](#submit-issue) to our GitHub
Repository. If you would like to _implement_ a new feature, please submit an issue with
a proposal for your work first, to be sure that we can use it.
Please consider what kind of change it is:

- For a **Major Feature**, first open an issue and outline your proposal so that it can be
  discussed. This will also allow us to better coordinate our efforts, prevent duplication of work,
  and help you to craft the change so that it is successfully accepted into the project.
- **Small Features** can be crafted and directly [submitted as a Pull Request](#submit-pr).

## <a name="submit"></a> Submission Guidelines

### <a name="submit-issue"></a> Submitting an Issue

Before you submit an issue, please search the issue tracker,
maybe an issue for your problem already exists and the discussion might inform you of workarounds readily available.

We want to fix all the issues as soon as possible, but before fixing a bug we need to reproduce and confirm it.
In order to reproduce bugs we ask you to provide a minimal code snippet that shows a reproduction of the problem.

You can file new issues by filling out our [new issue form](https://github.com/typeorm/typeorm/issues/new).

### <a name="submit-pr"></a> Submitting a Pull Request (PR)

Before you submit your Pull Request (PR) consider the following guidelines:

- Search [GitHub](https://github.com/typeorm/typeorm/pulls) for an open or closed PR
  that relates to your submission. You don't want to duplicate effort.
- Make your changes in a new git branch:

    ```shell
    git checkout -b my-fix-branch master
    ```

- Create your patch, **including appropriate test cases**. Without tests your PR will not be accepted.
- Run the full TypeORM test suite, as described in the [developer documentation](DEVELOPER.md), and ensure that all tests pass.
- Commit your changes using descriptive commit messages. See our [commit message conventions](#commit)

    ```shell
    git commit -a
    ```

    Note: the optional commit -a command line option will automatically "add" and "rm" edited files.

- Push your branch to GitHub:

    ```shell
    git push origin my-fix-branch
    ```

- In GitHub, send a pull request to `typeorm:master` and include a description following the template.
- Changes can be added as new commits to the same branch, which will update your pull request.

That's it! Thank you for your contribution!

### <a name="submit-docs"></a> Contributing to Documentation

TypeORM documentation is built using [Docusaurus](https://docusaurus.io/) and is located in the `docs/` directory.

#### Documentation Structure

The documentation uses versioning to maintain multiple versions:

- **`docs/docs/`** - Contains the in-development documentation (labeled as **"next"**)
    - This is where you should make changes for new features or updates
    - Changes here will appear in the "next" version of the docs
- **`docs/versioned_docs/version-v0.3/`** - Contains the stable snapshot for v0.3 (labeled as **"v0.3 (stable)"**)
    - This is a snapshot and should not be edited directly
    - Only maintainers create new version snapshots when releasing stable versions

#### Making Documentation Changes

1. Navigate to the `docs/` directory:

    ```shell
    cd docs
    ```

2. Make your changes to files in `docs/docs/` (the "next" version)

3. Test your changes locally:

    ```shell
    npm install
    npm run start
    ```

    This will start a local development server where you can preview your changes.

4. Build the documentation to ensure there are no errors:

    ```shell
    npm run build
    ```

5. Commit your changes and submit a pull request following the same guidelines as code contributions.

#### Documentation Versioning

- The **"next"** version (`docs/docs/`) represents the in-development documentation and is the default version shown at `/docs`
- Stable versions (e.g., **"v0.3 (stable)"**) are snapshots created when releasing a new version
- Users can switch between versions using the version dropdown in the documentation navbar
- When contributing, always edit the **"next"** version unless you're specifically updating a stable version snapshot (which should be rare and typically done by maintainers)

For more details about the documentation setup, see [`docs/README.md`](docs/README.md).

#### After your pull request is merged

After your pull request is merged, you can safely delete your branch and pull the changes
from the main (upstream) repository:

- Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows:

    ```shell
    git push origin --delete my-fix-branch
    ```

- Check out the master branch:

    ```shell
    git checkout master -f
    ```

- Delete the local branch:

    ```shell
    git branch -D my-fix-branch
    ```

- Update your master with the latest upstream version:

    ```shell
    git pull --ff upstream master
    ```

## <a name="commit"></a> Commit Message Guidelines

We follow the format below to help generate changelogs and keep commit history readable.
We will squash and merge commits into a single commit when merging a PR to follow this convention.

If you're contributing to the project, we recommend following the same guidelines.

```
<type>: <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Any line of the commit message should not be longer than 100 characters. This allows the message
to be easier to read on GitHub as well as in various git tools.

### Type

One of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system, CI configuration or external dependencies
- **chore**: Other changes that don't modify `src` or `test` files
- **revert**: Reverts a previous commit. Include the hash of the commit being reverted.

### Subject

The subject contains succinct description of the change:

- use the imperative, present tense: "change" not "changed" nor "changes"
- don't capitalize first letter
- no dot (.) at the end

### Body

Just as in the **subject**, use the imperative, present tense: "change" not "changed" nor "changes".
The body should include the motivation for the change and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to
reference GitHub issues that this commit **Closes**.
**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines.
The rest of the commit message is then used for this.

## Financial contributions

We also welcome financial contributions in full transparency on our [open collective](https://opencollective.com/typeorm).
Anyone can file an expense. If the expense makes sense for the development of the community, it will be "merged" in the ledger of our open collective by the core contributors and the person who filed the expense will be reimbursed.

## Credits

### Contributors

Thank you to all the people who have already contributed to typeorm!
<a href="../../graphs/contributors"><img src="https://opencollective.com/typeorm/contributors.svg?width=890" /></a>

### Backers

Thank you to all our backers! [[Become a backer](https://opencollective.com/typeorm#backer)]

<a href="https://opencollective.com/typeorm#backers" target="_blank"><img src="https://opencollective.com/typeorm/backers.svg?width=890"></a>

### Sponsors

Thank you to all our sponsors! (please ask your company to also support this open source project by [becoming a sponsor](https://opencollective.com/typeorm#sponsor))

<a href="https://opencollective.com/typeorm/sponsor/0/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/1/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/2/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/3/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/4/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/5/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/6/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/7/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/8/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/typeorm/sponsor/9/website" target="_blank"><img src="https://opencollective.com/typeorm/sponsor/9/avatar.svg"></a>
