// import { ConfigService } from '@nestjs/config';
// import { Test, TestingModule } from '@nestjs/testing';
//
// import { RedditAdapter } from './reddit.adapter';
//
// describe('RedditAdapterTest', () => {
//   let redditAdapter: RedditAdapter;
//
//   beforeEach(async () => {
//     const app: TestingModule = await Test.createTestingModule({
//       providers: [
//         {
//           provide: ConfigService,
//           useValue: {
//             get: jest.fn((key: string) => {
//               if (key === 'REDDIT_CLIENT_ID') {
//                 return '';
//               } else if (key === 'REDDIT_CLIENT_SECRET') {
//                 return '';
//               } else if (key === 'REDDIT_CLIENT_REFRESH_TOKEN') {
//                 return '';
//               }
//               return null;
//             }),
//           },
//         },
//         RedditAdapter,
//       ],
//     }).compile();
//     redditAdapter = app.get<RedditAdapter>(RedditAdapter);
//   });
//
//   it('loadFashion', async () => {
//     // given
//
//     // when
//     const results = await redditAdapter.loadFashion();
//
//     // then
//     expect(results).toBeDefined();
//   });
// });
