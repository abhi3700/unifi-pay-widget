# Contributing

## Setup

```sh
npm install
npm run check
npm test
```

## Change guidelines

- Keep the root entry point framework-agnostic.
- Keep API credentials inside `src/server`; browser and React modules must not accept an API key.
- Preserve the canonical UniFi checkout and receipt route formats.
- Add or update tests when changing session IDs, URLs, proxy allowlists, or status parsing.
- Keep component styles under the `unifi-widget` prefix and verify keyboard focus, Escape, narrow screens, and reduced motion.
- Update the README and API reference when public exports or defaults change.

Before opening a pull request, run `npm run check`, `npm test`, and `npm pack --dry-run`.
