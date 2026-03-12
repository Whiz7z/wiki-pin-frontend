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
  content_scripts: [{
    js: ['src/content/main.tsx'],
    matches: ['https://*/*'],
    exclude_matches: ['https://*.mui.com/*'],
  }],
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
