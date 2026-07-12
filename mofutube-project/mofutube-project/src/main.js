// --- 状態管理 ---
let channels = [...window.initialChannels];
let customChannels = [];
let favorites = [];
let activeCategory = "all";
let showFavoritesOnly = false;
window.isAdminMode = false;

// --- 初期化処理 ---
document.addEventListener("DOMContentLoaded", () => {
  // 1. ローカルストレージからカスタム収集チャンネルを読み込み
  const savedCustom = localStorage.getItem("mofutube_custom_channels");
  if (savedCustom) {
    customChannels = JSON.parse(savedCustom);
    channels = [...window.initialChannels, ...customChannels];
  }

  // 2. ローカルストレージからお気に入りを読み込み
  const savedFavs = localStorage.getItem("mofutube_favorites");
  if (savedFavs) {
    favorites = JSON.parse(savedFavs);
  }

  // 3. APIキーの保存値を読み込み
  const savedApiKey = localStorage.getItem("mofutube_api_key");
  if (savedApiKey) {
    document.getElementById("api-key-input").value = savedApiKey;
  }

  // 4. 秘密のパラメータ (?edit=mofu) をチェックして管理者ボタンを表示 ＆ クリーンアップ
  const params = new URLSearchParams(window.location.search);
  if (params.get("edit") === "mofu") {
    window.isAdminMode = true;
    const adminBtn = document.getElementById("admin-open-btn");
    if (adminBtn) {
      adminBtn.style.display = "inline-flex";
    }
    // 💡 管理者がアクセスした際、裏側で自動的に10万人超えチャンネルを検出し除外する
    if (savedApiKey) {
      cleanupFamousChannels(savedApiKey);
    }
  }

  // 5. 初回描画
  renderChannels();
  setupEventListeners();

  // アイコンの初期化
  lucide.createIcons();
});

// --- イベントリスナーの設定 ---
function setupEventListeners() {
  // カテゴリータブの切り替え
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      e.target.classList.add("active");
      activeCategory = e.target.getAttribute("data-cat");
      
      // 💡 系統フィルターの選択肢をカテゴリーに合わせて動的に書き換える
      updateVibeFilterOptions(activeCategory);
      
      renderChannels();
    });
  });

  // 検索入力の監視
  document.getElementById("search-input").addEventListener("input", renderChannels);

  // フィルター各種の変更
  document.getElementById("vibe-filter").addEventListener("change", renderChannels);
  document.getElementById("genre-filter").addEventListener("change", renderChannels);
  document.getElementById("country-filter").addEventListener("change", renderChannels);

  // お気に入りトグルボタン
  document.getElementById("fav-toggle-btn").addEventListener("click", (e) => {
    showFavoritesOnly = !showFavoritesOnly;
    const btn = e.currentTarget;
    if (showFavoritesOnly) {
      btn.style.background = "var(--color-kawaii)";
      btn.style.color = "var(--bg-dark)";
      btn.style.borderColor = "var(--color-kawaii)";
    } else {
      btn.style.background = "";
      btn.style.color = "";
      btn.style.borderColor = "";
    }
    renderChannels();
  });

  // ロゴクリックで初期状態に戻す
  document.getElementById("logo-btn").addEventListener("click", () => {
    activeCategory = "all";
    showFavoritesOnly = false;
    document.getElementById("search-input").value = "";
    document.getElementById("vibe-filter").value = "all";
    document.getElementById("genre-filter").value = "all";
    document.getElementById("country-filter").value = "all";
    
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelector('.tab-btn[data-cat="all"]').classList.add("active");
    
    const favBtn = document.getElementById("fav-toggle-btn");
    favBtn.style.background = "";
    favBtn.style.color = "";
    favBtn.style.borderColor = "";
    
    renderChannels();
  });

  // モーダルの開閉
  const videoModal = document.getElementById("video-modal");
  const adminModal = document.getElementById("admin-modal");

  // 動画モーダルを閉じる
  document.getElementById("video-close-btn").addEventListener("click", () => {
    videoModal.classList.remove("active");
    document.getElementById("video-iframe").src = ""; // 再生を停止
  });

  // 管理者モーダルを開く
  document.getElementById("admin-open-btn").addEventListener("click", () => {
    // 💡 初期表示に合わせて管理者系統選択を更新
    const catSelect = document.getElementById("category-select");
    updateAdminVibeOptions(catSelect.value);
    
    adminModal.classList.add("active");
  });

  // 管理画面：追加先カテゴリー変更時に、登録系統の選択肢を切り替える
  document.getElementById("category-select").addEventListener("change", (e) => {
    updateAdminVibeOptions(e.target.value);
  });

  // 管理者モーダルを閉じる
  document.getElementById("admin-close-btn").addEventListener("click", () => {
    adminModal.classList.remove("active");
  });

  // 属性編集モーダルを閉じる
  document.getElementById("edit-close-btn").addEventListener("click", () => {
    document.getElementById("edit-modal").classList.remove("active");
  });

  // 属性編集画面：カテゴリー変更時に、系統の選択肢を切り替える
  document.getElementById("edit-category-select").addEventListener("change", (e) => {
    updateEditVibeOptions(e.target.value);
  });

  // 属性編集の保存
  document.getElementById("edit-save-btn").addEventListener("click", handleSaveEdit);

  // モーダルの背景クリックで閉じる
  window.addEventListener("click", (e) => {
    if (e.target === videoModal) {
      videoModal.classList.remove("active");
      document.getElementById("video-iframe").src = "";
    }
    if (e.target === adminModal) {
      adminModal.classList.remove("active");
    }
  });

  // コレクター自動収集開始ボタン
  document.getElementById("collect-start-btn").addEventListener("click", handleCollection);

  // 収集モード切り替えのイベント監視
  document.querySelectorAll('input[name="collect-mode"]').forEach(radio => {
    radio.addEventListener("change", (e) => {
      const mode = e.target.value;
      const searchGroup = document.getElementById("search-query-group");
      const textGroup = document.getElementById("copied-text-group");
      const ytFilters = document.querySelectorAll(".filter-yt-only");

      if (mode === "youtube") {
        searchGroup.style.display = "block";
        textGroup.style.display = "none";
        ytFilters.forEach(el => el.style.display = "block");
      } else if (mode === "blog") {
        searchGroup.style.display = "block";
        textGroup.style.display = "none";
        ytFilters.forEach(el => el.style.display = "none");
      } else if (mode === "text") {
        searchGroup.style.display = "none";
        textGroup.style.display = "block";
        ytFilters.forEach(el => el.style.display = "none");
      }
    });
  });

  // チャンネルURL直接追加ボタン
  document.getElementById("direct-add-btn").addEventListener("click", handleDirectAdd);

  // データエクスポートボタン
  document.getElementById("export-btn").addEventListener("click", handleExport);
}

// --- 描画ロジック ---
function renderChannels() {
  const grid = document.getElementById("channel-grid");
  grid.innerHTML = "";

  const searchText = document.getElementById("search-input").value.toLowerCase();
  const vibeFilter = document.getElementById("vibe-filter").value;
  const genreFilter = document.getElementById("genre-filter").value;
  const countryFilter = document.getElementById("country-filter").value;

  // フィルター処理
  const filtered = channels.filter(ch => {
    // 💡 特化対策: 美男美女（ikemen / kawaii）のみを表示し、動物・食べ物は一時的にお休み
    const allowedCategories = ["ikemen", "kawaii"];
    if (!allowedCategories.includes(ch.category)) {
      return false;
    }

    // 1. カテゴリーフィルター
    if (activeCategory !== "all" && ch.category !== activeCategory) {
      return false;
    }

    // 2. お気に入りフィルター
    if (showFavoritesOnly && !favorites.includes(ch.id)) {
      return false;
    }

    // 3. 検索フィルター (名前、説明、タグ)
    const matchesSearch = ch.title.toLowerCase().includes(searchText) || 
                          ch.description.toLowerCase().includes(searchText) ||
                          ch.tags.some(tag => tag.toLowerCase().includes(searchText));
    if (!matchesSearch) return false;

    // 4. 系統（vibe）フィルター
    if (vibeFilter !== "all") {
      if (vibeFilter === "💎 かっこいい系") {
        if (!ch.tags.includes("かっこいい系")) return false;
      } else if (vibeFilter === "💎 かわいい系") {
        if (ch.category !== "ikemen" || !ch.tags.includes("かわいい系")) return false;
      } else if (vibeFilter === "🌸 きれい系") {
        if (!ch.tags.includes("きれい系")) return false;
      } else if (vibeFilter === "🌸 かわいい系") {
        if (ch.category !== "kawaii" || !ch.tags.includes("かわいい系")) return false;
      }
    }

    // 5. ジャンル（genre）フィルター
    if (genreFilter !== "all" && !ch.tags.includes(genreFilter)) {
      return false;
    }

    // 6. 地域・国籍（country）フィルター
    if (countryFilter !== "all" && !ch.tags.includes(countryFilter)) {
      return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
        <i data-lucide="frown" style="width: 48px; height: 48px; margin-bottom: 1rem;"></i>
        <p>条件に合うチャンネルが見つかりませんでした。</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // カード生成
  filtered.forEach(ch => {
    const isFav = favorites.includes(ch.id);
    const card = document.createElement("div");
    card.className = "channel-card";
    
    // カテゴリーごとの色設定
    let accentColor = "var(--color-animal)";
    if (ch.category === "ikemen") accentColor = "var(--color-ikemen)";
    if (ch.category === "kawaii") accentColor = "var(--color-kawaii)";
    if (ch.category === "food") accentColor = "var(--color-food)";

    card.style.setProperty("--card-accent", accentColor);
    card.style.setProperty("--border-hover", accentColor);

    // 管理者判定
    const isAdmin = window.isAdminMode;

    card.innerHTML = `
      ${isAdmin ? `
        <button class="btn-edit-channel" data-id="${ch.id}" title="属性を編集">
          <i data-lucide="edit-2" style="width: 16px; height: 16px;"></i>
        </button>
        <button class="btn-delete-channel" data-id="${ch.id}" title="このチャンネルを名鑑から削除">
          <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
        </button>
      ` : ''}
      <div class="card-header-img" style="background: linear-gradient(135deg, rgba(20,25,45,0.8), rgba(40,30,60,0.8))">
        <div class="channel-thumbnail-wrapper">
          <img class="channel-thumbnail" src="${ch.thumbnail}" alt="${ch.title}" onerror="this.src='https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=80&h=80&fit=crop'">
        </div>
      </div>
      <div class="card-body">
        <span class="category-tag">${getCategoryName(ch.category)}</span>
        <h3 class="channel-title">${escapeHTML(ch.title)}</h3>
        <div class="sub-count">
          <i data-lucide="users" style="width: 14px; height: 14px;"></i> 
          登録者数: ${formatSubs(ch.subscriberCount)}
        </div>
        <p class="channel-desc">${escapeHTML(ch.description)}</p>
        <div class="card-footer">
          <button class="btn-card btn-card-watch" data-id="${ch.id}">
            <i data-lucide="play" style="width: 16px; height: 16px;"></i> 動画を見る
          </button>
          <button class="btn-card btn-card-fav ${isFav ? 'active' : ''}" data-id="${ch.id}">
            <i data-lucide="heart" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
      </div>
    `;

    // 編集イベントの登録
    const editBtn = card.querySelector(".btn-edit-channel");
    if (editBtn) {
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const channelId = e.currentTarget.getAttribute("data-id");
        openEditModal(channelId);
      });
    }

    // 削除イベントの登録
    const deleteBtn = card.querySelector(".btn-delete-channel");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const channelId = e.currentTarget.getAttribute("data-id");
        handleDeleteChannel(channelId);
      });
    }

    // 「動画を見る」イベント
    card.querySelector(".btn-card-watch").addEventListener("click", () => {
      openVideoModal(ch);
    });

    // 「お気に入り」イベント
    card.querySelector(".btn-card-fav").addEventListener("click", (e) => {
      toggleFavorite(ch.id, e.currentTarget);
    });

    grid.appendChild(card);
  });

  lucide.createIcons();
}

// --- ユーティリティ関数 ---
function getCategoryName(cat) {
  switch (cat) {
    case "animal": return "🐾 動物";
    case "ikemen": return "💎 イケメン";
    case "kawaii": return "🌸 可愛い";
    case "food": return "🍰 食べ物";
    default: return "その他";
  }
}

function formatSubs(countStr) {
  const count = parseInt(countStr, 10);
  if (isNaN(count)) return countStr;
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + "万人";
  }
  return count.toLocaleString() + "人";
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- お気に入りロジック ---
function toggleFavorite(id, btn) {
  const index = favorites.indexOf(id);
  if (index === -1) {
    favorites.push(id);
    btn.classList.add("active");
  } else {
    favorites.splice(index, 1);
    btn.classList.remove("active");
  }
  localStorage.setItem("mofutube_favorites", JSON.stringify(favorites));

  // お気に入り画面を表示している場合は、再描画してカードを非表示にする
  if (showFavoritesOnly) {
    renderChannels();
  }
}

// --- 動画再生モーダルを開く ---
function openVideoModal(channel) {
  const modal = document.getElementById("video-modal");
  const iframe = document.getElementById("video-iframe");
  
  // YouTubeの埋め込みURLを設定 (自動再生付き)
  iframe.src = `https://www.youtube.com/embed/${channel.featuredVideoId}?autoplay=1`;
  
  document.getElementById("modal-channel-title").textContent = channel.title;
  document.getElementById("modal-channel-desc").textContent = channel.description;

  modal.classList.add("active");
}

// --- 収集機能の実行 ---
async function handleCollection() {
  const apiKey = document.getElementById("api-key-input").value.trim();
  const query = document.getElementById("search-query-input").value.trim();
  const copiedText = document.getElementById("copied-text-input").value.trim();
  const category = document.getElementById("category-select").value;
  const langOption = document.getElementById("lang-select").value;
  const activePeriod = document.getElementById("active-period-select").value;
  const searchOrder = document.getElementById("order-select").value;
  const minSubs = document.getElementById("min-subs-select").value;
  const maxAgeMonths = document.getElementById("channel-age-select").value;
  const statusLabel = document.getElementById("collector-status-label");
  const resultsDiv = document.getElementById("collector-results");

  // 現在の収集モードの取得
  const mode = document.querySelector('input[name="collect-mode"]:checked').value;

  if (!apiKey) {
    alert("YouTube Data APIキーを入力してください。");
    return;
  }

  // 入力チェックの分岐
  if (mode !== "text" && !query) {
    alert("検索キーワードを入力してください。");
    return;
  }
  if (mode === "text" && !copiedText) {
    alert("コピペしたテキストを入力してください。");
    return;
  }

  // APIキーをローカルストレージに保存
  localStorage.setItem("mofutube_api_key", apiKey);

  // UIをロード中状態にする
  const startBtn = document.getElementById("collect-start-btn");
  const originalBtnHTML = startBtn.innerHTML;
  startBtn.disabled = true;
  startBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> 実行中...`;
  lucide.createIcons();

  resultsDiv.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">処理を実行中... しばらくお待ちください。</div>`;

  try {
    let newChannels = [];

    // モードごとの処理分岐
    if (mode === "youtube") {
      newChannels = await window.collectNewChannels(apiKey, query, category, channels, langOption, activePeriod, searchOrder, minSubs, maxAgeMonths);
    } else if (mode === "blog") {
      resultsDiv.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">🌐 Google検索＆ブログ記事を読み込み中（15〜30秒ほどかかる場合があります）...</div>`;
      newChannels = await window.collectFromBlogs(apiKey, query, category, channels, minSubs, maxAgeMonths);
    } else if (mode === "text") {
      newChannels = await window.collectFromCopiedText(apiKey, copiedText, category, channels, minSubs, maxAgeMonths);
    }

    if (newChannels.length === 0) {
      resultsDiv.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted);">
          条件に合う新しいチャンネル（登録者数1,000人〜10万人かつ未紹介）は見つかりませんでした。
        </div>
      `;
      statusLabel.textContent = `候補チャンネル (0件)`;
    } else {
      statusLabel.textContent = `見つかった候補 (${newChannels.length}件) - 載せたいものを選択して追加してください`;

      // 候補リストを生成（この段階ではまだ登録しない）
      resultsDiv.innerHTML = "";
      newChannels.forEach((ch, idx) => {
        const item = document.createElement("div");
        item.className = "collected-item";
        item.innerHTML = `
          <div class="collected-info" style="max-width: 70%;">
            <a href="${ch.url}" target="_blank" class="collected-name" style="color: var(--color-ikemen); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;" title="クリックしてYouTubeで確認">${escapeHTML(ch.title)} 🔗</a>
            <span class="collected-subs">登録者数: ${formatSubs(ch.subscriberCount)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-top: 0.2rem;">${escapeHTML(ch.description)}</span>
          </div>
          <button class="btn btn-primary btn-add-candidate" data-index="${idx}" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
            <i data-lucide="plus"></i> サイトに追加
          </button>
        `;

        // 個別追加ボタンのイベント
        item.querySelector(".btn-add-candidate").addEventListener("click", (e) => {
          const btn = e.currentTarget;
          
          // 重複チェック
          if (channels.some(existing => existing.id === ch.id)) {
            alert("このチャンネルはすでに登録されています。");
            return;
          }

          // 💡 管理画面で指定されている属性（タグ）を取得してチャンネルデータに付加
          const vibeVal = document.getElementById("admin-vibe-select").value;
          const genreVal = document.getElementById("admin-genre-select").value;
          const countryVal = document.getElementById("admin-country-select").value;
          
          ch.tags = [...new Set([...ch.tags, vibeVal, genreVal, countryVal])];

          // 状態（メモリ）に追加
          customChannels.push(ch);
          channels = [...window.initialChannels, ...customChannels];

          // ローカルストレージに保存
          localStorage.setItem("mofutube_custom_channels", JSON.stringify(customChannels));

          // ボタンの見た目を「追加完了」に変更
          btn.disabled = true;
          btn.style.background = "rgba(255,255,255,0.05)";
          btn.style.borderColor = "var(--border-glass)";
          btn.style.color = "var(--text-muted)";
          btn.innerHTML = `<i data-lucide="check"></i> 追加済み`;
          lucide.createIcons();

          // メインのグリッドを再描画してサイトに反映
          renderChannels();
        });

        resultsDiv.appendChild(item);
      });
      lucide.createIcons();
    }
  } catch (error) {
    alert("収集エラー: " + error.message);
    if (mode === "blog" && (error.message.includes("CORS") || error.message.includes("フェッチ") || error.message.includes("fetch"))) {
      resultsDiv.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; border: 1px dashed var(--color-kawaii); border-radius: 12px; background: rgba(255,100,180,0.05); margin-top: 1rem;">
          <p style="color: var(--color-kawaii); font-weight: 600; margin-bottom: 0.5rem;">⚠️ 自動巡回エラー</p>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem; line-height: 1.4;">
            お使いのセキュリティソフトやブラウザの保護機能により、中継サーバーへの通信が遮断されています。
          </p>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.2rem; line-height: 1.4;">
            代わりに、まとめブログの記事を丸ごとコピーして貼り付けるだけで一瞬で抽出できる「コピペ解析モード」をご利用ください！
          </p>
          <button class="btn btn-primary" id="switch-to-paste-btn" style="margin: 0 auto; font-size: 0.85rem;">
            📝 コピペ解析モードに切り替える
          </button>
        </div>
      `;
      
      document.getElementById("switch-to-paste-btn").addEventListener("click", () => {
        document.querySelector('input[name="collect-mode"][value="text"]').checked = true;
        document.querySelector('input[name="collect-mode"][value="text"]').dispatchEvent(new Event('change'));
        resultsDiv.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">テキストを貼り付けて実行してください。</div>`;
      });
    } else {
      resultsDiv.innerHTML = `<div style="padding: 2rem; text-align: center; color: hsl(0, 85%, 65%);">エラーが発生しました: ${escapeHTML(error.message)}</div>`;
    }
  } finally {
    startBtn.disabled = false;
    startBtn.innerHTML = originalBtnHTML;
    lucide.createIcons();
  }
}

// --- データのエクスポート機能 ---
// 収集したデータを含んだ channels.js ファイルを生成し、ダウンロードさせます。
function handleExport() {
  // 保存用のファイル形式にフォーマット
  const fileContent = `// 初期登録されているYouTuber（チャンネル）のデータベース
// このファイルは自動収集ツールからエクスポートされました。
// このファイルを mofutube-project/src/data/channels.js に上書き保存してください。

window.initialChannels = ${JSON.stringify(channels, null, 2)};
`;

  const blob = new Blob([fileContent], { type: "application/javascript;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "channels.js";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// --- チャンネルURL直接追加の実行 ---
async function handleDirectAdd() {
  const apiKey = document.getElementById("api-key-input").value.trim();
  const input = document.getElementById("direct-url-input").value.trim();
  const category = document.getElementById("category-select").value;
  const statusLabel = document.getElementById("collector-status-label");
  const resultsDiv = document.getElementById("collector-results");

  if (!apiKey) {
    alert("YouTube Data APIキーを入力してください。");
    return;
  }
  if (!input) {
    alert("チャンネルのURLまたはIDを入力してください。");
    return;
  }

  // 入力された文字列そのままで重複チェック
  if (channels.some(ch => ch.id === input || ch.url.includes(input))) {
    alert("このチャンネルはすでに登録されています。");
    return;
  }

  // UIをロード中状態にする
  const addBtn = document.getElementById("direct-add-btn");
  const originalBtnHTML = addBtn.innerHTML;
  addBtn.disabled = true;
  addBtn.innerHTML = `<i data-lucide="loader" class="animate-spin"></i> 処理中...`;
  lucide.createIcons();

  resultsDiv.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">チャンネルのデータを取得中...</div>`;

  try {
    const newChannel = await window.fetchSingleChannel(apiKey, input, category);
    
    // API取得後のIDで重複チェック
    if (channels.some(ch => ch.id === newChannel.id)) {
      throw new Error("このチャンネルはすでに登録されています。");
    }

    // 💡 管理画面で指定されている属性（タグ）を取得してチャンネルデータに付加
    const vibeVal = document.getElementById("admin-vibe-select").value;
    const genreVal = document.getElementById("admin-genre-select").value;
    const countryVal = document.getElementById("admin-country-select").value;
    
    newChannel.tags = [...new Set([...newChannel.tags, vibeVal, genreVal, countryVal])];

    // 状態に追加
    customChannels = [...customChannels, newChannel];
    channels = [...window.initialChannels, ...customChannels];

    // ローカルストレージに保存
    localStorage.setItem("mofutube_custom_channels", JSON.stringify(customChannels));

    // 結果表示
    resultsDiv.innerHTML = `
      <div class="collected-item">
        <div class="collected-info">
          <a href="\${newChannel.url}" target="_blank" class="collected-name" style="color: var(--color-ikemen); text-decoration: underline; cursor: pointer; font-weight: 600; font-size: 0.95rem; display: block;" title="クリックしてYouTubeで確認">\${escapeHTML(newChannel.title)} 🔗</a>
          <span class="collected-subs">登録者数: \${formatSubs(newChannel.subscriberCount)}</span>
        </div>
        <span style="color: var(--color-animal); font-size: 0.8rem; font-weight: 600;">追加完了</span>
      </div>
    `;

    statusLabel.textContent = `チャンネル「\${newChannel.title}」を新しく追加しました！`;
    document.getElementById("direct-url-input").value = "";

    // メインのグリッドを再描画
    renderChannels();

  } catch (error) {
    alert("追加エラー: " + error.message);
    resultsDiv.innerHTML = `<div style="padding: 2rem; text-align: center; color: hsl(0, 85%, 65%);">エラーが発生しました: \${escapeHTML(error.message)}</div>`;
  } finally {
    addBtn.disabled = false;
    addBtn.innerHTML = originalBtnHTML;
    lucide.createIcons();
  }
}

/**
 * 💡 登録者数が10万人を超えたチャンネルを自動で「卒業（削除）」させるクリーンアップ機能
 */
async function cleanupFamousChannels(apiKey) {
  if (customChannels.length === 0) return;

  try {
    const ids = customChannels.map(ch => ch.id);
    const chunkSize = 50;
    let anyRemoved = false;
    let removedTitles = [];

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${chunk.join(",")}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];

        for (const item of items) {
          const subCount = parseInt(item.statistics?.subscriberCount || "0", 10);
          // 10万人を超えたので除外（卒業）
          if (subCount > 100000) {
            customChannels = customChannels.filter(ch => ch.id !== item.id);
            removedTitles.push(item.snippet?.title || item.id);
            anyRemoved = true;
          }
        }
      }
    }

    if (anyRemoved) {
      // 状態を更新
      channels = [...window.initialChannels, ...customChannels];
      localStorage.setItem("mofutube_custom_channels", JSON.stringify(customChannels));
      renderChannels();
      
      console.log("【卒業報告】10万人を超えたため自動除外されました：", removedTitles.join(", "));
      
      const statusLabel = document.getElementById("collector-status-label");
      if (statusLabel) {
        statusLabel.textContent = `🎉 卒業: ${removedTitles.join(", ")} が登録者10万人を突破したため、自動除外されました！`;
      }
    }
  } catch (e) {
    console.warn("自動クリーンアップに失敗しました（API制限など）:", e);
  }
}

/**
 * 💡 カテゴリーに合わせて系統フィルターの選択肢を動的に切り替える
 */
function updateVibeFilterOptions(category) {
  const vibeFilter = document.getElementById("vibe-filter");
  if (!vibeFilter) return;

  const prevValue = vibeFilter.value; // 現在の選択値を保存

  if (category === "ikemen") {
    vibeFilter.innerHTML = `
      <option value="all">✨ すべての系統</option>
      <option value="💎 かっこいい系">💎 かっこいい系</option>
      <option value="💎 かわいい系">💎 かわいい系</option>
    `;
  } else if (category === "kawaii") {
    vibeFilter.innerHTML = `
      <option value="all">✨ すべての系統</option>
      <option value="🌸 きれい系">🌸 きれい系</option>
      <option value="🌸 かわいい系">🌸 かわいい系</option>
    `;
  } else {
    vibeFilter.innerHTML = `
      <option value="all">✨ すべての系統</option>
      <option value="💎 かっこいい系">💎 かっこいい系</option>
      <option value="💎 かわいい系">💎 かわいい系</option>
      <option value="🌸 きれい系">🌸 きれい系</option>
      <option value="🌸 かわいい系">🌸 かわいい系</option>
    `;
  }

  // 選択値の復元
  if ([...vibeFilter.options].some(opt => opt.value === prevValue)) {
    vibeFilter.value = prevValue;
  } else {
    vibeFilter.value = "all";
  }
}

/**
 * 💡 管理画面の追加先カテゴリー変更時に、登録系統の選択肢を動的に切り替える
 */
function updateAdminVibeOptions(category) {
  const adminVibeSelect = document.getElementById("admin-vibe-select");
  if (!adminVibeSelect) return;

  adminVibeSelect.innerHTML = "";
  if (category === "ikemen") {
    adminVibeSelect.innerHTML = `
      <option value="かっこいい系">💎 かっこいい系</option>
      <option value="かわいい系">💎 かわいい系</option>
    `;
  } else if (category === "kawaii") {
    adminVibeSelect.innerHTML = `
      <option value="きれい系">🌸 きれい系</option>
      <option value="かわいい系">🌸 かわいい系</option>
    `;
  }
}

/**
 * 💡 チャンネル削除処理 (手動や自動で追加したカスタムチャンネルのみ削除可能)
 */
function handleDeleteChannel(channelId) {
  // 初期登録チャンネルは削除不可にする (整合性を保つため)
  const isInitial = window.initialChannels.some(ch => ch.id === channelId);
  if (isInitial) {
    alert("このチャンネルは初期登録データのため削除できません。（手動や自動で追加したカスタムチャンネルのみ削除可能です）");
    return;
  }

  const targetChan = customChannels.find(ch => ch.id === channelId);
  const chanName = targetChan ? targetChan.title : "このチャンネル";

  if (confirm(`「${chanName}」を名鑑から本当に削除しますか？`)) {
    // リストから除外
    customChannels = customChannels.filter(ch => ch.id !== channelId);
    channels = [...window.initialChannels, ...customChannels];
    
    // ローカルストレージを保存
    localStorage.setItem("mofutube_custom_channels", JSON.stringify(customChannels));
    
    // 再描画してサイトに即反映
    renderChannels();
    alert("削除しました。");
  }
}

/**
 * 💡 属性編集モーダルを開き、現在の値を反映する
 */
function openEditModal(channelId) {
  const ch = channels.find(item => item.id === channelId);
  if (!ch) return;

  document.getElementById("edit-channel-id").value = ch.id;
  document.getElementById("edit-channel-title").textContent = ch.title;
  document.getElementById("edit-category-select").value = ch.category;

  // 系統オプションの動的生成
  updateEditVibeOptions(ch.category);

  // 現在のタグをスキャンしてセレクトボックスの初期値にする
  const vibeTags = ["かっこいい系", "きれい系", "かわいい系"];
  const genreTags = ["Vlog", "美容", "ファッション", "ゲーム・雑談", "その他"];
  const countryTags = ["日本人", "韓国人", "外国人"];

  let currentVibe = "かっこいい系";
  if (ch.category === "kawaii") currentVibe = "きれい系";
  let currentGenre = "その他";
  let currentCountry = "日本人";

  ch.tags.forEach(tag => {
    if (vibeTags.includes(tag)) currentVibe = tag;
    if (genreTags.includes(tag)) currentGenre = tag;
    if (countryTags.includes(tag)) currentCountry = tag;
  });

  document.getElementById("edit-vibe-select").value = currentVibe;
  document.getElementById("edit-genre-select").value = currentGenre;
  document.getElementById("edit-country-select").value = currentCountry;

  // モーダルを表示
  document.getElementById("edit-modal").classList.add("active");
  lucide.createIcons();
}

/**
 * 💡 属性編集モーダルのカテゴリー変更時に、登録系統の選択肢を動的に切り替える
 */
function updateEditVibeOptions(category) {
  const editVibeSelect = document.getElementById("edit-vibe-select");
  if (!editVibeSelect) return;

  editVibeSelect.innerHTML = "";
  if (category === "ikemen") {
    editVibeSelect.innerHTML = `
      <option value="かっこいい系">💎 かっこいい系</option>
      <option value="かわいい系">💎 かわいい系</option>
    `;
  } else if (category === "kawaii") {
    editVibeSelect.innerHTML = `
      <option value="きれい系">🌸 きれい系</option>
      <option value="かわいい系">🌸 かわいい系</option>
    `;
  }
}

/**
 * 💡 編集した属性を保存する
 */
function handleSaveEdit() {
  const channelId = document.getElementById("edit-channel-id").value;
  const newCategory = document.getElementById("edit-category-select").value;
  const newVibe = document.getElementById("edit-vibe-select").value;
  const newGenre = document.getElementById("edit-genre-select").value;
  const newCountry = document.getElementById("edit-country-select").value;

  // 対象のチャンネルを探す (初期データ・カスタムデータの両方)
  let targetChan = customChannels.find(ch => ch.id === channelId);
  const isInitial = window.initialChannels.some(ch => ch.id === channelId);

  if (isInitial) {
    alert("このチャンネルは初期登録データのため属性を変更できません。（手動で追加したチャンネルのみ変更可能です）");
    return;
  }

  if (!targetChan) {
    alert("対象チャンネルが見つかりませんでした。");
    return;
  }

  // カテゴリーの更新
  targetChan.category = newCategory;

  // 既存の属性タグをすべて削除
  const filterTags = [
    "かっこいい系", "きれい系", "かわいい系",
    "Vlog", "美容", "ファッション", "ゲーム・雑談", "その他",
    "日本人", "韓国人", "外国人"
  ];
  targetChan.tags = targetChan.tags.filter(tag => !filterTags.includes(tag));

  // 新しい属性タグを追加
  targetChan.tags.push(newVibe);
  targetChan.tags.push(newGenre);
  targetChan.tags.push(newCountry);

  // 全体リストとカスタムリストを更新
  channels = [...window.initialChannels, ...customChannels];
  localStorage.setItem("mofutube_custom_channels", JSON.stringify(customChannels));

  // 再描画
  renderChannels();

  // モーダルを閉じる
  document.getElementById("edit-modal").classList.remove("active");
  alert("属性の変更を保存しました！");
}
