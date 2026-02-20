/* ==============================================================
   PM2 — Process Manager Configuration
   Deploy: pm2 start ecosystem.config.js --env production
   ============================================================== */
module.exports = {
    apps: [{
        name: 'cieib',
        script: 'server.js',
        instances: 'max',          // usar todos os CPUs
        exec_mode: 'cluster',      // modo cluster p/ alta disponibilidade
        watch: false,
        max_memory_restart: '300M',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        // Logs
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        error_file: '/var/log/cieib/error.log',
        out_file: '/var/log/cieib/out.log',
        merge_logs: true,
        // Restart policy
        autorestart: true,
        max_restarts: 10,
        restart_delay: 5000,
        // Graceful shutdown
        kill_timeout: 5000,
        listen_timeout: 10000,
    }]
};
