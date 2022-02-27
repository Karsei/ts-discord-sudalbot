const axios = require('axios');

export default class MarketService
{
    static async fetchCurrentList(pServer: string, pItemId: number) {
        return await axios.get(`https://universalis.app/api/${pServer}/${pItemId}`);
    }
}