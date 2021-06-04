module.exports = {
    apps: [{
        name: "ShanaBot",
        script: "build/Main.js",
        error_file: 'logs/err.log',
        out_file: 'logs/out.log',
        log_file: 'logs/combined.log',
        time: true,
        source_map_support: true,
        wait_ready: true,
        watch: ["build"],
        node_args: "--max-http-header-size=80000 --trace-warnings --max-old-space-size=4096",
        max_memory_restart: "4G",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
};