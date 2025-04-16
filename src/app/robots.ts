import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: 'https://italian-brainrot-quiz.vercel.app/sitemap.xml', // 실제 URL로 변경하세요
  };
} 