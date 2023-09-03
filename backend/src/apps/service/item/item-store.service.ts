import axios from 'axios';
import Redis from 'ioredis';
import { Repository } from 'typeorm';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@liaoliaots/nestjs-redis';

import { XivVersion } from '../../../entities/xiv-version.entity';
import { XivItem } from '../../../entities/xiv-item.entity';
import { XivItemCategories } from '../../../entities/xiv-item-categories.entity';

import { promisify } from 'node:util';
import * as childProcess from 'child_process';

const cliProgress = require('cli-progress');
const execFile = promisify(childProcess.execFile);

@Injectable()
export class ItemStoreService {
  /**
   * 수정 확인을 위한 Cache 유지 시간
   */
  static readonly CACHE_EXPIRE_IN = 600;

  private readonly redis: Redis;

  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly redisService: RedisService,
    @InjectRepository(XivVersion)
    private xivVersionRepository: Repository<XivVersion>,
    @InjectRepository(XivItem) private xivItemRepository: Repository<XivItem>,
    @InjectRepository(XivItemCategories)
    private xivItemCategoriesRepository: Repository<XivItemCategories>,
  ) {
    this.redis = this.redisService.getClient();
  }

  async init() {
    const latestVersionDb = await this.getLatestKoreanVersionFromDB();
    const latestVersionRemote = await this.getLatestKoreanVersionFromRemote();
    if (latestVersionDb && latestVersionDb.version >= latestVersionRemote)
      return;

    this.loggerService.log(`Found new version! - ${latestVersionRemote}`);

    await this.xivVersionRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 새로운 버전 데이터 저장
        const xivVersion = new XivVersion();
        xivVersion.version = latestVersionRemote;
        xivVersion.locale = 'kr';
        await transactionalEntityManager.save(xivVersion);

        // 아이템 데이터 저장
        this.loggerService.log('Fetching Item...');
        const itemRes = await this.fetch('Item');
        const bItem = new cliProgress.Bar();
        bItem.start(itemRes.length, 0);
        for (
          let dataIdx = 0, dataTotal = itemRes.length;
          dataIdx < dataTotal;
          dataIdx++
        ) {
          let csvItem = itemRes[dataIdx];
          if (csvItem.hasOwnProperty('_')) delete csvItem['_'];

          await transactionalEntityManager.insert(XivItem, {
            version: { idx: xivVersion.idx },
            itemIdx: csvItem['#'],
            name: csvItem['Name'],
            content: JSON.stringify(csvItem),
          });
          bItem.increment();
        }
        bItem.stop();

        // 아이템 카테고리 데이터 저장
        // ItemUiCategory
        this.loggerService.log('Fetching ItemUICategory...');
        const itemUiCategoryRes = await this.fetch('ItemUICategory');
        const bItemUiCategory = new cliProgress.Bar();
        bItemUiCategory.start(itemUiCategoryRes.length, 0);
        for (
          let dataIdx = 0, dataTotal = itemUiCategoryRes.length;
          dataIdx < dataTotal;
          dataIdx++
        ) {
          const csvItem = itemUiCategoryRes[dataIdx];
          if (csvItem.hasOwnProperty('_')) delete csvItem['_'];

          await transactionalEntityManager.insert(XivItemCategories, {
            version: { idx: xivVersion.idx },
            itemCategoryIdx: csvItem['#'],
            name: csvItem['Name'],
            content: JSON.stringify(csvItem),
          });
          bItemUiCategory.increment();
        }
        bItemUiCategory.stop();

        // 이전 데이터는 삭제 처리
        if (latestVersionDb) {
          await transactionalEntityManager.softDelete(XivVersion, {
            idx: latestVersionDb.idx,
          });
        }
      },
    );
  }

  private async getLatestKoreanVersionFromDB() {
    return await this.xivVersionRepository.findOne({
      where: [{ locale: 'kr' }],
      order: { version: 'DESC' },
    });
  }

  private async getLatestKoreanVersionFromRemote() {
    const tags = await this.remoteGitTags(
      'https://github.com/Ra-Workspace/ffxiv-datamining-ko',
    );
    return [...tags]
      .map((i) => parseFloat(i.at(0).replace('v', '')))
      .sort((a, b) => {
        return b - a;
      })
      .reverse()
      .pop();
  }

  private async remoteGitTags(repoUrl) {
    const { stdout } = await execFile('git', ['ls-remote', '--tags', repoUrl]);
    const tags = new Map();

    for (const line of stdout.trim().split('\n')) {
      const [hash, tagReference] = line.split('\t');

      // Strip off the indicator of dereferenced tags so we can override the
      // previous entry which points at the tag hash and not the commit hash
      // `refs/tags/v9.6.0^{}` → `v9.6.0`
      const tagName = tagReference
        .replace(/^refs\/tags\//, '')
        .replace(/\^{}$/, '');

      tags.set(tagName, hash);
    }

    return tags;
  }

  private async fetch(name: string): Promise<any[]> {
    const csvRes: any = await this.fetchCsv(name);
    if (!csvRes.hasOwnProperty('data') || csvRes['data'].length <= 0) {
      this.loggerService.log('데이터가 존재하지 않습니다.');
      return new Promise(() => {});
    }

    // 데이터 구성
    const data: Array<any> = this.readCsv(csvRes['data']);
    if (data.length <= 0) {
      throw new Error('데이터 구성에 실패하였습니다.');
    }

    return data;
  }

  private async fetchCsv(fileName: string) {
    return axios.get(
      `https://raw.githubusercontent.com/Ra-Workspace/ffxiv-datamining-ko/master/csv/${fileName}.csv`,
    );
  }

  private readCsv(content: string) {
    let inQuote = false;
    let lineBuf = '';
    let lines = [];
    let line = [];
    for (
      let strIdx = 0, strTotal = content.length;
      strIdx < strTotal;
      strIdx++
    ) {
      const chr = content[strIdx];
      if (inQuote) {
        if (chr === '"') {
          inQuote = false;
        } else {
          lineBuf += chr;
        }
        continue;
      }

      switch (chr) {
        case ',':
          line.push(lineBuf);
          lineBuf = '';
          break;
        case '"':
          inQuote = !inQuote;
          break;
        case '\r': // @todo: \r 를 처리할 수 있는 더 나은 방법을 찾아야 함
          break;
        case '\n':
          line.push(lineBuf);
          lineBuf = '';
          lines.push(line);
          line = [];
          break;
        default:
          lineBuf += chr;
          break;
      }
    }
    if (line.length) {
      lines.push(line);
    }

    let fields = lines[1];
    return lines.slice(3).map((line) =>
      fields.reduce(
        (obj: any, field, i) => {
          const content = line[i].replace(/\r\n/g, '\n');
          if (field) {
            obj[field] = content;
          } else {
            obj[`#${i}`] = content;
          }

          return obj;
        },
        { _: line },
      ),
    );
  }
}
