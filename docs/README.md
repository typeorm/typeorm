# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

### Installation

```
$ npm install
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true npm deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> npm deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

### Documentation Versioning

The documentation uses Docusaurus versioning to maintain multiple versions:

- **`docs/docs/`** - Contains the in-development documentation (labeled as **"next"**)
- **`versioned_docs/version-v0.3/`** - Contains the stable snapshot for v0.3 (labeled as **"v0.3 (stable)"**)

#### Creating a New Version Snapshot

To create a new stable version snapshot (e.g., when releasing a new version):

```bash
npm run docusaurus -- docs:version <version-name>
```

For example, to create version `v0.4`:

```bash
npm run docusaurus -- docs:version v0.4
```

This command will:
- Copy the current `docs/docs/` content to `versioned_docs/version-<version-name>/`
- Generate `versioned_sidebars/version-<version-name>-sidebars.json`
- Update `versions.json` with the new version

After creating a version, update `docusaurus.config.ts` to add the version label in the `docs.versions` configuration.

#### Version Labels

Version labels are configured in `docusaurus.config.ts`:
- `current` is labeled as **"next"** (the in-development version)
- Each versioned snapshot can have its own label (e.g., `v0.3` is labeled as **"v0.3 (stable)"**)

Users can switch between versions using the version dropdown in the navbar.
