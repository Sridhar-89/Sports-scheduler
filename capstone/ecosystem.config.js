module.exports = {
    apps: [
      {
        name: 'sports-schedular',
        script: 'index.js',
        instances: 'max',
        exec_mode: 'cluster',
        out_file: 'out.log',
        error_file: 'error.log',
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT || 5000,
        },
      },
    ],
  };