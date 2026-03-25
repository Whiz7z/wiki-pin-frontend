import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  background: {
    service_worker: "src/background.ts",
    type: "module",

  },
  permissions: [
    'sidePanel',
    'contentSettings',
    'tabs',
    'activeTab',
    'scripting',
    'storage',
  ],
  // Only Wikipedia article pages: /wiki/Title on any language subdomain (and mobile *.m.wikipedia.org).
  // Non-article namespaces excluded (Special, Talk, File, …).
  content_scripts: [
    {
      js: ['src/content/main.tsx'],
      matches: ['https://*.wikipedia.org/wiki/*', 'https://*.m.wikipedia.org/wiki/*'],
      exclude_matches: [
        'https://*.wikipedia.org/wiki/Special:*',
        'https://*.wikipedia.org/wiki/Wikipedia:*',
        'https://*.wikipedia.org/wiki/Talk:*',
        'https://*.wikipedia.org/wiki/User:*',
        'https://*.wikipedia.org/wiki/User_talk:*',
        'https://*.wikipedia.org/wiki/Help:*',
        'https://*.wikipedia.org/wiki/File:*',
        'https://*.wikipedia.org/wiki/MediaWiki:*',
        'https://*.wikipedia.org/wiki/Template:*',
        'https://*.wikipedia.org/wiki/Category:*',
        'https://*.wikipedia.org/wiki/Draft:*',
        'https://*.wikipedia.org/wiki/Module:*',
        'https://*.wikipedia.org/wiki/Portal:*',
        'https://*.m.wikipedia.org/wiki/Special:*',
        'https://*.m.wikipedia.org/wiki/Wikipedia:*',
        'https://*.m.wikipedia.org/wiki/Talk:*',
        'https://*.m.wikipedia.org/wiki/User:*',
        'https://*.m.wikipedia.org/wiki/User_talk:*',
        'https://*.m.wikipedia.org/wiki/Help:*',
        'https://*.m.wikipedia.org/wiki/File:*',
        'https://*.m.wikipedia.org/wiki/MediaWiki:*',
        'https://*.m.wikipedia.org/wiki/Template:*',
        'https://*.m.wikipedia.org/wiki/Category:*',
        'https://*.m.wikipedia.org/wiki/Draft:*',
        'https://*.m.wikipedia.org/wiki/Module:*',
        'https://*.m.wikipedia.org/wiki/Portal:*',
      ],
    },
  ],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  host_permissions: [
    "http://*/*",
    "https://*/*",
    // Exclude *.mui.com via a more specific match pattern:
    // Chrome does not support exclusion patterns, so explicit matching is used.
    // Consumers should note requests to *.mui.com are not covered
    // or handle in extension logic if needed.
  ]
})
