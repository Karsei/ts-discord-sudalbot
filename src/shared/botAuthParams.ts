export default interface BotAuthParams
{
    client_id: string,
    scope: string,
    permissions: number,
    guild_id: string,
    disable_guild_select: boolean
};