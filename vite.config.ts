import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/')) {
              try {
                const url = new URL(req.url, `http://${req.headers.host}`);
                const endpoint = url.pathname.replace('/api/', '');
                const filePath = path.resolve(__dirname, `api/${endpoint}.ts`);
                
                if (fs.existsSync(filePath)) {
                  const mod = await server.ssrLoadModule(filePath);
                  const handler = mod.default;
                  
                  const vReq = {
                    method: req.method,
                    body: await new Promise((resolve) => {
                      let body = '';
                      req.on('data', chunk => body += chunk);
                      req.on('end', () => {
                        try {
                          resolve(body ? JSON.parse(body) : {});
                        } catch (e) {
                          resolve({});
                        }
                      });
                    }),
                    query: Object.fromEntries(url.searchParams),
                    headers: req.headers
                  };

                  const vRes = {
                    status: (code: number) => {
                      res.statusCode = code;
                      return vRes;
                    },
                    json: (data: any) => {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return vRes;
                    },
                    send: (data: any) => {
                      res.end(data);
                      return vRes;
                    },
                    setHeader: (name: string, value: string) => {
                      res.setHeader(name, value);
                      return vRes;
                    }
                  };

                  await handler(vReq, vRes);
                  return;
                }
              } catch (error) {
                console.error('API Middleware Error:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
