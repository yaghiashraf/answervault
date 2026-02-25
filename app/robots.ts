import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/privacy', '/terms'],
        disallow: ['/dashboard', '/answers', '/evidence', '/questionnaires', '/settings', '/api/'],
      },
    ],
    sitemap: 'https://answervault.vercel.app/sitemap.xml',
  };
}
