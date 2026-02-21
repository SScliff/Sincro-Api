import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/api': {
                target: 'http://api:3000', // Docker service name
                changeOrigin: true,
            },
        },
        host: '0.0.0.0', // Necessary for Docker
    },
});
