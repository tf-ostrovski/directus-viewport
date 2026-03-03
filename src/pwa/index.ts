import { defineHook } from '@directus/extensions-sdk';
import { generateManifest, type ProjectSettings } from './manifest.js';
import { getServiceWorkerScript } from './service-worker.js';

export default defineHook(({ embed, init }, { services, database, getSchema }) => {
	let settings: ProjectSettings = {
		project_name: 'Directus',
		project_descriptor: null,
		project_logo: null,
		project_color: null,
	};

	async function loadSettings(): Promise<void> {
		try {
			const schema = await getSchema();
			const settingsService = new services.SettingsService({
				knex: database,
				schema,
			});
			const result = await settingsService.readSingleton({
				fields: ['project_name', 'project_descriptor', 'project_logo', 'project_color'],
			});
			if (result) {
				settings = result as ProjectSettings;
			}
		} catch {
			// Settings not available yet — use defaults
		}
	}

	// Static head tags — embed() must be called synchronously
	embed(
		'head',
		[
			'<link rel="manifest" href="/manifest.json">',
			'<script src="/pwa/register-sw.js" defer></script>',
		].join('\n'),
	);

	// Register routes before auth middleware
	init('app.before', ({ app }) => {
		app.get('/manifest.json', async (_req: any, res: any) => {
			await loadSettings();
			const manifest = generateManifest(settings);
			res.setHeader('Content-Type', 'application/manifest+json');
			res.setHeader('Cache-Control', 'no-cache');
			res.json(manifest);
		});

		app.get('/sw.js', (_req: any, res: any) => {
			res.setHeader('Content-Type', 'application/javascript');
			res.setHeader('Cache-Control', 'no-cache');
			res.setHeader('Service-Worker-Allowed', '/');
			res.send(getServiceWorkerScript());
		});

		app.get('/pwa/register-sw.js', (_req: any, res: any) => {
			res.setHeader('Content-Type', 'application/javascript');
			res.setHeader('Cache-Control', 'no-cache');
			res.send(getRegisterScript());
		});
	});
});

function getRegisterScript(): string {
	return `
(function() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js', { scope: '/' });
    });
  }

  // Inject theme-color and apple-touch-icon from manifest
  fetch('/manifest.json')
    .then(function(r) { return r.json(); })
    .then(function(m) {
      if (m.theme_color) {
        var meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = m.theme_color;
        document.head.appendChild(meta);
      }
      if (m.icons && m.icons.length > 0) {
        var link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        link.href = m.icons[0].src;
        document.head.appendChild(link);
      }
    })
    .catch(function() {});
})();
`;
}
