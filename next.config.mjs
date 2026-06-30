/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "172.20.10.4",
    "192.168.0.9",
    "192.168.0.2",
    "http://192.168.0.2:3000",
    "192.168.0.10",
    "http://192.168.0.10:3000",
    "192.168.0.7",
    "http://192.168.0.7:3000",
    "192.168.0.6",
    "http://192.168.0.6:3107",
    "192.168.0.5",
    "http://192.168.0.5:3114"
  ],
  devIndicators: false
};

export default nextConfig;
