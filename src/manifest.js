
module.exports = {
  name: 'TermHints',
  short_name: 'TH',
  version: '1.0.0',
  description: 'Chrome Extension',
  author: 'Nikola Spalevic & Filip Furtula',
  manifest_version: 2,
  icons: { '16': 'icons/16.png', '48': 'icons/48.png', '128': 'icons/128.png' },
  permissions: [
    '<all_urls>',
    '*://*/*',
    'activeTab',
    'tabs',
    'background'
  ],
  browser_action: {
    default_title: 'TermHints'
  },
  background: {
    persistent: true,
    page: 'pages/background.html'
  },
  content_scripts: [{
    js: [ 'js/content.js' ],
    run_at: 'document_end',
    matches: ['<all_urls>'],
    all_frames: true
  }],
  content_security_policy: "script-src 'self' 'unsafe-eval'; object-src 'self'",
  web_accessible_resources: [
    'loader.gif'
  ]
}
