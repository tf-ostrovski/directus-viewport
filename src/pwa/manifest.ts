export interface ProjectSettings {
	project_name: string;
	project_descriptor: string | null;
	project_logo: string | null;
	project_color: string | null;
}

export function generateManifest(settings: ProjectSettings): object {
	const name = settings.project_name || 'Directus';
	const description = settings.project_descriptor || '';
	const color = settings.project_color || '#6644FF';
	const logoId = settings.project_logo;

	const icons = logoId
		? [
				{
					src: `/assets/${logoId}?width=192&height=192&fit=contain`,
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: `/assets/${logoId}?width=512&height=512&fit=contain`,
					sizes: '512x512',
					type: 'image/png',
				},
			]
		: [];

	return {
		name,
		short_name: name,
		description,
		start_url: '/admin',
		scope: '/',
		display: 'standalone',
		theme_color: color,
		background_color: color,
		icons,
	};
}
