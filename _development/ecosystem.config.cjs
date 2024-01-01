module.exports = {
  apps: [
    {
      cwd: './',
      name: 'server',
      script: 'npm',
      args: 'run dev',
      exp_backoff_restart_delay: 100,
      env: {
        PORT: 1272,
        HOST: '127.0.0.1',
      },
    },
    {
      cwd: './',
      name: 'demo',
      script: 'npm',
      args: 'run dev-demo',
      exp_backoff_restart_delay: 100,
      env: {
        PORT: 1273,
        HOST: '127.0.0.1',
      },
    },
    {
      cwd: '_development/',
      name: 'reverse',
      script: 'npm',
      args: 'run dev-reverse',
      exp_backoff_restart_delay: 100,
      env: {
        PORT: 443,
        HOST: '0.0.0.0',
        SSL: 'true',
        TARGET_SERVER: 'http://127.0.0.1:1272',
        TARGET_DEMO: 'http://127.0.0.1:1273',
      },
    },
  ],
};
