import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { RedditAdapter } from './reddit.adapter';

const mockFashionCheck = `{"approved_at_utc":null,"subreddit":"ffxiv","selftext":"","author_fullname":"t2_f31ma","saved":false,"mod_reason_title":null,"gilded":0,"clicked":false,"title":"Fashion Report - Full Details - For Week of 9/8/2023 (Week 293)","link_flair_richtext":[{"e":"text","t":"[Guide]"}],"subreddit_name_prefixed":"r/ffxiv","hidden":false,"pwls":6,"link_flair_css_class":"guide","downs":0,"thumbnail_height":78,"top_awarded_type":null,"hide_score":false,"name":"t3_16d6tmc","quarantine":false,"link_flair_text_color":"dark","upvote_ratio":0.98,"author_flair_background_color":"transparent","ups":276,"total_awards_received":1,"media_embed":{},"thumbnail_width":140,"author_flair_template_id":"1c2ec944-55cd-11e7-b2ca-0e1f5917423a","is_original_content":false,"user_reports":[],"secure_media":null,"is_reddit_media_domain":false,"is_meta":false,"category":null,"secure_media_embed":{},"link_flair_text":"[Guide]","can_mod_post":false,"score":276,"approved_by":null,"is_created_from_ads_ui":false,"author_premium":true,"thumbnail":"https://b.thumbs.redditmedia.com/B8ynN-EyewXWRsARJh5Jq35APMNOYF-GJUpeczRYNBg.jpg","edited":false,"author_flair_css_class":null,"author_flair_richtext":[{"a":":fashionreport:","e":"emoji","u":"https://emoji.redditmedia.com/8c2z7rc815q21_t5_2rgs7/fashionreport"}],"gildings":{"gid_3":1},"post_hint":"image","content_categories":null,"is_self":false,"subreddit_type":"public","created":1694168736,"link_flair_type":"richtext","wls":6,"removed_by_category":null,"banned_by":null,"author_flair_type":"richtext","domain":"i.imgur.com","allow_live_comments":false,"selftext_html":null,"likes":null,"suggested_sort":null,"banned_at_utc":null,"url_overridden_by_dest":"https://i.imgur.com/qEfn9tK.png","view_count":null,"archived":false,"no_follow":false,"is_crosspostable":true,"pinned":false,"over_18":false,"preview":{"images":[{"source":{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?auto=webp&s=4a50a9e5b82934908180c0db4dc48e795ba86eb1","width":1701,"height":957},"resolutions":[{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?width=108&crop=smart&auto=webp&s=0f4c5ef61f134d7ca3f9411ae8da8c4057394816","width":108,"height":60},{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?width=216&crop=smart&auto=webp&s=b384af0a439059538bb7a15e2dccb68234cfec18","width":216,"height":121},{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?width=320&crop=smart&auto=webp&s=7b55f9d096f1f7fe8ba919d6b54c290a6b80eb79","width":320,"height":180},{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?width=640&crop=smart&auto=webp&s=c4c123d6f11b1a99b7ebb3491b281499c2a74260","width":640,"height":360},{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?width=960&crop=smart&auto=webp&s=bfcc9df6c38f7a8cd28927153d12f7dc94568ea0","width":960,"height":540},{"url":"https://external-preview.redd.it/7Tbm2NprLiEUCHQ7IN3hc215EFtjGgdyDVp-LETmuPM.png?width=1080&crop=smart&auto=webp&s=35a9fc836eaeab6ce7643ef85844f790f061f338","width":1080,"height":607}],"variants":{},"id":"tgBYFpZ5nJWP4oMB5p3iMXx6T_shoQu30prOqBMpEIs"}],"enabled":true},"all_awardings":[{"giver_coin_reward":null,"subreddit_id":null,"is_new":false,"days_of_drip_extension":31,"coin_price":1800,"id":"gid_3","penny_donate":null,"award_sub_type":"GLOBAL","coin_reward":0,"icon_url":"https://www.redditstatic.com/gold/awards/icon/platinum_512.png","days_of_premium":31,"tiers_by_required_awardings":null,"resized_icons":[{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_16.png","width":16,"height":16},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_32.png","width":32,"height":32},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_48.png","width":48,"height":48},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_64.png","width":64,"height":64},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_128.png","width":128,"height":128}],"icon_width":512,"static_icon_width":512,"start_date":null,"is_enabled":true,"awardings_required_to_grant_benefits":null,"description":"Gives a month of free Premium, which includes ad-free browsing, r/lounge access, and 700 Reddit Coins per month, until Coins are sunset on September 12, 2023.","end_date":null,"sticky_duration_seconds":null,"subreddit_coin_reward":0,"count":1,"static_icon_height":512,"name":"Platinum","resized_static_icons":[{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_16.png","width":16,"height":16},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_32.png","width":32,"height":32},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_48.png","width":48,"height":48},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_64.png","width":64,"height":64},{"url":"https://www.redditstatic.com/gold/awards/icon/platinum_128.png","width":128,"height":128}],"icon_format":null,"icon_height":512,"penny_price":null,"award_type":"global","static_icon_url":"https://www.redditstatic.com/gold/awards/icon/platinum_512.png"}],"awarders":[],"media_only":false,"link_flair_template_id":"7d381da8-d2d6-11e8-936c-0eb3d4d9e1b2","can_gild":true,"spoiler":false,"locked":false,"author_flair_text":":fashionreport:","treatment_tags":[],"visited":false,"removed_by":null,"mod_note":null,"distinguished":null,"subreddit_id":"t5_2rgs7","author_is_blocked":false,"mod_reason_by":null,"num_reports":null,"removal_reason":null,"link_flair_background_color":"#e0ebce","id":"16d6tmc","is_robot_indexable":true,"report_reasons":null,"author":"kaiyoko","discussion_type":null,"num_comments":18,"send_replies":true,"whitelist_status":"all_ads","contest_mode":false,"mod_reports":[],"author_patreon_flair":false,"author_flair_text_color":"dark","permalink":"/r/ffxiv/comments/16d6tmc/fashion_report_full_details_for_week_of_982023/","parent_whitelist_status":"all_ads","stickied":false,"url":"https://i.imgur.com/qEfn9tK.png","subreddit_subscribers":849894,"created_utc":1694168736,"num_crossposts":0,"media":null,"is_video":false,"comments":[]}`;

describe('RedditAdapterTest', () => {
  let redditAdapter: RedditAdapter;
  const mockRedditAdapter = {
    loadFashion: jest.fn().mockResolvedValue(JSON.parse(mockFashionCheck)),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        { provide: RedditAdapter, useValue: mockRedditAdapter },
      ],
    }).compile();
    redditAdapter = app.get<RedditAdapter>(RedditAdapter);
  });

  it('loadFashion', async () => {
    // given

    // when
    const results = await redditAdapter.loadFashion();

    // then
    expect(results).toBeDefined();
    expect(results.title).toContain('Fashion Report - Full Details');
    expect(results.id).toContain('16d6tmc');
    expect(results.url).toContain('https://i.imgur.com/');
    expect(results.subreddit).toEqual('ffxiv');
  });
});
