import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';

import * as childProcess from 'child_process';
import { promisify } from 'node:util';

import { ClientFileLoadPort } from '../../port/out/client-file-load-port.interface';
import axios from 'axios';

const execFile = promisify(childProcess.execFile);

@Injectable()
export class GithubAdapter implements ClientFileLoadPort {
  constructor(
    @Inject(Logger)
    private readonly loggerService: LoggerService,
  ) {}

  async getLatestKoreanVersionFromRemote() {
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

  async fetch(name: string): Promise<any[]> {
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
    const lines = [];
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

    const fields = lines[1];
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
