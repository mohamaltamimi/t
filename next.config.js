/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/**": ["./prisma/dev.db"],
  },
}

module.exports = nextConfig
