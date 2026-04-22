// pm2 ecosystem config for inZOI Concept Studio
// Adds robust restart policy + structured logs.
// Usage:  pm2 start ecosystem.config.cjs
const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "inzoi",
      script: "server.js",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 50,
      min_uptime: "10s",
      restart_delay: 5000,
      exp_backoff_restart_delay: 3000,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
      error_file: path.join(__dirname, "logs", "pm2-error.log"),
      out_file:   path.join(__dirname, "logs", "pm2-out.log"),
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss",
    },
  ],
};
