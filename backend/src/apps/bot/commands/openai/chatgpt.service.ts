import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from '@liaoliaots/nestjs-redis';

const { Configuration, OpenAIApi } = require('openai');

@Injectable()
export class ChatGptService {
  private readonly maxTokenLength: number = 4000;
  private readonly redis: Redis;
  private readonly openai;
  constructor(
    @Inject(Logger) private readonly loggerService: LoggerService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
    const configuration = new Configuration({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
    this.openai = new OpenAIApi(configuration);
  }

  async converse(guildId: string, userId: string, message: string) {
    const locked = await this.getConverseLock(guildId, userId);
    if (locked && locked === '1')
      return '으음... 다른 달달이랑 이야기하고 있는 것 같아요. 잠시만 기다려주세요!';
    await this.setConverseLock(guildId, userId, 1);

    let choisedMsg = '';
    try {
      const history = (await this.getConverseHistory(guildId, userId)) ?? '';
      const prefix = `The following is a conversation with an AI assistant. The assistant's name is 달달이. The assistant is helpful, creative, clever, and very friendly. When a question is asked in English, the assistant answers in Korean.\n`;
      let sendStr = `${history}\nHuman:${message}\nAI:`;
      const promptStr = `${prefix}${sendStr}`;

      const res = await this.prompt(promptStr);
      if (res.data.choices) {
        for (const idx in res.data.choices) {
          choisedMsg += res.data.choices[idx].text;
        }
      }
      sendStr += choisedMsg.trim();
      await this.setConverseHistory(guildId, userId, sendStr);
    } catch (e) {
      const errorMsg = e.response?.data?.error?.message;
      if (errorMsg.indexOf('token') > -1) {
        await this.setConverseHistory(guildId, userId, '');
        await this.setConverseLock(guildId, userId, 0);
        return '너무 많은 내용을 기억하기가 어려워요. 기억을 비웠으니 다시 물어보세요!';
      } else {
        this.loggerService.error('GPT-3 대화 오류가 발생했습니다.', e);
      }
    }
    await this.setConverseLock(guildId, userId, 0);

    return choisedMsg;
  }

  async prompt(message: string) {
    return await this.openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${message}`,
      temperature: 0.9,
      max_tokens: this.maxTokenLength - message.length,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [`Human:`],
    });
  }

  private async getConverseLock(guildId: string, userId: string) {
    return this.redis.get(`openai-converse-lock-${guildId}-${userId}`) ?? 0;
  }

  private async setConverseLock(guildId: string, userId: string, value: 0 | 1) {
    return this.redis.set(
      `openai-converse-lock-${guildId}-${userId}`,
      value,
      'EX',
      600,
    );
  }

  private async getConverseHistory(guildId: string, userId: string) {
    return this.redis.get(`openai-converse-${guildId}-${userId}`);
  }

  private async setConverseHistory(
    guildId: string,
    userId: string,
    message: string,
  ) {
    return this.redis.set(
      `openai-converse-${guildId}-${userId}`,
      message,
      'EX',
      600,
    );
  }
}
