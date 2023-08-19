module.exports = {
  apps: [
    {
      name: 'daldalee-bot',
      script: 'backend/dist/main.js',
      env: {
        NODE_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "prod"
      },
    },
  ],
}