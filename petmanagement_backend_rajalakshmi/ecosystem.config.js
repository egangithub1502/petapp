module.exports = {
   apps: [{
      name: "Pet Management",
      script: "./server.js",
      instances: 1, // Single instance
      exec_mode: "fork", // Runs in fork mode instead of cluster
      watch: true,
      node_args: '--max_old_space_size=16000',
      log_file: "logs/combined.outerr-0.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      ignore_watch: ["logs", "logs/*", ".pm2/*", "publics", "publics/*"],
      max_memory_restart: '1G',
      env_production: {
         PORT: 5000,
         NODE_ENV: "production"
      },
      env: {
         NODE_ENV: "development",
         PORT: 8000
      }
   }]

}