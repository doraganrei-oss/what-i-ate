// YouTube Data API v3 を使用して、条件に合う隠れたYouTuberを検索・収集するモジュールです。

/**
 * ① YouTube APIを使用した直接検索
 */
window.collectNewChannels = async function(apiKey, query, category, existingChannels, langOption, activePeriod, searchOrder, minSubs, maxAgeMonths) {
  if (!apiKey) {
    throw new Error("APIキーが入力されていません。");
  }

  const existingIds = new Set(existingChannels.map(ch => ch.id));
  const newChannels = [];

  const minSubLimit = parseInt(minSubs || "1000", 10);
  let maxAgeDate = null;
  if (maxAgeMonths && maxAgeMonths !== "any") {
    maxAgeDate = new Date();
    maxAgeDate.setMonth(maxAgeDate.getMonth() - parseInt(maxAgeMonths, 10));
  }

  try {
    let searchQuery = query;
    const lowerQuery = query.toLowerCase();
    
    const hasHelperWord = ["ch", "channel", "チャンネル", "vlog", "動画", "実況", "紹介"].some(w => lowerQuery.includes(w));
    if (!hasHelperWord) {
      if (category === "animal") searchQuery += " チャンネル";
      if (category === "ikemen") searchQuery += " vlog";
      if (category === "kawaii") searchQuery += " ch";
      if (category === "food") searchQuery += " レシピ";
    }

    let langParams = "";
    if (langOption === "kr") {
      langParams = "&relevanceLanguage=ko&regionCode=KR";
    } else if (langOption === "us") {
      langParams = "&relevanceLanguage=en&regionCode=US";
    } else if (langOption === "jp") {
      langParams = "&relevanceLanguage=ja&regionCode=JP";
    }

    let publishedParams = "";
    if (activePeriod && activePeriod !== "any") {
      const date = new Date();
      const months = parseInt(activePeriod, 10);
      date.setMonth(date.getMonth() - months);
      publishedParams = `&publishedAfter=${date.toISOString()}`;
    }

    const orderParam = searchOrder ? `&order=${searchOrder}` : "&order=relevance";
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=50${langParams}${publishedParams}${orderParam}&key=${apiKey}`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      throw new Error(errorData.error?.message || "YouTube APIの呼び出しに失敗しました。");
    }
    
    const searchData = await searchResponse.json();
    const items = searchData.items || [];
    const candidateChannelIds = items.map(item => item.snippet.channelId || item.id.channelId).filter(Boolean);
    const filteredChannelIds = [...new Set(candidateChannelIds)].filter(id => !existingIds.has(id));
    
    if (filteredChannelIds.length === 0) return [];

    return await fetchAndFilterChannels(apiKey, filteredChannelIds, category, minSubLimit, maxAgeDate, existingIds);

  } catch (error) {
    console.error("収集エラー:", error);
    throw error;
  }
}

/**
 * ② ブログ自動巡回（クローラー）収集
 */
window.collectFromBlogs = async function(apiKey, query, category, existingChannels, minSubs, maxAgeMonths) {
  if (!apiKey) throw new Error("APIキーが入力されていません。");

  const existingIds = new Set(existingChannels.map(ch => ch.id));
  const minSubLimit = parseInt(minSubs || "1000", 10);
  let maxAgeDate = null;
  if (maxAgeMonths && maxAgeMonths !== "any") {
    maxAgeDate = new Date();
    maxAgeDate.setMonth(maxAgeDate.getMonth() - parseInt(maxAgeMonths, 10));
  }

  try {
    const searchQuery = `"${query}" (おすすめ OR 紹介) (YouTuber OR ユーチューバー OR チャンネル) blog`;
    const searchTargetUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    
    const htmlText = await fetchHtmlWithProxy(searchTargetUrl);
    const blogUrls = extractBlogUrlsFromDDG(htmlText);
    if (blogUrls.length === 0) throw new Error("関連するブログ記事が見つかりませんでした。キーワードを変更してみてください。");

    const targetUrls = blogUrls.slice(0, 4);
    const channelIdsSet = new Set();
    const handlesSet = new Set();
    const videoIdsSet = new Set();

    await Promise.all(targetUrls.map(async (url) => {
      try {
        const content = await fetchHtmlWithProxy(url);
        const extracted = extractYoutubeLinks(content);
        extracted.channelIds.forEach(id => channelIdsSet.add(id));
        extracted.handles.forEach(h => handlesSet.add(h));
        extracted.videoIds.forEach(v => videoIdsSet.add(v));
      } catch (e) {
        console.warn(`ブログの読み込みに失敗しました (${url}):`, e);
      }
    }));

    const resolvedIds = await resolveHandlesToIds(apiKey, [...handlesSet]);
    resolvedIds.forEach(id => channelIdsSet.add(id));

    const channelIdsFromVideos = await resolveVideosToChannelIds(apiKey, [...videoIdsSet]);
    channelIdsFromVideos.forEach(id => channelIdsSet.add(id));

    const filteredChannelIds = [...channelIdsSet].filter(id => !existingIds.has(id));
    if (filteredChannelIds.length === 0) return [];

    return await fetchAndFilterChannels(apiKey, filteredChannelIds, category, minSubLimit, maxAgeDate, existingIds);

  } catch (error) {
    console.error("ブログ自動巡回収集エラー:", error);
    throw error;
  }
}

/**
 * ③ テキスト（コピペ）解析収集
 */
window.collectFromCopiedText = async function(apiKey, text, category, existingChannels, minSubs, maxAgeMonths) {
  if (!apiKey) throw new Error("APIキーが入力されていません。");
  if (!text.trim()) throw new Error("貼り付けられたテキストが空です。");

  const existingIds = new Set(existingChannels.map(ch => ch.id));
  const minSubLimit = parseInt(minSubs || "1000", 10);
  let maxAgeDate = null;
  if (maxAgeMonths && maxAgeMonths !== "any") {
    maxAgeDate = new Date();
    maxAgeDate.setMonth(maxAgeDate.getMonth() - parseInt(maxAgeMonths, 10));
  }

  try {
    const extracted = extractYoutubeLinks(text);
    const channelIdsSet = new Set(extracted.channelIds);
    
    const resolvedIds = await resolveHandlesToIds(apiKey, extracted.handles);
    resolvedIds.forEach(id => channelIdsSet.add(id));

    const channelIdsFromVideos = await resolveVideosToChannelIds(apiKey, extracted.videoIds);
    channelIdsFromVideos.forEach(id => channelIdsSet.add(id));

    const filteredChannelIds = [...channelIdsSet].filter(id => !existingIds.has(id));
    if (filteredChannelIds.length === 0) {
      throw new Error("貼り付けられたテキストから、新しいYouTubeのリンクを見つけられませんでした。");
    }

    return await fetchAndFilterChannels(apiKey, filteredChannelIds, category, minSubLimit, maxAgeDate, existingIds);

  } catch (error) {
    console.error("コピペ解析エラー:", error);
    throw error;
  }
}

// --- 共通ヘルパー関数 ---

/**
 * 複数のCORSプロキシを自動で切り替えてフェッチする
 */
async function fetchHtmlWithProxy(targetUrl) {
  const proxies = [
    url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    url => `https://api.codetabs.com/v1/proxy?url=${encodeURIComponent(url)}`,
    url => `https://thingproxy.freeboard.io/fetch/${url}`
  ];

  let lastError = null;

  for (const getProxyUrl of proxies) {
    try {
      const proxyUrl = getProxyUrl(targetUrl);
      const response = await fetch(proxyUrl);
      if (response.ok) {
        return await response.text();
      }
    } catch (e) {
      console.warn(`プロキシでの取得失敗、別プロキシを試します:`, e);
      lastError = e;
    }
  }

  throw new Error("CORSプロキシサーバーとの接続に失敗しました。");
}

// DuckDuckGoのHTML検索結果から外部のブログ記事URLを抽出する
function extractBlogUrlsFromDDG(html) {
  const urls = [];
  const regex = /href="\/\/duckduckgo\.com\/l\/\?kh=-1&amp;uddg=([^"]+)"/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const rawUrl = decodeURIComponent(match[1]);
    if (!rawUrl.includes("youtube.com") && !rawUrl.includes("twitter.com") && !rawUrl.includes("x.com") && !rawUrl.includes("duckduckgo.com") && rawUrl.startsWith("http")) {
      urls.push(rawUrl);
    }
  }
  return [...new Set(urls)];
}

// YouTubeの各種リンクをテキストから高度に抽出する
function extractYoutubeLinks(text) {
  const channelIds = new Set();
  const handles = new Set();
  const videoIds = new Set();

  const channelRegex = /(?:youtube\.com\/channel\/|youtube\.com\/c\/)?(UC[a-zA-Z0-9_-]{22})/gi;
  let match;
  while ((match = channelRegex.exec(text)) !== null) {
    channelIds.add(match[1]);
  }

  const handleRegex = /(?:youtube\.com\/@|(?:\s|^)@)([a-zA-Z0-9_.-]+)/gi;
  while ((match = handleRegex.exec(text)) !== null) {
    const cleanHandle = match[1].split(/[^a-zA-Z0-9_.-]/)[0];
    if (cleanHandle && cleanHandle.length >= 3 && cleanHandle.length <= 30) {
      handles.add("@" + cleanHandle);
    }
  }

  const videoRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/gi;
  while ((match = videoRegex.exec(text)) !== null) {
    videoIds.add(match[1]);
  }

  return {
    channelIds: [...channelIds],
    handles: [...handles],
    videoIds: [...videoIds]
  };
}

// ハンドル名（@name）を一括で本物のチャンネルID（UC...）に解決する (コスト: 1クォータ)
async function resolveHandlesToIds(apiKey, handles) {
  const ids = [];
  if (handles.length === 0) return ids;

  const targetHandles = handles.slice(0, 15);

  await Promise.all(targetHandles.map(async (handle) => {
    try {
      const cleanHandle = handle.startsWith("@") ? handle.substring(1) : handle;
      const url = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          ids.push(data.items[0].id);
        }
      }
    } catch (e) {
      console.warn(`ハンドルの解決に失敗しました (${handle}):`, e);
    }
  }));

  return ids;
}

// 抽出された動画IDから、投稿主（チャンネルID）を特定する (コスト: 1クォータ)
async function resolveVideosToChannelIds(apiKey, videoIds) {
  const ids = [];
  if (videoIds.length === 0) return ids;

  const targetVideoIds = videoIds.slice(0, 20);
  const videoIdsParam = targetVideoIds.join(",");
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIdsParam}&key=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.items) {
        data.items.forEach(item => {
          if (item.snippet?.channelId) {
            ids.push(item.snippet.channelId);
          }
        });
      }
    }
  } catch (e) {
    console.warn("動画IDからのチャンネル特定に失敗しました:", e);
  }
  return ids;
}

/**
 * 💡 改善: チャンネルのコメント欄から「イケメン/かっこいい」等のキーワードをスキャンする (コスト: 1クォータ)
 * コメントが0件の新規チャンネルの場合は判定不能として通過させます。
 */
async function checkCommentsForKeywords(apiKey, channelId, category) {
  // イケメンまたは可愛い系カテゴリーのみ適用
  let targetKeywords = [];
  if (category === "ikemen") {
    targetKeywords = ["イケメン", "かっこいい", "格好いい", "イケボ", "声が好き", "顔が良い", "目の保養", "男前", "イケオジ", "ハンサム", "handsome", "cute guy"];
  } else if (category === "kawaii") {
    targetKeywords = ["可愛い", "かわいい", "カワイイ", "美人", "美女", "お姉さん", "綺麗", "推せる", "cute girl", "beautiful"];
  } else {
    return true; // その他のカテゴリーは無条件でパス
  }

  try {
    // チャンネル全体のコメントスレッドを取得 (最大20件)
    const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&allThreadsRelatedToChannelId=${channelId}&maxResults=20&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return true; // エラー時は念のため通過させる

    const data = await response.json();
    const items = data.items || [];
    
    // コメントが1件もない始めたてのチャンネルは、選別できないため「合格（通過）」とする
    if (items.length === 0) return true;

    let matchCount = 0;
    for (const item of items) {
      const commentText = item.snippet?.topLevelComment?.snippet?.textOriginal || "";
      const lowerText = commentText.toLowerCase();
      
      const hasKeyword = targetKeywords.some(kw => lowerText.includes(kw));
      if (hasKeyword) {
        matchCount++;
      }
    }

    // 20件のコメント中、1回でも該当ワードがあれば合格とみなす（新人のコメント数を配慮）
    return matchCount >= 1;

  } catch (e) {
    console.error("コメント解析失敗:", e);
    return true; // エラー時はスルー
  }
}

// チャンネルIDの一覧からステータスを取得し、条件でフィルタリングして完全なデータ配列を構築する
async function fetchAndFilterChannels(apiKey, channelIds, category, minSubLimit, maxAgeDate, existingIds) {
  const newChannels = [];
  const channelIdsParam = channelIds.slice(0, 50).join(",");
  
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelIdsParam}&key=${apiKey}`;
  const channelResponse = await fetch(channelUrl);
  
  if (!channelResponse.ok) {
    throw new Error("チャンネル情報の取得に失敗しました。");
  }
  
  const channelData = await channelResponse.json();
  const channelsList = channelData.items || [];

  for (const channel of channelsList) {
    const stats = channel.statistics;
    const snippet = channel.snippet;
    const contentDetails = channel.contentDetails;
    const subCount = parseInt(stats.subscriberCount || "0", 10);
    
    const publishedAt = new Date(snippet.publishedAt);
    const isNewChannel = !maxAgeDate || (publishedAt >= maxAgeDate);

    // 基本条件（登録者数・開設時期）のチェック
    if (subCount >= minSubLimit && subCount <= 100000 && isNewChannel) {
      if (!existingIds.has(channel.id)) {
        // 💡 改善: コメント欄をスキャンし「イケメン/可愛い」の客観的評価があるか選別
        const isQualified = await checkCommentsForKeywords(apiKey, channel.id, category);
        
        if (isQualified) {
          const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads;
          const videoId = uploadsPlaylistId ? await getLatestVideoIdFromPlaylist(apiKey, uploadsPlaylistId) : "dQw4w9WgXcQ";

          newChannels.push({
            id: channel.id,
            title: snippet.title,
            description: snippet.description || "説明はありません。",
            thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
            subscriberCount: subCount.toString(),
            category: category,
            tags: [category, "クローラー発掘", "おすすめ"],
            url: `https://www.youtube.com/channel/${channel.id}`,
            featuredVideoId: videoId
          });
        }
      }
    }
  }

  return newChannels;
}

// プレイリストアイテムAPIを使う (コスト: 1クォータ)
async function getLatestVideoIdFromPlaylist(apiKey, playlistId) {
  try {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=1&key=${apiKey}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return data.items[0].snippet?.resourceId?.videoId || "dQw4w9WgXcQ";
      }
    }
  } catch (e) {
    console.error("プレイリストからの動画取得失敗:", e);
  }
  return "dQw4w9WgXcQ";
}

/**
 * URLから「直接登録」する機能
 */
window.fetchSingleChannel = async function(apiKey, input, category) {
  let channelId = input.trim();

  if (channelId.includes("youtube.com") || channelId.includes("youtu.be")) {
    if (channelId.includes("/channel/")) {
      channelId = channelId.split("/channel/")[1].split("/")[0].split("?")[0];
    } else if (channelId.includes("/c/")) {
      const customName = channelId.split("/c/")[1].split("/")[0].split("?")[0];
      channelId = await resolveHandlesToIds(apiKey, [customName]).then(ids => ids[0] || null);
      if (!channelId) throw new Error("カスタムURLの解決に失敗しました。");
    } else if (channelId.includes("/@")) {
      const handle = channelId.split("/@")[1].split("/")[0].split("?")[0];
      channelId = await resolveHandlesToIds(apiKey, ["@" + handle]).then(ids => ids[0] || null);
      if (!channelId) throw new Error("ハンドルURLの解決に失敗しました。");
    } else {
      throw new Error("チャンネルURLの形式が認識できません。");
    }
  }

  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`;
  const response = await fetch(channelUrl);
  if (!response.ok) throw new Error("チャンネル情報の取得に失敗しました。");

  const data = await response.json();
  if (!data.items || data.items.length === 0) throw new Error("チャンネルが見つかりませんでした。");

  const channel = data.items[0];
  const stats = channel.statistics;
  const snippet = channel.snippet;
  const contentDetails = channel.contentDetails;
  
  const uploadsPlaylistId = contentDetails?.relatedPlaylists?.uploads;
  const videoId = uploadsPlaylistId ? await getLatestVideoIdFromPlaylist(apiKey, uploadsPlaylistId) : "dQw4w9WgXcQ";

  return {
    id: channel.id,
    title: snippet.title,
    description: snippet.description || "説明はありません。",
    thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "",
    subscriberCount: stats.subscriberCount || "0",
    category: category,
    tags: [category, "直接登録"],
    url: `https://www.youtube.com/channel/${channel.id}`,
    featuredVideoId: videoId
  };
}
