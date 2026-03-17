// PM2 process manager config for Hetzner deployment
module.exports = {
  apps: [
    {
      name: "nonprofit-ai-radar",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      cwd: "/opt/nonprofit-ai-radar",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
