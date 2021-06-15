const config = {
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
        node_args: "",
        max_memory_restart: "4G",
        env: {
            NODE_ENV: "development",
        },
        env_production: {
            NODE_ENV: "production",
        }
    }]
};
const defaultNodeArgs = "--max-http-header-size=80000 --trace-warnings --max_old_space_size=4096 --max-old-space-size=4096";
let debug_mode = false;
for (const arg of process.argv) {
    if (arg === '-debug') {
        debug_mode = true;
        break;
    }
}

if (debug_mode) {
    console.log('== launching in debug mode ==');
    config.apps[0].node_args = `${defaultNodeArgs} --inspect`;
} else {
    console.log('== launching in production mode ==');
    config.apps[0].node_args = `${defaultNodeArgs}`;
}

module.exports = config;