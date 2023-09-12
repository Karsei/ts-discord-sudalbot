// 윈도우는 https://github.com/Unitech/pm2/issues/3657#issuecomment-482010714 참고
module.exports = {
  apps: [
    {
      name: 'daldalee-bot',
      script: 'npm',
      args: 'run start',
      env: {
        NODE_ENV: "dev",
      },
      env_prod: {
        NODE_ENV: "prod"
      },
    },
  ],
}