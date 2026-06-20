import { defineConfig } from 'vite';
import os from 'os';

export default defineConfig({
  plugins: [
    {
      name: 'hardware-api',
      configureServer(server) {
        server.middlewares.use('/api/hardware', (req, res) => {
          const cpus = os.cpus();
          const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown CPU';
          const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
          const cores = cpus.length;
          const upTime = os.uptime();
          
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            cpuModel,
            totalMem,
            cores,
            upTime
          }));
        });
      }
    }
  ]
});
