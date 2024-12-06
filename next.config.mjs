/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'deetnuts.com', 'deetnuts.site', 'cloudinary.com'],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    });
    return config;
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|gif|ico|jpeg|webp|woff2|woff|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },
  swcMinify: true,
};

export default nextConfig;