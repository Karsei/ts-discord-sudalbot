module.exports = {
  apps: [
    {
      name: 'daldalee-bot',
      // script: 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js', // windows - https://github.com/Unitech/pm2/issues/3657#issuecomment-482010714
      script: 'npm',
      args: 'run start:env',
      autorestart: true,
      watch: false,
      instance: '1',
      env: {
        NODE_ENV: "dev",
      },
      env_prod: { // --env prod
        NODE_ENV: "prod"
      },
    },
  ],
}