export const BaseConfig = {
    isGlobal: true,
    envFilePath: `../.env.${process.env.NODE_ENV}`,
    ignoreEnvFile: 'prod' === process.env.NODE_ENV,
};