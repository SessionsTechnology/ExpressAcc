# ExpressACC landing page

This folder is a self-contained static site. It has no build step and does not depend on the ExpressACC application server.

The repository's GitHub Pages workflow publishes this folder to [sessionstechnology.github.io/ExpressAcc](https://sessionstechnology.github.io/ExpressAcc/) whenever landing-page files change on `main`.

## Preview locally

From the repository root:

```sh
python3 -m http.server 4173 --directory landing
```

Then open `http://localhost:4173`.

## Host it

Upload the contents of this folder to any static web host.

- **GitHub Pages in this repository:** `.github/workflows/pages.yml` uploads this folder and deploys it through GitHub Actions.
- **Another GitHub Pages repository:** copy the folder contents to its root, then publish that repository's `main` branch from `/ (root)`.
- **Cloudflare Pages / Netlify:** use `landing` as the publish directory and leave the build command empty.
- **Any static host:** serve `index.html` as the entry point.

Page assets use relative paths, so the site works at either a domain root or a project subpath. Canonical and social-preview metadata point to the production GitHub Pages URL and should be updated if the site moves to another domain.
