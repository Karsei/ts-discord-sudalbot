import { PoolConnection } from "mariadb";

export default class MariadbAdapter {
  private readonly dbCon: PoolConnection;
  constructor(dbCon: PoolConnection) {
    this.dbCon = dbCon;
  }

  getInstance() {
    return this.dbCon;
  }

  async selectOne() {
    return this.dbCon.query(`SELECT 1`);
  }

  async addItem(pLang: string, pData: any) {
    const pLangIdx = pLang == 'kr' ? 1 : 0;
    return await this.dbCon.query(`INSERT INTO g_item (version_seqno, idx, name, content) VALUES (?, ?, ?, ?)`, [pLangIdx, pData['#'], pData.Name, JSON.stringify(pData)]);
  }

  async getItemByIdx(pLang: string, pKey: number) {
    return await this.dbCon.query(`SELECT item.idx, item.name, item.content FROM g_item item INNER JOIN g_version version ON version.seqno = item.version_seqno WHERE 1=1 AND version.lang = ? AND item.idx = ?`, [pLang, pKey]);
  }

  async getItemByName(pLang: string, pName: string) {
    return await this.dbCon.query(`SELECT item.idx, item.name, item.content FROM g_item item INNER JOIN g_version version ON version.seqno = item.version_seqno WHERE 1=1 AND version.lang = ? AND item.name LIKE ?`, [pLang, `%${pName}%`]);
  }

  async addItemUiCategories(pLang: string, pData: any) {
    const pLangIdx = pLang == 'kr' ? 1 : 0;
    return await this.dbCon.query(`INSERT INTO g_itemuicategories (version_seqno, idx, name, content) VALUES (?, ?, ?, ?)`, [pLangIdx, pData['#'], pData.Name, JSON.stringify(pData)]);
  }

  async getItemUiCategory(pLang: string, pKey: number) {
    return await this.dbCon.query(`SELECT itemui.idx, itemui.name, itemui.content FROM g_itemuicategories itemui INNER JOIN g_version version ON version.seqno = itemui.version_seqno WHERE 1=1 AND version.lang = ? AND itemui.idx = ?`, [pLang, pKey]);
  }
}