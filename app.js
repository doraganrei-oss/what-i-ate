// --- Firebase Config & Setup ---
const firebaseConfig = {
    apiKey: "AIzaSyC8bfzol0oGji86823dr8h2r4CIQjfbR0U",
    authDomain: "whatiate-7d5ba.firebaseapp.com",
    projectId: "whatiate-7d5ba",
    storageBucket: "whatiate-7d5ba.firebasestorage.app",
    messagingSenderId: "465598882926",
    appId: "1:465598882926:web:95c9343182a457178bf27f",
    measurementId: "G-2V65GWTWRE"
};
let db = null;

// --- Gacha Administrator Config ---
// ※ここにあなたのGoogleログイン用メールアドレスを記載してください。
// このリストに入っているメールアドレスでログインしたユーザーのみ、レシピの追加・管理（削除含む）ができるようになります。
const ADMIN_EMAILS = [
    "doraganrei@gmail.com",
    "doraganrei.oss@gmail.com",
    "reido.zero@gmail.com"
];

// --- Pre-defined Gacha Menu Database ---
const GACHA_DB = [
    { title: "とろとろオムライス", desc: "ふわふわの卵にデミグラスソースがたっぷりかかった王道洋食。自炊ならバター多めが吉！", category: "self-cooked", emoji: "🍳" },
    { title: "旨味たっぷり醤油ラーメン", desc: "モチモチ麺と出汁の利いたスープ。たまには外食でチャーシュー多めで贅沢に！", category: "eating-out", emoji: "🍜" },
    { title: "新鮮アボカドエッグトースト", desc: "完熟アボカドを潰してトーストに乗せ、目玉焼きを乗せるだけ。ヘルシーで大満足！", category: "self-cooked", emoji: "🍞" },
    { title: "ジューシー唐揚げ弁当", desc: "サクサクジューシーな唐揚げはテイクアウトの王様。白米との相性は抜群！", category: "takeout", emoji: "🍱" },
    { title: "本格濃厚カルボナーラ", desc: "卵黄とチーズ、パンチェッタ（ベーコン）で作る濃厚パスタ。黒コショウをたっぷり振って。", category: "self-cooked", emoji: "🍝" },
    { title: "具だくさん具だくさん海鮮丼", desc: "マグロ、サーモン、イクラなど、海の幸を贅沢に盛り付けた丼。外食のご褒美に！", category: "eating-out", emoji: "🍣" },
    { title: "スパイシーインドカレー", desc: "ナンと一緒に食べる本格スパイスカレー。体を温めて代謝もアップ！", category: "eating-out", emoji: "🍛" },
    { title: "ふわふわパンケーキ", desc: "メープルシロップとバターをたっぷり乗せたおやつ。至福のコーヒータイムを。", category: "snack", emoji: "🥞" }
];

// --- Default Feed Posts (Initial Data) ---
const DEFAULT_POSTS = [
    {
        id: "post-1",
        username: "まい",
        avatar: "🐰",
        dishName: "アボカドエッグトースト",
        mealType: "morning",
        category: "self-cooked",
        rating: 4,
        comment: "アボカドがちょうど良く熟してた！半熟の目玉焼きを崩して食べると最高に美味しいです。忙しい朝でも簡単！",
        image: "images/toast.jpg",
        date: new Date().toISOString().split('T')[0], // Today
        deliciousCount: 18
    },
    {
        id: "post-2",
        username: "たろう",
        avatar: "🦊",
        dishName: "特製デミグラスオムライス",
        mealType: "lunch",
        category: "self-cooked",
        rating: 5,
        comment: "休日のランチにじっくりデミグラスソースを作りました。卵もいい感じにとろとろにできて大満足！",
        image: "images/omurice.jpg",
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        deliciousCount: 32
    },
    {
        id: "post-3",
        username: "さくら",
        avatar: "🐱",
        dishName: "濃厚醤油とんこつラーメン",
        mealType: "dinner",
        category: "eating-out",
        rating: 5,
        comment: "仕事帰りに気になっていたラーメン屋へ！スープが濃厚で、細麺によく絡んですごく美味しかったです。また行きたいな。",
        image: "images/ramen.jpg",
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0], // 2 days ago
        deliciousCount: 45
    },
    {
        id: "post-4",
        username: "ゆうた",
        avatar: "🐨",
        dishName: "苺たっぷり生クリームケーキ",
        mealType: "snack",
        category: "takeout",
        rating: 3,
        comment: "駅前のケーキ屋さんでおやつに購入。甘すぎず、イチゴの酸味が効いていてコーヒーにぴったりでした。",
        image: "images/cake.jpg",
        date: new Date(Date.now() - 259200000).toISOString().split('T')[0], // 3 days ago
        deliciousCount: 14
    }
];

// --- Application State ---
let posts = [];
let currentFilter = 'all';
let calendarDate = new Date();
let currentUser = null;
let userProfile = { nickname: "ゲスト", avatar: "", bio: "" };
let editingPostId = null;
let timelineViewMode = 'list';
let userHomeViewMode = 'list';
let activeUserHomeId = null;

// --- DOM Elements ---
const feedGrid = document.getElementById('feedGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanels = document.querySelectorAll('.tab-panel');

// Modal Elements
const openModalBtn = document.getElementById('openModalBtn');
const addMealModal = document.getElementById('addMealModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const mealForm = document.getElementById('mealForm');
const dropzone = document.getElementById('dropzone');
const imageFileInput = document.getElementById('imageFile');
const imagePreview = document.getElementById('imagePreview');
const dropzoneText = document.getElementById('dropzoneText');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const detailImg = document.getElementById('detailImg');
const detailMealType = document.getElementById('detailMealType');
const detailCategory = document.getElementById('detailCategory');
const detailTime = document.getElementById('detailTime');
const detailTitle = document.getElementById('detailTitle');
const detailTagsContainer = document.getElementById('detailTagsContainer');
const detailComment = document.getElementById('detailComment');

// User Home Modal Elements
const userHomeModal = document.getElementById('userHomeModal');
const closeUserHomeModalBtn = document.getElementById('closeUserHomeModalBtn');
const userHomeAvatar = document.getElementById('userHomeAvatar');
const userHomeName = document.getElementById('userHomeName');
const userHomeBio = document.getElementById('userHomeBio');
const userHomeFollowersCount = document.getElementById('userHomeFollowersCount');
const userHomeFollowingCount = document.getElementById('userHomeFollowingCount');
const userHomeFollowBtn = document.getElementById('userHomeFollowBtn');
const userHomeGrid = document.getElementById('userHomeGrid');

// User List Modal Elements
const userListModal = document.getElementById('userListModal');
const closeUserListModalBtn = document.getElementById('closeUserListModalBtn');
const userListTitle = document.getElementById('userListTitle');
const userListContainer = document.getElementById('userListContainer');

// Calendar Elements
const calendarTitle = document.getElementById('calendarTitle');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

const streakCount = document.getElementById('streakCount');
const likesGrid = document.getElementById('likesGrid');
const likesEmptyState = document.getElementById('likesEmptyState');

// Gacha Elements
const gachaBtn = document.getElementById('gachaBtn');
const gachaLever = document.getElementById('gachaLever');
const gachaScreenContent = document.getElementById('gachaScreenContent');
const gachaResultCard = document.getElementById('gachaResultCard');
const gachaResultTitle = document.getElementById('gachaResultTitle');
const gachaResultDesc = document.getElementById('gachaResultDesc');
const gachaRetryBtn = document.getElementById('gachaRetryBtn');
const gachaAddCalendarBtn = document.getElementById('gachaAddCalendarBtn');
const gachaYoutubeIframe = document.getElementById('gachaYoutubeIframe');

// Gacha Recipe Manager Elements
const gachaManagerAccordion = document.getElementById('gachaManagerAccordion');
const accordionHeader = document.getElementById('accordionHeader');
const addRecipeForm = document.getElementById('addRecipeForm');
const recipeUrlInput = document.getElementById('recipeUrl');
const recipeTitleInput = document.getElementById('recipeTitle');
const recipeCreatorInput = document.getElementById('recipeCreator');
const recipeStyleSelect = document.getElementById('recipeStyle');
const recipeTasteSelect = document.getElementById('recipeTaste');
const recipeFocusSelect = document.getElementById('recipeFocus');
const customRecipesList = document.getElementById('customRecipesList');

// Gacha State
let youtubeRecipes = [];
let currentSelectedRecipe = null;
let activeGachaFilters = {
    style: 'all',
    taste: 'all',
    ingredients: [],
    focus: 'all'
};

// Authentication & Profile Elements
const loginOverlay = document.getElementById('loginOverlay');
const loginGoogleBtn = document.getElementById('loginGoogleBtn');
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
const profileImageFile = document.getElementById('profileImageFile');
const profileImagePreview = document.getElementById('profileImagePreview');
const profileDropzone = document.getElementById('profileDropzone');
const profileDropzoneText = document.getElementById('profileDropzoneText');
const userProfileHeader = document.getElementById('userProfileHeader');
const userHeaderAvatar = document.getElementById('userHeaderAvatar');
const userHeaderName = document.getElementById('userHeaderName');
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const headerLoginBtn = document.getElementById('headerLoginBtn');
const toggleEmailFormBtn = document.getElementById('toggleEmailFormBtn');
const emailLoginForm = document.getElementById('emailLoginForm');
const emailRegisterBtn = document.getElementById('emailRegisterBtn');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    initEventListeners();
    loadRecipes();
});

// Load posts from LocalStorage or Firebase
function initData() {
    const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.startsWith("YOUR_");
    
    if (isFirebaseConfigured) {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            
            // Listen to auth state changes
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    currentUser = user;
                    loginOverlay.style.display = 'none';
                    
                    // Show active profile info, hide login button
                    document.getElementById('userProfileActive').style.display = 'flex';
                    headerLoginBtn.style.display = 'none';
                    userProfileHeader.style.display = 'flex';
                    
                    // Fetch user custom profile from Firestore
                    try {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            userProfile = userDoc.data();
                            updateUserProfileUI();
                        } else {
                            // First time login - trigger profile modal setup
                            userProfile = { nickname: "", avatar: "" };
                            openProfileModalSetup();
                        }
                    } catch (err) {
                        console.error("Error fetching user profile:", err);
                        // Fallback user details
                        userProfile = { nickname: user.displayName || "匿名ユーザー", avatar: user.photoURL || "" };
                        updateUserProfileUI();
                    }
                    
                    // Show FAB (+) button since user is logged in
                    openModalBtn.style.display = 'flex';
                    
                    // Show Gacha manager accordion ONLY for administrators
                    if (ADMIN_EMAILS.includes(user.email)) {
                        gachaManagerAccordion.style.display = 'block';
                    } else {
                        gachaManagerAccordion.style.display = 'none';
                    }
                    
                    // Load shared recipes from Firestore
                    loadSharedRecipes();
                } else {
                    currentUser = null;
                    userProfile = { nickname: "ゲスト", avatar: "" };
                    
                    // Hide active profile info, show login button in header
                    document.getElementById('userProfileActive').style.display = 'none';
                    headerLoginBtn.style.display = 'block';
                    userProfileHeader.style.display = 'flex';
                    
                    // Ensure login overlay is hidden initially for guests
                    loginOverlay.style.display = 'none';
                    
                    // Show FAB (+) button (clicking it will open login prompt)
                    openModalBtn.style.display = 'flex';

                    // Hide Gacha manager accordion for guests
                    gachaManagerAccordion.style.display = 'none';

                    // Load shared recipes from Firestore for guests
                    loadSharedRecipes();
                }
            });
            
            // Set up real-time listener for shared meal data (guests can read too!)
            db.collection('meals').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
                posts = [];
                snapshot.forEach((doc) => {
                    if (doc.id === 'shared_gacha_recipes') return;
                    const data = doc.data();
                    let dateStr = data.date;
                    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                        dateStr = data.createdAt.toDate().toISOString().split('T')[0];
                    }
                    posts.push({
                        id: doc.id,
                        userId: data.userId || "",
                        username: data.username || "匿名",
                        avatar: data.avatar || "🥑",
                        dishName: data.dishName || "",
                        mealType: data.mealType || "lunch",
                        category: data.category || "self-cooked",
                        rating: data.rating || 3,
                        comment: data.comment || "",
                        image: data.image || "",
                        date: dateStr || new Date().toISOString().split('T')[0],
                        deliciousUsers: data.deliciousUsers || [],
                        deliciousCount: (data.deliciousUsers || []).length
                    });
                });
                
                renderFeed();
                
                // Update active tab data
                const activeTabEl = document.querySelector('.nav-tab.active');
                const activeTab = activeTabEl ? activeTabEl.dataset.tab : 'timeline';
                if (activeTab === 'calendar') renderCalendar();
                else if (activeTab === 'likes') renderLikes();
                updateStreak();
            }, (error) => {
                console.error("Firestore onSnapshot error:", error);
                fallbackToLocalStorage();
            });
        } catch (e) {
            console.error("Firebase init failed, falling back to LocalStorage:", e);
            fallbackToLocalStorage();
        }
    } else {
        fallbackToLocalStorage();
    }
}

function fallbackToLocalStorage() {
    db = null;
    currentUser = null;
    loginOverlay.style.display = 'none';
    userProfileHeader.style.display = 'none';
    openModalBtn.style.display = 'flex'; // Enable FAB in local mode
    
    const savedPosts = localStorage.getItem('what-i-ate-posts');
    if (savedPosts) {
        posts = JSON.parse(savedPosts);
    } else {
        posts = [...DEFAULT_POSTS];
        localStorage.setItem('what-i-ate-posts', JSON.stringify(posts));
    }
    renderFeed();
    renderLikes();
    updateStreak();
}

function updateUserProfileUI() {
    userHeaderName.textContent = userProfile.nickname || "名無し";
    userHeaderAvatar.src = userProfile.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";
    userProfileHeader.style.display = 'flex';
    
    // Make header details clickable to open My Home
    userHeaderName.style.cursor = 'pointer';
    userHeaderAvatar.style.cursor = 'pointer';
    userHeaderName.onclick = () => { if (currentUser) openUserHome(currentUser.uid); };
    userHeaderAvatar.onclick = () => { if (currentUser) openUserHome(currentUser.uid); };
}

function openProfileModalSetup() {
    profileModal.classList.add('active');
    document.getElementById('profileNickname').value = userProfile.nickname || "";
    document.getElementById('profileBio').value = userProfile.bio || "";
    if (userProfile.avatar) {
        profileImagePreview.src = userProfile.avatar;
        profileImagePreview.style.display = 'block';
        profileDropzoneText.style.display = 'none';
    } else {
        profileImagePreview.style.display = 'none';
        profileDropzoneText.style.display = 'block';
    }
}


// Tab Switch Helper
function switchTab(tabName) {
    // Sync top tabs
    navTabs.forEach(t => {
        if (t.dataset.tab === tabName) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    // Sync bottom nav items
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(t => {
        if (t.dataset.tab === tabName) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });

    // Switch panels
    tabPanels.forEach(p => {
        if (p.id === `tab-${tabName}`) {
            p.classList.add('active');
        } else {
            p.classList.remove('active');
        }
    });

    // Perform specific updates based on selected tab
    if (tabName === 'calendar') {
        renderCalendar();
    } else if (tabName === 'likes') {
        renderLikes();
    }
}

// Set up all event listeners
function initEventListeners() {
    // Navigation Tabs Switching (Desktop)
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    // Navigation Tabs Switching (Mobile Bottom Nav)
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(item => {
        if (item.dataset.tab) {
            item.addEventListener('click', () => {
                switchTab(item.dataset.tab);
            });
        }
    });

    // Floating add button in bottom nav
    const bottomNavUploadBtn = document.getElementById('bottomNavUploadBtn');
    if (bottomNavUploadBtn) {
        bottomNavUploadBtn.addEventListener('click', () => {
            addMealModal.classList.add('active');
        });
    }

    // Timeline View Mode Toggles
    const timelineListViewBtn = document.getElementById('timelineListViewBtn');
    const timelineGridViewBtn = document.getElementById('timelineGridViewBtn');
    if (timelineListViewBtn && timelineGridViewBtn) {
        timelineListViewBtn.addEventListener('click', () => {
            timelineListViewBtn.classList.add('active');
            timelineGridViewBtn.classList.remove('active');
            timelineViewMode = 'list';
            renderFeed();
        });
        timelineGridViewBtn.addEventListener('click', () => {
            timelineGridViewBtn.classList.add('active');
            timelineListViewBtn.classList.remove('active');
            timelineViewMode = 'grid';
            renderFeed();
        });
    }

    // User Home View Mode Toggles
    const userHomeListViewBtn = document.getElementById('userHomeListViewBtn');
    const userHomeGridViewBtn = document.getElementById('userHomeGridViewBtn');
    if (userHomeListViewBtn && userHomeGridViewBtn) {
        userHomeListViewBtn.addEventListener('click', () => {
            userHomeListViewBtn.classList.add('active');
            userHomeGridViewBtn.classList.remove('active');
            userHomeViewMode = 'list';
            if (activeUserHomeId) renderUserHomePosts(activeUserHomeId);
        });
        userHomeGridViewBtn.addEventListener('click', () => {
            userHomeGridViewBtn.classList.add('active');
            userHomeListViewBtn.classList.remove('active');
            userHomeViewMode = 'grid';
            if (activeUserHomeId) renderUserHomePosts(activeUserHomeId);
        });
    }

    // Timeline Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderFeed();
        });
    });

    // Timeline Dropdown Filters
    const timelineFilters = [
        'timelineStyleFilter',
        'timelineGenreFilter',
        'timelineTasteFilter',
        'timelineIngredientFilter',
        'timelineFocusFilter',
        'timelineSortFilter'
    ];
    timelineFilters.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                renderFeed();
            });
        }
    });

    // Open & Close Create Modal
    openModalBtn.addEventListener('click', () => {
        if (currentUser) {
            editingPostId = null;
            addMealModal.querySelector('.modal-header h2').textContent = "ごはんを記録する";
            mealForm.querySelector('.submit-btn').textContent = "記録する！ 🎉";
            addMealModal.classList.add('active');
            // Reset form
            mealForm.reset();
            imagePreview.style.display = 'none';
            dropzoneText.style.display = 'block';
        } else {
            loginOverlay.style.display = 'flex';
        }
    });

    closeModalBtn.addEventListener('click', () => {
        addMealModal.classList.remove('active');
    });

    // Form Submission
    mealForm.addEventListener('submit', handleFormSubmit);

    // Image Upload Handling (Drag & Drop + Selection)
    dropzone.addEventListener('click', () => imageFileInput.click());
    imageFileInput.addEventListener('change', handleFileSelect);
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary-color)';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#DCD4D0';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#DCD4D0';
        if (e.dataTransfer.files.length > 0) {
            imageFileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Detail Modal Closing
    closeDetailModalBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
    });

    // User Home Modal Closing
    closeUserHomeModalBtn.addEventListener('click', () => {
        userHomeModal.classList.remove('active');
    });
    userHomeModal.addEventListener('click', (e) => {
        if (e.target === userHomeModal) {
            userHomeModal.classList.remove('active');
        }
    });

    // User List Modal Closing
    closeUserListModalBtn.addEventListener('click', () => {
        userListModal.classList.remove('active');
    });
    userListModal.addEventListener('click', (e) => {
        if (e.target === userListModal) {
            userListModal.classList.remove('active');
        }
    });

    // Calendar Navigation
    prevMonthBtn.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });

    // Gacha Interaction
    gachaBtn.addEventListener('click', spinGacha);
    gachaLever.addEventListener('click', spinGacha);
    gachaRetryBtn.addEventListener('click', spinGacha);
    gachaAddCalendarBtn.addEventListener('click', useRecipeForMeal);

    // Gacha Recipe Manager Accordion Toggle
    accordionHeader.addEventListener('click', () => {
        gachaManagerAccordion.classList.toggle('open');
    });

    // Gacha Recipe Register Form Submit
    addRecipeForm.addEventListener('submit', handleRegisterRecipe);

    // Gacha Filter Clicks
    const styleFilterBtns = document.querySelectorAll('#gachaFilterStyle .gacha-filter-btn');
    styleFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            styleFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeGachaFilters.style = btn.getAttribute('data-val');
        });
    });

    const tasteFilterBtns = document.querySelectorAll('#gachaFilterTaste .gacha-filter-btn');
    tasteFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tasteFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeGachaFilters.taste = btn.getAttribute('data-val');
        });
    });

    const ingredientFilterBtns = document.querySelectorAll('#gachaFilterIngredient .gacha-filter-btn');
    ingredientFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            if (val === 'all') {
                ingredientFilterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeGachaFilters.ingredients = [];
            } else {
                const allBtn = Array.from(ingredientFilterBtns).find(b => b.getAttribute('data-val') === 'all');
                if (allBtn) allBtn.classList.remove('active');

                btn.classList.toggle('active');

                const activeBtns = Array.from(ingredientFilterBtns).filter(b => b.classList.contains('active') && b.getAttribute('data-val') !== 'all');
                if (activeBtns.length > 0) {
                    activeGachaFilters.ingredients = activeBtns.map(b => b.getAttribute('data-val'));
                } else {
                    if (allBtn) allBtn.classList.add('active');
                    activeGachaFilters.ingredients = [];
                }
            }
        });
    });

    const focusFilterBtns = document.querySelectorAll('#gachaFilterFocus .gacha-filter-btn');
    focusFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            focusFilterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeGachaFilters.focus = btn.getAttribute('data-val');
        });
    });

    // --- Authentication Event Listeners ---
    
    // Google Sign-In Click
    loginGoogleBtn.addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        firebase.auth().signInWithPopup(provider).catch(err => {
            console.error("Google login failed:", err);
            alert("ログインに失敗しました。");
        });
    });

    // Toggle Email Form Click
    toggleEmailFormBtn.addEventListener('click', () => {
        const isHidden = emailLoginForm.style.display === 'none';
        emailLoginForm.style.display = isHidden ? 'flex' : 'none';
        toggleEmailFormBtn.textContent = isHidden ? 'メールログインフォームを閉じる' : 'メールアドレスでログイン / 登録';
    });

    // Email Login Submit
    emailLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        firebase.auth().signInWithEmailAndPassword(email, password).catch(err => {
            console.error("Email login failed:", err);
            let errMsg = "ログインに失敗しました。";
            if (err.code === "auth/user-not-found") {
                errMsg = "ユーザーが見つかりません。新規登録をおこなってください。";
            } else if (err.code === "auth/wrong-password") {
                errMsg = "パスワードが正しくありません。";
            } else if (err.code === "auth/invalid-email") {
                errMsg = "無効なメールアドレス形式です。";
            }
            alert(errMsg);
        });
    });

    // Email Register Click
    emailRegisterBtn.addEventListener('click', () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (!email || password.length < 6) {
            alert("メールアドレスと6文字以上のパスワードを入力してください。");
            return;
        }
        
        firebase.auth().createUserWithEmailAndPassword(email, password).catch(err => {
            console.error("Email registration failed:", err);
            let errMsg = "アカウント登録に失敗しました。";
            if (err.code === "auth/email-already-in-use") {
                errMsg = "このメールアドレスは既に登録されています。";
            } else if (err.code === "auth/weak-password") {
                errMsg = "パスワードが弱すぎます。6文字以上にしてください。";
            } else if (err.code === "auth/invalid-email") {
                errMsg = "無効なメールアドレス形式です。";
            }
            alert(errMsg);
        });
    });

    // Logout Click
    logoutBtn.addEventListener('click', () => {
        if (confirm("ログアウトしますか？")) {
            firebase.auth().signOut().catch(err => console.error("Logout failed:", err));
        }
    });

    // Edit Profile Click
    editProfileBtn.addEventListener('click', openProfileModalSetup);

    // Profile Modal File Selection
    profileDropzone.addEventListener('click', () => profileImageFile.click());
    profileImageFile.addEventListener('change', handleProfileFileSelect);
    
    profileDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        profileDropzone.style.borderColor = 'var(--primary-color)';
    });
    profileDropzone.addEventListener('dragleave', () => {
        profileDropzone.style.borderColor = '#DCD4D0';
    });
    profileDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        profileDropzone.style.borderColor = '#DCD4D0';
        if (e.dataTransfer.files.length > 0) {
            profileImageFile.files = e.dataTransfer.files;
            handleProfileFileSelect();
        }
    });

    // Profile Setup Submit
    profileForm.addEventListener('submit', handleProfileSubmit);

    // Close Login Overlay
    closeLoginBtn.addEventListener('click', () => {
        loginOverlay.style.display = 'none';
    });

    // Header Login Button Click
    headerLoginBtn.addEventListener('click', () => {
        loginOverlay.style.display = 'flex';
    });
}

function handleProfileFileSelect() {
    const file = profileImageFile.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const SIZE = 120; // Profile thumbnail size 120x120px
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext('2d');
                
                // Crop to center square
                let srcX = 0;
                let srcY = 0;
                let srcSize = Math.min(img.width, img.height);
                
                if (img.width > img.height) {
                    srcX = (img.width - img.height) / 2;
                } else {
                    srcY = (img.height - img.width) / 2;
                }
                
                ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, SIZE, SIZE);
                
                // Compress to JPEG with 0.8 quality (extremely light base64 string)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
                profileImagePreview.src = compressedDataUrl;
                profileImagePreview.style.display = 'block';
                profileDropzoneText.style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleProfileSubmit(e) {
    e.preventDefault();
    const nickname = document.getElementById('profileNickname').value.trim();
    if (!nickname) return;
    
    const bio = document.getElementById('profileBio').value.trim();
    const avatar = profileImagePreview.style.display !== 'none' ? profileImagePreview.src : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";
    
    if (db && currentUser) {
        db.collection('users').doc(currentUser.uid).set({
            nickname: nickname,
            avatar: avatar,
            bio: bio,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            userProfile = { nickname: nickname, avatar: avatar, bio: bio };
            profileModal.classList.remove('active');
            updateUserProfileUI();
            
            // Refresh feed timeline
            renderFeed();
        }).catch(err => {
            console.error("Profile save error:", err);
            alert("プロフィールの保存に失敗しました。");
        });
    }
}

// --- Render Timeline Feed ---
function getPostTagsHtml(post) {
    let tagsHtml = '';
    
    // Category tag
    tagsHtml += `<span class="post-tag-badge style">${getCategoryLabel(post.category)}</span>`;
    
    // Genre tag
    if (post.genre && post.genre !== 'all') {
        const labels = { japanese: '和風 🇯🇵', western: '洋風 🍔', other: 'その他 🍛' };
        tagsHtml += `<span class="post-tag-badge genre">${labels[post.genre] || post.genre}</span>`;
    }
    
    // Taste tag
    if (post.taste && post.taste !== 'all') {
        const labels = { light: 'あっさり 🥗', heavy: 'ガッツリ 🍖' };
        tagsHtml += `<span class="post-tag-badge taste">${labels[post.taste] || post.taste}</span>`;
    }
    
    // Ingredients tags
    if (Array.isArray(post.ingredients) && post.ingredients.length > 0) {
        const labels = { pork: '豚 🐷', chicken: '鶏 🐔', beef: '牛 🐮', seafood: '魚介 🐟', other: 'その他 🥕' };
        post.ingredients.forEach(ing => {
            tagsHtml += `<span class="post-tag-badge ingredient">${labels[ing] || ing}</span>`;
        });
    } else if (post.ingredient && post.ingredient !== 'all') {
        const labels = { pork: '豚 🐷', chicken: '鶏 🐔', beef: '牛 🐮', seafood: '魚介 🐟', other: 'その他 🥕' };
        tagsHtml += `<span class="post-tag-badge ingredient">${labels[post.ingredient] || post.ingredient}</span>`;
    }
    
    // Focus tag
    if (post.focus && post.focus !== 'all') {
        const labels = { quick: '時短 ⏱️', budget: '節約 🪙' };
        tagsHtml += `<span class="post-tag-badge focus">${labels[post.focus] || post.focus}</span>`;
    }
    
    return tagsHtml;
}

function renderFeed() {
    feedGrid.innerHTML = '';
    
    const styleFilter = document.getElementById('timelineStyleFilter');
    const genreFilter = document.getElementById('timelineGenreFilter');
    const tasteFilter = document.getElementById('timelineTasteFilter');
    const ingredientFilter = document.getElementById('timelineIngredientFilter');
    const focusFilter = document.getElementById('timelineFocusFilter');
    const sortFilter = document.getElementById('timelineSortFilter');
    
    const styleVal = styleFilter ? styleFilter.value : 'all';
    const genreVal = genreFilter ? genreFilter.value : 'all';
    const tasteVal = tasteFilter ? tasteFilter.value : 'all';
    const ingredientVal = ingredientFilter ? ingredientFilter.value : 'all';
    const focusVal = focusFilter ? focusFilter.value : 'all';
    const sortVal = sortFilter ? sortFilter.value : 'newest';

    let filteredPosts = posts.filter(post => {
        const matchesMealType = (currentFilter === 'all' || post.mealType === currentFilter);
        const matchesStyle = (styleVal === 'all' || post.category === styleVal);
        const matchesGenre = (genreVal === 'all' || post.genre === genreVal);
        const matchesTaste = (tasteVal === 'all' || post.taste === tasteVal);
        
        let matchesIngredient = true;
        if (ingredientVal !== 'all') {
            if (Array.isArray(post.ingredients)) {
                matchesIngredient = post.ingredients.includes(ingredientVal);
            } else if (post.ingredient) {
                matchesIngredient = (post.ingredient === ingredientVal);
            } else {
                matchesIngredient = false;
            }
        }
        
        const matchesFocus = (focusVal === 'all' || post.focus === focusVal);
        
        return matchesMealType && matchesStyle && matchesGenre && matchesTaste && matchesIngredient && matchesFocus;
    });

    if (sortVal === 'newest') {
        filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortVal === 'popular') {
        filteredPosts.sort((a, b) => b.deliciousCount - a.deliciousCount);
    }

    if (timelineViewMode === 'grid') {
        feedGrid.className = 'posts-grid-view';
    } else {
        feedGrid.className = 'feed-grid';
    }

    if (filteredPosts.length === 0) {
        feedGrid.className = 'feed-grid'; // Reset class for empty state centered layout
        feedGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-emoji">🥣</span>
                <p>まだこの時間帯の投稿がありません。<br>今日食べたものを記録してみましょう！</p>
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
        if (timelineViewMode === 'grid') {
            const item = document.createElement('div');
            item.className = 'grid-post-item';
            item.onclick = () => openDetailModal(post.id);
            item.innerHTML = `
                <img src="${post.image}" alt="${post.dishName}" class="grid-post-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'">
                <div class="grid-post-overlay">
                    <div class="grid-overlay-item">
                        <span>🤤</span>
                        <span>${post.deliciousCount || 0}</span>
                    </div>
                </div>
            `;
            feedGrid.appendChild(item);
        } else {
            const card = document.createElement('article');
            card.className = 'post-card';
            
            // Handle emoji vs custom image avatar dynamically
            const isCustomImage = post.avatar && (post.avatar.startsWith('data:image/') || post.avatar.startsWith('http'));
            const avatarHtml = isCustomImage 
                ? `<img src="${post.avatar}" class="post-avatar-img" alt="アバター">` 
                : `<div class="post-avatar">${post.avatar || '🍴'}</div>`;

            // Check ownership for delete/edit permission
            const isOwner = db 
                ? (currentUser && post.userId === currentUser.uid) 
                : (post.username === 'あなた');
            
            const actionButtonsHtml = isOwner 
                ? `<button class="edit-post-btn" onclick="handleEditPostClick('${post.id}', event)" title="編集">✏️</button>
                   <button class="delete-post-btn" onclick="handleDeletePostClick('${post.id}', event)" title="削除">🗑️</button>` 
                : '';

            const tagsHtml = getPostTagsHtml(post);

            // Check if current user has liked this post
            const hasLiked = db
                ? (currentUser && post.deliciousUsers && post.deliciousUsers.includes(currentUser.uid))
                : (getLikedPostsLocal().includes(post.id));
            const activeClass = hasLiked ? 'active' : '';

            card.innerHTML = `
                <div class="post-header">
                    <div class="post-user-info" onclick="if('${post.userId || ''}') openUserHome('${post.userId}')">
                        ${avatarHtml}
                        <span class="post-username">${post.username}</span>
                    </div>
                    <div class="post-meta">
                        <span class="post-time">${formatDate(post.date)}</span>
                        <div class="post-badges">
                            <span class="post-badge type-${post.mealType}">${getMealTypeLabel(post.mealType)}</span>
                            ${actionButtonsHtml}
                        </div>
                    </div>
                </div>
                <div class="post-img-container" onclick="openDetailModal('${post.id}')">
                    <img src="${post.image}" alt="${post.dishName}" class="post-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'">
                </div>
                <div class="post-body">
                    <div class="post-tags-container">${tagsHtml}</div>
                    <h3 class="post-dish-name">${post.dishName}</h3>
                    <p class="post-comment"><span class="caption-user" onclick="if('${post.userId || ''}') openUserHome('${post.userId}')">${post.username}</span>${post.comment || 'メモはありません。'}</p>
                    <div class="post-footer">
                        <div class="delicious-btn-wrapper">
                            <button class="delicious-btn ${activeClass}" onclick="handleDeliciousClick(this, '${post.id}', event)">
                                <span class="delicious-icon">🤤</span>
                                <span class="delicious-label">美味しそう！</span>
                                <span class="delicious-count">${post.deliciousCount || 0}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            feedGrid.appendChild(card);
        }
    });
}

// --- Image File Handling ---
function handleFileSelect() {
    const file = imageFileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 600;
                let width = img.width;
                let height = img.height;
                
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality (very small file size)
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                imagePreview.src = compressedDataUrl;
                imagePreview.style.display = 'block';
                dropzoneText.style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// --- Form Submission Handler ---
function handleFormSubmit(e) {
    e.preventDefault();
    
    const dishName = document.getElementById('dishName').value;
    const mealType = document.getElementById('mealType').value;
    const mealCategory = document.getElementById('mealCategory').value;
    const comment = document.getElementById('comment').value;
    
    const mealGenre = document.getElementById('mealGenre').value;
    const mealTaste = document.getElementById('mealTaste').value;
    const mealFocus = document.getElementById('mealFocus').value;

    const checkedBoxes = document.querySelectorAll('input[name="mealIngredients"]:checked');
    const mealIngredients = Array.from(checkedBoxes).map(cb => cb.value);

    // Default image if none uploaded
    let mealImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60";
    if (imagePreview.src && imagePreview.style.display !== 'none') {
        mealImage = imagePreview.src;
    } else {
        // Assign a pretty stock food image based on meal type
        if (mealType === 'morning') mealImage = "https://images.unsplash.com/photo-1496041870307-63401816e640?w=500&auto=format&fit=crop&q=60";
        else if (mealType === 'lunch') mealImage = "https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=500&auto=format&fit=crop&q=60";
        else if (mealType === 'dinner') mealImage = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60";
        else mealImage = "https://images.unsplash.com/photo-1511018556340-d16986a1c194?w=500&auto=format&fit=crop&q=60";
    }

    if (editingPostId) {
        if (db) {
            db.collection('meals').doc(editingPostId).update({
                dishName: dishName,
                mealType: mealType,
                category: mealCategory,
                rating: 3,
                comment: comment,
                image: mealImage,
                genre: mealGenre,
                taste: mealTaste,
                ingredients: mealIngredients,
                focus: mealFocus
            }).then(() => {
                addMealModal.classList.remove('active');
                editingPostId = null;
            }).catch(err => {
                console.error("Firebase update error:", err);
                alert("更新に失敗しました。");
            });
        } else {
            const post = posts.find(p => p.id === editingPostId);
            if (post) {
                post.dishName = dishName;
                post.mealType = mealType;
                post.category = mealCategory;
                post.rating = 3;
                post.comment = comment;
                post.image = mealImage;
                post.genre = mealGenre;
                post.taste = mealTaste;
                post.ingredients = mealIngredients;
                post.focus = mealFocus;
            }
            localStorage.setItem('what-i-ate-posts', JSON.stringify(posts));
            addMealModal.classList.remove('active');
            editingPostId = null;
            renderFeed();
        }
        return;
    }

    const newPost = {
        username: userProfile.nickname || "匿名",
        avatar: userProfile.avatar || "🥑",
        userBio: userProfile.bio || "",
        dishName: dishName,
        mealType: mealType,
        category: mealCategory,
        rating: 3,
        comment: comment,
        image: mealImage,
        genre: mealGenre,
        taste: mealTaste,
        ingredients: mealIngredients,
        focus: mealFocus,
        deliciousCount: 0
    };

    if (db) {
        // Firebase database mode
        db.collection('meals').add({
            ...newPost,
            userId: currentUser ? currentUser.uid : "",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            addMealModal.classList.remove('active');
            const timelineTab = document.querySelector('.nav-tab[data-tab="timeline"]');
            if (timelineTab) timelineTab.click();
        }).catch(err => {
            console.error("Firebase write error:", err);
            alert("データベースへの保存に失敗しました。");
        });
    } else {
        // LocalStorage mode
        const localPost = {
            id: "post-" + Date.now(),
            ...newPost,
            date: new Date().toISOString().split('T')[0]
        };
        posts.unshift(localPost);
        try {
            localStorage.setItem('what-i-ate-posts', JSON.stringify(posts));
        } catch (err) {
            console.error("Failed to save to localStorage:", err);
            alert("画像の容量が大きすぎるか、保存容量（5MB）を超えたため保存できませんでした。");
            posts.shift();
            return;
        }
        
        // Close modal
        addMealModal.classList.remove('active');
        
        // Reload state
        renderFeed();
        updateStreak();
        
        // Scroll back to top of feed
        const timelineTab = document.querySelector('.nav-tab[data-tab="timeline"]');
        if (timelineTab) timelineTab.click();
    }
}

// --- "Delicious" Button Handler & Floating Particle Effect ---
function handleDeliciousClick(button, postId, event) {
    event.stopPropagation();
    
    // Guest check - open login overlay if they try to like while logged out
    if (db && !currentUser) {
        loginOverlay.style.display = 'flex';
        return;
    }
    
    if (db) {
        // Firebase mode
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        const hasLiked = post.deliciousUsers && post.deliciousUsers.includes(currentUser.uid);
        
        if (hasLiked) {
            // Unlike
            db.collection('meals').doc(postId).update({
                deliciousUsers: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            }).catch(err => console.error("Firestore unlike failed:", err));
        } else {
            // Like
            db.collection('meals').doc(postId).update({
                deliciousUsers: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            }).then(() => {
                // Trigger animation only when liking
                triggerDeliciousParticles(button);
            }).catch(err => console.error("Firestore like failed:", err));
        }
    } else {
        // LocalStorage mode
        let liked = getLikedPostsLocal();
        const post = posts.find(p => p.id === postId);
        if (!post) return;
        
        const likedIndex = liked.indexOf(postId);
        if (likedIndex > -1) {
            // Unlike locally
            liked.splice(likedIndex, 1);
            post.deliciousCount = Math.max(0, (post.deliciousCount || 0) - 1);
        } else {
            // Like locally
            liked.push(postId);
            post.deliciousCount = (post.deliciousCount || 0) + 1;
            triggerDeliciousParticles(button);
        }
        
        localStorage.setItem('what-i-ate-liked-local', JSON.stringify(liked));
        localStorage.setItem('what-i-ate-posts', JSON.stringify(posts));
        
        renderFeed();
    }
}

function triggerDeliciousParticles(button) {
    const emojis = ['🤤', '🍕', '🍰', '🥞', '🍔', '🍛', '🍳', '✨', '💛'];
    const buttonRect = button.getBoundingClientRect();
    
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const particle = document.createElement('span');
            particle.className = 'emoji-particle';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            
            const randomX = (Math.random() - 0.5) * 40;
            const randomRot = (Math.random() - 0.5) * 60;
            
            particle.style.left = `${buttonRect.left + buttonRect.width / 2 + randomX}px`;
            particle.style.top = `${buttonRect.top + window.scrollY - 10}px`;
            particle.style.setProperty('--rotation', `${randomRot}deg`);
            
            document.body.appendChild(particle);
            
            particle.addEventListener('animationend', () => {
                particle.remove();
            });
        }, i * 100);
    }
}

function getLikedPostsLocal() {
    const liked = localStorage.getItem('what-i-ate-liked-local');
    return liked ? JSON.parse(liked) : [];
}

// --- Delete Post Handler ---
function handleDeletePostClick(postId, event) {
    event.stopPropagation(); // Detailモーダルが開くのを防ぐ
    if (!confirm("本当にこの投稿を削除しますか？")) return;
    
    if (db) {
        db.collection('meals').doc(postId).delete().catch(err => {
            console.error("Firestore delete failed:", err);
            alert("削除に失敗しました。");
        });
    } else {
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem('what-i-ate-posts', JSON.stringify(posts));
        renderFeed();
        renderLikes();
        updateStreak();
    }
}

// --- Edit Post Handler ---
function handleEditPostClick(postId, event) {
    event.stopPropagation(); // Detailモーダルが開くのを防ぐ
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    editingPostId = postId;
    
    // Formに既存データを流し込む
    document.getElementById('dishName').value = post.dishName;
    document.getElementById('mealType').value = post.mealType;
    document.getElementById('mealCategory').value = post.category;
    document.getElementById('comment').value = post.comment;
    
    // Gachaタグ項目を設定
    document.getElementById('mealGenre').value = post.genre || 'all';
    document.getElementById('mealTaste').value = post.taste || 'all';
    document.getElementById('mealFocus').value = post.focus || 'all';
    
    // 食材チェックボックスを設定
    const ingredientBoxes = document.querySelectorAll('input[name="mealIngredients"]');
    ingredientBoxes.forEach(cb => {
        cb.checked = false;
        if (Array.isArray(post.ingredients)) {
            cb.checked = post.ingredients.includes(cb.value);
        } else if (post.ingredient) {
            cb.checked = (post.ingredient === cb.value);
        }
    });
    
    // 画像プレビューを設定
    imagePreview.src = post.image;
    imagePreview.style.display = 'block';
    dropzoneText.style.display = 'none';
    
    // モーダルのヘッダーとサブミットボタンを「編集モード」に変更
    addMealModal.querySelector('.modal-header h2').textContent = "ごはん記録を編集";
    mealForm.querySelector('.submit-btn').textContent = "更新する！ ✨";
    
    // モーダルを開く
    addMealModal.classList.add('active');
}

// --- Detail View Dialog ---
function openDetailModal(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    detailImg.src = post.image;
    detailImg.onerror = () => { detailImg.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'; };
    detailMealType.textContent = getMealTypeLabel(post.mealType);
    detailMealType.className = `detail-badge type-${post.mealType}`;
    detailCategory.textContent = getCategoryLabel(post.category);
    detailCategory.className = `detail-badge secondary cat-${post.category}`;
    detailTime.textContent = formatDate(post.date);
    detailTitle.textContent = post.dishName;
    // Populate Tags list
    let tagsHtml = '';
    tagsHtml += `<span class="post-tag-badge style">${getCategoryLabel(post.category)}</span>`;
    
    if (post.genre && post.genre !== 'all') {
        const labels = { japanese: '和風 🇯🇵', western: '洋風 🍔', other: 'その他 🍛' };
        tagsHtml += `<span class="post-tag-badge genre">${labels[post.genre] || post.genre}</span>`;
    }
    if (post.taste && post.taste !== 'all') {
        const labels = { light: 'あっさり 🥗', heavy: 'ガッツリ 🍖' };
        tagsHtml += `<span class="post-tag-badge taste">${labels[post.taste] || post.taste}</span>`;
    }
    if (Array.isArray(post.ingredients) && post.ingredients.length > 0) {
        const labels = { pork: '豚 🐷', chicken: '鶏 🐔', beef: '牛 🐮', seafood: '魚介 🐟', other: 'その他 🥕' };
        post.ingredients.forEach(ing => {
            tagsHtml += `<span class="post-tag-badge ingredient">${labels[ing] || ing}</span>`;
        });
    } else if (post.ingredient && post.ingredient !== 'all') {
        const labels = { pork: '豚 🐷', chicken: '鶏 🐔', beef: '牛 🐮', seafood: '魚介 🐟', other: 'その他 🥕' };
        tagsHtml += `<span class="post-tag-badge ingredient">${labels[post.ingredient] || post.ingredient}</span>`;
    }
    if (post.focus && post.focus !== 'all') {
        const labels = { quick: '時短 ⏱️', budget: '節約 🪙' };
        tagsHtml += `<span class="post-tag-badge focus">${labels[post.focus] || post.focus}</span>`;
    }
    
    detailTagsContainer.innerHTML = tagsHtml;
    detailComment.textContent = post.comment || "メモはありません。";

    // Populate Author Profile Card
    const detailAuthorAvatar = document.getElementById('detailAuthorAvatar');
    const detailAuthorName = document.getElementById('detailAuthorName');
    const detailAuthorBio = document.getElementById('detailAuthorBio');

    const isCustomImage = post.avatar && (post.avatar.startsWith('data:image/') || post.avatar.startsWith('http'));
    detailAuthorAvatar.src = isCustomImage ? post.avatar : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";
    
    detailAuthorName.textContent = post.username || "匿名";
    detailAuthorBio.textContent = post.userBio || "自己紹介はありません。";

    const detailAuthorCard = document.getElementById('detailAuthorCard');
    detailAuthorCard.onclick = () => {
        if (post.userId) {
            detailModal.classList.remove('active');
            openUserHome(post.userId);
        }
    };

    detailModal.classList.add('active');
}

// --- User Profile Home Modal Logic ---
function openUserHome(targetUserId) {
    if (!targetUserId) return;
    activeUserHomeId = targetUserId;

    userHomeGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: var(--text-light);">読み込み中...</div>';
    userHomeModal.classList.add('active');

    // Default Fallbacks
    let profileName = "ゲスト";
    let profileAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";
    let profileBio = "自己紹介はありません。";
    let followers = [];
    let following = [];

    const isSelf = currentUser && targetUserId === currentUser.uid;

    if (db) {
        Promise.all([
            db.collection('users').doc(targetUserId).get(),
            db.collection('users').where('following', 'array-contains', targetUserId).get(),
            currentUser ? db.collection('users').doc(currentUser.uid).get() : Promise.resolve(null)
        ]).then(([targetDoc, followersSnap, selfDoc]) => {
            if (targetDoc.exists) {
                const data = targetDoc.data();
                profileName = data.nickname || "匿名";
                profileAvatar = data.avatar || profileAvatar;
                profileBio = data.bio || "自己紹介はありません。";
                following = data.following || [];
            } else {
                const userPost = posts.find(p => p.userId === targetUserId);
                if (userPost) {
                    profileName = userPost.username;
                    profileAvatar = userPost.avatar || profileAvatar;
                    profileBio = userPost.userBio || "自己紹介はありません。";
                }
            }

            followers = followersSnap.docs.map(doc => doc.id);

            let isFollowing = false;
            if (selfDoc && selfDoc.exists) {
                const selfFollowing = selfDoc.data().following || [];
                isFollowing = selfFollowing.includes(targetUserId);
            }

            userHomeName.textContent = profileName;
            userHomeAvatar.src = profileAvatar;
            userHomeBio.textContent = profileBio;
            userHomeFollowersCount.textContent = followers.length;
            userHomeFollowingCount.textContent = following.length;

            const statsItems = document.querySelectorAll('.user-home-stats .stat-item');
            statsItems[0].onclick = () => openUserList('followers', targetUserId, followers);
            statsItems[1].onclick = () => openUserList('following', targetUserId, following);

            if (isSelf) {
                userHomeFollowBtn.style.display = 'block';
                userHomeFollowBtn.textContent = "プロフィール設定 ⚙️";
                userHomeFollowBtn.className = "follow-btn edit-profile";
                userHomeFollowBtn.onclick = () => {
                    userHomeModal.classList.remove('active');
                    openProfileModalSetup();
                };
            } else {
                if (!currentUser) {
                    userHomeFollowBtn.style.display = 'none';
                } else {
                    userHomeFollowBtn.style.display = 'block';
                    if (isFollowing) {
                        userHomeFollowBtn.textContent = "フォロー中 ✓";
                        userHomeFollowBtn.className = "follow-btn following";
                    } else {
                        userHomeFollowBtn.textContent = "フォローする 👤+";
                        userHomeFollowBtn.className = "follow-btn not-following";
                    }
                    userHomeFollowBtn.onclick = () => toggleFollowUser(targetUserId, isFollowing);
                }
            }

            renderUserHomePosts(targetUserId);
        }).catch(err => {
            console.error("Error loading user profile:", err);
        });
    } else {
        profileName = targetUserId === 'あなた' ? 'あなた' : targetUserId;
        const userPost = posts.find(p => p.username === profileName);
        if (userPost) {
            profileAvatar = userPost.avatar || profileAvatar;
        }
        userHomeName.textContent = profileName;
        userHomeAvatar.src = profileAvatar;
        userHomeBio.textContent = profileBio;
        userHomeFollowersCount.textContent = 0;
        userHomeFollowingCount.textContent = 0;
        userHomeFollowBtn.style.display = 'none';
        renderUserHomePosts(targetUserId);
    }
}

// --- Helper to Render Posts inside Home Grid ---
function renderUserHomePosts(targetUserId) {
    const userPosts = posts.filter(p => p.userId === targetUserId);
    userHomeGrid.innerHTML = '';

    if (userHomeViewMode === 'grid') {
        userHomeGrid.className = 'posts-grid-view';
    } else {
        userHomeGrid.className = 'feed-grid';
    }

    if (userPosts.length === 0) {
        userHomeGrid.className = 'feed-grid';
        userHomeGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-light); font-size: 13px;">まだ投稿がありません。</div>';
        return;
    }

    userPosts.forEach(post => {
        if (userHomeViewMode === 'grid') {
            const item = document.createElement('div');
            item.className = 'grid-post-item';
            item.onclick = () => openDetailModal(post.id);
            item.innerHTML = `
                <img src="${post.image}" alt="${post.dishName}" class="grid-post-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'">
                <div class="grid-post-overlay">
                    <div class="grid-overlay-item">
                        <span>🤤</span>
                        <span>${post.deliciousCount || 0}</span>
                    </div>
                </div>
            `;
            userHomeGrid.appendChild(item);
        } else {
            const card = document.createElement('div');
            card.className = 'post-card';
            
            const tagsHtml = getPostTagsHtml(post);
            const isCustomImage = post.avatar && (post.avatar.startsWith('data:image/') || post.avatar.startsWith('http'));
            const avatarHtml = isCustomImage 
                ? `<img src="${post.avatar}" class="post-avatar-img" alt="アバター">` 
                : `<div class="post-avatar">${post.avatar || '🍴'}</div>`;
                
            const isOwner = db 
                ? (currentUser && post.userId === currentUser.uid) 
                : (post.username === 'あなた');
                
            const actionButtonsHtml = isOwner 
                ? `<button class="edit-post-btn" onclick="handleEditPostClick('${post.id}', event)" title="編集">✏️</button>
                   <button class="delete-post-btn" onclick="handleDeletePostClick('${post.id}', event)" title="削除">🗑️</button>` 
                : '';

            const hasLiked = db
                ? (currentUser && post.deliciousUsers && post.deliciousUsers.includes(currentUser.uid))
                : (getLikedPostsLocal().includes(post.id));
            const activeClass = hasLiked ? 'active' : '';

            card.innerHTML = `
                <div class="post-header">
                    <div class="post-user-info" onclick="if('${post.userId || ''}') openUserHome('${post.userId}')">
                        ${avatarHtml}
                        <span class="post-username">${post.username}</span>
                    </div>
                    <div class="post-meta">
                        <span class="post-time">${formatDate(post.date)}</span>
                        <div class="post-badges">
                            <span class="post-badge type-${post.mealType}">${getMealTypeLabel(post.mealType)}</span>
                            ${actionButtonsHtml}
                        </div>
                    </div>
                </div>
                <div class="post-img-container" onclick="openDetailModal('${post.id}')">
                    <img src="${post.image}" class="post-img" alt="${post.dishName}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'">
                </div>
                <div class="post-body">
                    <div class="post-tags-container">${tagsHtml}</div>
                    <h3 class="post-dish-name" style="margin-top: 4px; margin-bottom: 8px;">${post.dishName}</h3>
                    <p class="post-comment"><span class="caption-user" onclick="if('${post.userId || ''}') openUserHome('${post.userId}')">${post.username}</span>${post.comment || 'メモはありません。'}</p>
                    <div class="post-actions">
                        <button class="action-btn delicious-btn ${activeClass}" onclick="handleDeliciousClick(this, '${post.id}', event)">
                            <span class="btn-emoji">🤤</span>
                            <span class="btn-text">美味しそう！</span>
                            <span class="delicious-count">${post.deliciousCount || 0}</span>
                        </button>
                    </div>
                </div>
            `;
            userHomeGrid.appendChild(card);
        }
    });
}

// --- Follow/Unfollow Handler (Optimistic UI + flying hearts) ---
function toggleFollowUser(targetUserId, currentlyFollowing) {
    if (!db || !currentUser || targetUserId === currentUser.uid) return;

    userHomeFollowBtn.classList.remove('pop-animate');
    void userHomeFollowBtn.offsetWidth;
    userHomeFollowBtn.classList.add('pop-animate');

    if (currentlyFollowing) {
        userHomeFollowBtn.textContent = "フォローする 👤+";
        userHomeFollowBtn.className = "follow-btn not-following pop-animate";
        userHomeFollowersCount.textContent = Math.max(0, parseInt(userHomeFollowersCount.textContent) - 1);
    } else {
        userHomeFollowBtn.textContent = "フォロー中 ✓";
        userHomeFollowBtn.className = "follow-btn following pop-animate";
        userHomeFollowersCount.textContent = parseInt(userHomeFollowersCount.textContent) + 1;
        
        createFollowHeartParticles(userHomeFollowBtn);
    }

    db.collection('users').doc(currentUser.uid).get().then(doc => {
        if (!doc.exists) {
            return db.collection('users').doc(currentUser.uid).set({
                nickname: userProfile.nickname || "名無し",
                avatar: userProfile.avatar || "",
                bio: userProfile.bio || "",
                following: []
            });
        }
        return doc;
    }).then(() => {
        const ref = db.collection('users').doc(currentUser.uid);
        if (currentlyFollowing) {
            return ref.update({
                following: firebase.firestore.FieldValue.arrayRemove(targetUserId)
            });
        } else {
            return ref.update({
                following: firebase.firestore.FieldValue.arrayUnion(targetUserId)
            });
        }
    }).then(() => {
        setTimeout(() => {
            openUserHome(targetUserId);
        }, 400);
    }).catch(err => {
        console.error("Failed to update follow status:", err);
        alert("フォロー処理に失敗しました。");
        openUserHome(targetUserId);
    });
}

// --- Followers / Following List Popup Logic ---
function openUserList(type, targetUserId, userIdsArray) {
    if (!db || !userIdsArray || userIdsArray.length === 0) {
        userListTitle.textContent = type === 'followers' ? 'フォロワー (0)' : 'フォロー中 (0)';
        userListContainer.innerHTML = '<div class="user-list-empty">表示するユーザーがいません。</div>';
        userListModal.classList.add('active');
        return;
    }

    userListTitle.textContent = type === 'followers' ? `フォロワー (${userIdsArray.length})` : `フォロー中 (${userIdsArray.length})`;
    userListContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-light);">読み込み中...</div>';
    userListModal.classList.add('active');

    const limitedIds = userIdsArray.slice(0, 30);

    db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', limitedIds).get().then(snap => {
        userListContainer.innerHTML = '';
        if (snap.empty) {
            userListContainer.innerHTML = '<div class="user-list-empty">表示するユーザーがいません。</div>';
            return;
        }

        snap.docs.forEach(doc => {
            const data = doc.data();
            const uid = doc.id;
            const nickname = data.nickname || "匿名";
            const bio = data.bio || "自己紹介はありません。";
            
            const isCustomImage = data.avatar && (data.avatar.startsWith('data:image/') || data.avatar.startsWith('http'));
            const avatarSrc = isCustomImage ? data.avatar : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";

            const item = document.createElement('div');
            item.className = 'user-list-item';
            item.innerHTML = `
                <img src="${avatarSrc}" class="user-list-avatar-img" alt="アバター">
                <div class="user-list-info">
                    <span class="user-list-name">${nickname}</span>
                    <span class="user-list-bio">${bio}</span>
                </div>
            `;

            item.onclick = () => {
                userListModal.classList.remove('active');
                openUserHome(uid);
            };

            userListContainer.appendChild(item);
        });
    }).catch(err => {
        console.error("Error loading user list:", err);
        userListContainer.innerHTML = '<div class="user-list-empty">読み込みに失敗しました。</div>';
    });
}

// --- Spawn Floating Hearts Micro-Animation ---
function createFollowHeartParticles(element) {
    const rect = element.getBoundingClientRect();
    const btnCenterX = rect.left + rect.width / 2;
    const btnCenterY = rect.top + rect.height / 2;

    const emojis = ['🧡', '💛', '✨', '💖', '🥰'];

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('span');
        particle.className = 'heart-particle';
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];

        particle.style.left = `${btnCenterX - 8 + (Math.random() - 0.5) * 20}px`;
        particle.style.top = `${btnCenterY - 8 + (Math.random() - 0.5) * 10}px`;

        const angle = Math.random() * Math.PI * 2;
        const distance = 40 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 20;

        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }
}

// --- Calendar Rendering Logic ---
function renderCalendar() {
    calendarDays.innerHTML = '';
    
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    calendarTitle.textContent = `${year}年 ${month + 1}月`;
    
    // First day of the month
    const firstDay = new Date(year, month, 1).getDay();
    // Total days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Padding cells for weekdays preceding the 1st
    for (let i = 0; i < firstDay; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day empty';
        calendarDays.appendChild(cell);
    }
    
    // Populate active days
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        const cell = document.createElement('div');
        cell.className = 'calendar-day';
        if (dateStr === todayStr) {
            cell.classList.add('today');
        }
        
        cell.innerHTML = `<span class="day-number">${d}</span>`;
        
        // Find if user has a meal logged on this day (only show the logged-in user's own meals)
        const dayMeals = posts.filter(post => {
            if (post.date !== dateStr) return false;
            if (db) {
                return currentUser && post.userId === currentUser.uid;
            } else {
                return post.username === 'あなた';
            }
        });
        
        if (dayMeals.length > 0) {
            cell.classList.add('has-meal');
            const meal = dayMeals[0];
            if (meal.image) {
                cell.style.backgroundImage = `url('${meal.image}')`;
            }
            
            if (dayMeals.length > 1) {
                const countBadge = document.createElement('span');
                countBadge.className = 'day-meal-count-badge';
                countBadge.textContent = `+${dayMeals.length - 1}`;
                cell.appendChild(countBadge);
            }
            
            // Click to open details
            cell.addEventListener('click', () => {
                openDetailModal(meal.id);
            });
        }
        
        calendarDays.appendChild(cell);
    }
}

// --- Render Favorites (Likes) Tab Logic ---
function renderLikes() {
    likesGrid.innerHTML = '';
    
    // Filter posts the user has liked
    const likedPosts = db
        ? posts.filter(p => currentUser && p.deliciousUsers && p.deliciousUsers.includes(currentUser.uid))
        : posts.filter(p => getLikedPostsLocal().includes(p.id));
        
    if (likedPosts.length === 0) {
        likesGrid.style.display = 'none';
        likesEmptyState.style.display = 'flex';
        return;
    }
    
    likesGrid.style.display = 'grid';
    likesEmptyState.style.display = 'none';
    
    likedPosts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'post-card';
        
        // Stars HTML
        const tagsHtml = getPostTagsHtml(post);
        
        // Check custom profile image
        const isCustomImage = post.avatar && (post.avatar.startsWith('data:image/') || post.avatar.startsWith('http'));
        const avatarHtml = isCustomImage 
            ? `<img src="${post.avatar}" class="post-avatar-img" alt="アバター">` 
            : `<div class="post-avatar">${post.avatar || '🍴'}</div>`;
            
        // Check ownership
        const isOwner = db 
            ? (currentUser && post.userId === currentUser.uid) 
            : (post.username === 'あなた');
            
        const actionButtonsHtml = isOwner 
            ? `<button class="edit-post-btn" onclick="handleEditPostClick('${post.id}', event)" title="編集">✏️</button>
               <button class="delete-post-btn" onclick="handleDeletePostClick('${post.id}', event)" title="削除">🗑️</button>` 
            : '';
            
        const activeClass = 'active';
        
        card.innerHTML = `
            <div class="post-header">
                <div class="post-user-info" onclick="if('${post.userId || ''}') openUserHome('${post.userId}')">
                    ${avatarHtml}
                    <span class="post-username">${post.username}</span>
                </div>
                <div class="post-meta">
                    <span class="post-time">${formatDate(post.date)}</span>
                    <div class="post-badges">
                        <span class="post-badge type-${post.mealType}">${getMealTypeLabel(post.mealType)}</span>
                        ${actionButtonsHtml}
                    </div>
                </div>
            </div>
            <div class="post-img-container" onclick="openDetailModal('${post.id}')">
                <img src="${post.image}" class="post-img" alt="${post.dishName}" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'">
            </div>
            <div class="post-body">
                <div class="post-tags-container">${tagsHtml}</div>
                <h3 class="post-dish-name" style="margin-top: 4px; margin-bottom: 8px;">${post.dishName}</h3>
                <p class="post-comment"><span class="caption-user" onclick="if('${post.userId || ''}') openUserHome('${post.userId}')">${post.username}</span>${post.comment || 'メモはありません。'}</p>
                <div class="post-actions">
                    <button class="action-btn delicious-btn ${activeClass}" onclick="handleDeliciousClick(this, '${post.id}', event)">
                        <span class="btn-emoji">🤤</span>
                        <span class="btn-text">美味しそう！</span>
                        <span class="delicious-count">${post.deliciousCount || 0}</span>
                    </button>
                </div>
            </div>
        `;
        
        likesGrid.appendChild(card);
    });
}

// --- Active Posting Streak Calculation ---
function updateStreak() {
    if (posts.length === 0) {
        streakCount.textContent = 0;
        return;
    }

    // Sort post dates descending
    const uniqueDates = [...new Set(posts.map(p => p.date))].sort((a, b) => new Date(b) - new Date(a));
    
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // If the latest post is neither today nor yesterday, streak is broken
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
        streakCount.textContent = 0;
        return;
    }
    
    let streak = 1;
    let expectedDate = new Date(uniqueDates[0]);
    
    for (let i = 1; i < uniqueDates.length; i++) {
        // Subtract one day from the expected date
        expectedDate.setDate(expectedDate.getDate() - 1);
        const expectedDateStr = expectedDate.toISOString().split('T')[0];
        
        if (uniqueDates[i] === expectedDateStr) {
            streak++;
        } else {
            break;
        }
    }
    
    streakCount.textContent = streak;
}

// --- Load recipes dynamically ---
function loadRecipes() {
    fetch('recipes.json?v=2.4')
        .then(res => {
            if (!res.ok) throw new Error("recipes.json not found");
            return res.json();
        })
        .then(data => {
            youtubeRecipes = data;
            console.log(`Loaded ${youtubeRecipes.length} recipes from json!`);
            loadSharedRecipes();
        })
        .catch(err => {
            console.error("Failed to load recipes.json:", err);
            youtubeRecipes = [];
            loadSharedRecipes();
        });
}

// --- Fetch and load shared Gacha recipes from Firestore or LocalStorage ---
function loadSharedRecipes() {
    if (db) {
        db.collection('meals').doc('shared_gacha_recipes').get().then(doc => {
            youtubeRecipes = [];
            if (doc.exists) {
                youtubeRecipes = doc.data().recipes || [];
                console.log(`Loaded shared Gacha recipes from Firestore. Total: ${youtubeRecipes.length}`);
            }
            renderCustomRecipeList(youtubeRecipes);
        }).catch(err => {
            console.error("Failed to load shared recipes from Firestore:", err);
        });
    } else {
        try {
            const localCustoms = JSON.parse(localStorage.getItem('custom_recipes')) || [];
            youtubeRecipes = localCustoms;
            console.log(`Loaded local Gacha recipes. Total: ${youtubeRecipes.length}`);
            renderCustomRecipeList(youtubeRecipes);
        } catch (err) {
            console.error("Failed to load local Gacha recipes:", err);
        }
    }
}

// --- Spin Gacha Action (with filters and YouTube embed) ---
let drawnGachaHistory = [];
let editingRecipeId = null;

function spinGacha() {
    if (gachaLever.classList.contains('pulled')) return;

    let candidates = youtubeRecipes;
    
    if (activeGachaFilters.style !== 'all') {
        candidates = candidates.filter(r => r.style === activeGachaFilters.style || r.style === 'all');
    }
    if (activeGachaFilters.taste !== 'all') {
        candidates = candidates.filter(r => r.taste === activeGachaFilters.taste || r.taste === 'all');
    }
    if (activeGachaFilters.ingredients && activeGachaFilters.ingredients.length > 0) {
        candidates = candidates.filter(r => {
            const recipeIngredients = Array.isArray(r.ingredients) ? r.ingredients : [r.ingredient || 'other'];
            return recipeIngredients.includes('all') || recipeIngredients.some(i => activeGachaFilters.ingredients.includes(i));
        });
    }
    if (activeGachaFilters.focus !== 'all') {
        candidates = candidates.filter(r => {
            const f = r.focus || 'all';
            return f === activeGachaFilters.focus || f === 'all';
        });
    }

    if (candidates.length === 0) {
        alert("選択されたジャンル、味の傾向、食材、またはこだわりに一致する料理動画がありません。フィルターを変更してください！");
        return;
    }

    // すでに引いた動画を排除
    let availableCandidates = candidates.filter(r => !drawnGachaHistory.includes(r.id));
    
    // もしフィルター条件に合う動画をすべて引ききった場合、履歴をリセットして最初から選び直す
    if (availableCandidates.length === 0) {
        drawnGachaHistory = [];
        availableCandidates = candidates;
    }

    gachaLever.classList.add('pulled');
    gachaResultCard.style.display = 'none';
    gachaYoutubeIframe.src = "";

    gachaScreenContent.innerHTML = '';
    const rollingText = document.createElement('div');
    rollingText.className = 'rolling';
    rollingText.textContent = "🍳 🍜 🥞 🍣 🍛 🍔 🍱";
    gachaScreenContent.appendChild(rollingText);

    const recipe = availableCandidates[Math.floor(Math.random() * availableCandidates.length)];
    drawnGachaHistory.push(recipe.id);
    currentSelectedRecipe = recipe;

    setTimeout(() => {
        gachaLever.classList.remove('pulled');

        gachaScreenContent.innerHTML = `<span style="font-size: 38px; animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">🍳</span>`;

        gachaResultTitle.textContent = recipe.title;
        gachaResultDesc.textContent = `紹介：${recipe.creator} さん の人気レシピ動画です！`;
        
        gachaYoutubeIframe.src = `https://www.youtube.com/embed/${recipe.id}`;

        gachaResultCard.style.display = 'block';

        gachaResultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 1500);
}

// --- Use Gacha Recipe to Record a Meal ---
function useRecipeForMeal() {
    if (!currentSelectedRecipe) return;

    gachaResultCard.style.display = 'none';
    addMealModal.classList.add('active');

    const dishNameInput = document.getElementById('dishName');
    const commentInput = document.getElementById('comment');
    const mealTypeSelect = document.getElementById('mealType');
    const categorySelect = document.getElementById('mealCategory');
    const imagePreview = document.getElementById('imagePreview');

    dishNameInput.value = currentSelectedRecipe.title;
    commentInput.value = `YouTubeで「${currentSelectedRecipe.creator}」さんの人気レシピ動画を観て作りました！🎬✨`;
    mealTypeSelect.value = "dinner";
    categorySelect.value = "self-cooked";

    // Gachaタグを自動セット
    document.getElementById('mealGenre').value = currentSelectedRecipe.style || 'all';
    document.getElementById('mealTaste').value = currentSelectedRecipe.taste || 'all';
    document.getElementById('mealFocus').value = currentSelectedRecipe.focus || 'all';

    // 食材チェックボックスを自動チェック
    const ingredientBoxes = document.querySelectorAll('input[name="mealIngredients"]');
    ingredientBoxes.forEach(cb => {
        cb.checked = false;
        if (Array.isArray(currentSelectedRecipe.ingredients)) {
            cb.checked = currentSelectedRecipe.ingredients.includes(cb.value);
        } else if (currentSelectedRecipe.ingredient) {
            cb.checked = (currentSelectedRecipe.ingredient === cb.value);
        }
    });

    const ytThumbnailUrl = `https://img.youtube.com/vi/${currentSelectedRecipe.id}/hqdefault.jpg`;
    imagePreview.src = ytThumbnailUrl;
    imagePreview.style.display = 'block';

    const dropzoneText = document.getElementById('dropzoneText');
    if (dropzoneText) dropzoneText.style.display = 'none';
}

// --- Extract 11-char YouTube ID from URL or ID string ---
function extractYoutubeId(url) {
    if (!url) return null;
    const cleanUrl = url.trim();
    if (cleanUrl.length === 11 && !cleanUrl.includes('/') && !cleanUrl.includes('?')) {
        return cleanUrl;
    }
    // Match YouTube Shorts: youtube.com/shorts/VIDEO_ID
    if (cleanUrl.includes('/shorts/')) {
        const parts = cleanUrl.split('/shorts/');
        if (parts.length > 1) {
            const segment = parts[1].split(/[?#]/)[0];
            if (segment.length === 11) return segment;
        }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = cleanUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// --- Handle Recipe Manual Registration Form Submit ---
function handleRegisterRecipe(e) {
    e.preventDefault();

    const rawUrl = recipeUrlInput.value;
    const title = recipeTitleInput.value.trim();
    const creator = recipeCreatorInput.value.trim();
    const style = recipeStyleSelect.value;
    const taste = recipeTasteSelect.value;
    const focus = recipeFocusSelect.value;

    const checkedBoxes = document.querySelectorAll('input[name="recipeIngredients"]:checked');
    const ingredients = Array.from(checkedBoxes).map(cb => cb.value);
    if (ingredients.length === 0) {
        alert("食材を少なくとも1つ選択してください。");
        return;
    }

    const videoId = editingRecipeId ? editingRecipeId : extractYoutubeId(rawUrl);
    if (!videoId) {
        alert("有効なYouTubeの動画URLまたは11桁の動画IDを入力してください。");
        return;
    }

    // Duplicate Check Validation (Skip if editing)
    if (!editingRecipeId) {
        const isDuplicate = youtubeRecipes.some(r => r.id === videoId);
        if (isDuplicate) {
            alert("この動画は既にガチャに登録されています！");
            return;
        }
    }

    const newRecipe = {
        id: videoId,
        title: title,
        creator: creator,
        style: style,
        taste: taste,
        ingredients: ingredients,
        focus: focus
    };

    if (db) {
        if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) {
            alert("レシピを登録する権限がありません。管理者用のアカウントでログインしてください。");
            return;
        }

        db.collection('meals').doc('shared_gacha_recipes').get().then(doc => {
            let recipes = [];
            if (doc.exists) {
                recipes = doc.data().recipes || [];
            }
            recipes = recipes.filter(r => r.id !== videoId);
            recipes.push(newRecipe);

            return db.collection('meals').doc('shared_gacha_recipes').set({ recipes: recipes });
        }).then(() => {
            onRecipeAddSuccess(newRecipe);
        }).catch(err => {
            console.error("Failed to save recipe to Firestore:", err);
            alert("Firestoreへの保存に失敗しました。");
        });
    } else {
        try {
            let localCustoms = JSON.parse(localStorage.getItem('custom_recipes')) || [];
            localCustoms = localCustoms.filter(r => r.id !== videoId);
            localCustoms.push(newRecipe);
            localStorage.setItem('custom_recipes', JSON.stringify(localCustoms));
            onRecipeAddSuccess(newRecipe);
        } catch (err) {
            console.error("Failed to save recipe to LocalStorage:", err);
            alert("LocalStorageへの保存に失敗しました。");
        }
    }
}

// --- Trigger successful toast notification ---
function onRecipeAddSuccess(recipe) {
    if (!youtubeRecipes.some(r => r.id === recipe.id)) {
        youtubeRecipes.push(recipe);
    } else {
        youtubeRecipes = youtubeRecipes.map(r => r.id === recipe.id ? recipe : r);
    }

    const isEditMode = (editingRecipeId !== null);
    stopEditingRecipe(); // Resets form, clears editingRecipeId, restores buttons

    // Refresh the custom list display
    loadSharedRecipes();

    if (isEditMode) {
        showToastNotification(`「${recipe.title}」の情報を更新しました！💾`);
    } else {
        showToastNotification(`「${recipe.title}」を追加登録しました！🎉`);
    }
}

// --- Render custom recipe list inside the accordion ---
function renderCustomRecipeList(customList) {
    if (!customRecipesList) return;
    customRecipesList.innerHTML = "";

    if (!customList || customList.length === 0) {
        customRecipesList.innerHTML = `<div class="custom-recipe-empty">登録済みのカスタムレシピはありません。</div>`;
        return;
    }

    customList.forEach(recipe => {
        const item = document.createElement('div');
        item.className = 'custom-recipe-item';
        item.innerHTML = `
            <div class="custom-recipe-info">
                <span class="custom-recipe-title">${recipe.title}</span>
                <span class="custom-recipe-creator">${recipe.creator || '紹介者不明'}</span>
            </div>
            <div class="custom-recipe-actions">
                <button class="edit-recipe-btn" data-id="${recipe.id}">編集 ✏️</button>
                <button class="delete-recipe-btn" data-id="${recipe.id}">削除 🗑️</button>
            </div>
        `;
        customRecipesList.appendChild(item);

        // Bind edit action
        item.querySelector('.edit-recipe-btn').addEventListener('click', () => {
            startEditingRecipe(recipe);
        });

        // Bind delete action
        item.querySelector('.delete-recipe-btn').addEventListener('click', () => {
            handleDeleteRecipe(recipe.id, recipe.title);
        });
    });
}

// --- Edit custom recipe functions ---
function startEditingRecipe(recipe) {
    editingRecipeId = recipe.id;
    
    // Populate form inputs
    recipeUrlInput.value = recipe.id;
    recipeUrlInput.disabled = true; // Disable modifying video ID during edit
    recipeTitleInput.value = recipe.title;
    recipeCreatorInput.value = recipe.creator || '';
    recipeStyleSelect.value = recipe.style || 'all';
    recipeTasteSelect.value = recipe.taste || 'all';
    recipeFocusSelect.value = recipe.focus || 'all';

    // Populate ingredient checkboxes
    const checkboxes = document.querySelectorAll('input[name="recipeIngredients"]');
    checkboxes.forEach(cb => {
        if (Array.isArray(recipe.ingredients)) {
            cb.checked = recipe.ingredients.includes(cb.value);
        } else if (recipe.ingredient) {
            cb.checked = (recipe.ingredient === cb.value);
        } else {
            cb.checked = false;
        }
    });

    // Make sure Gacha Manager Accordion is expanded
    if (gachaManagerAccordion && !gachaManagerAccordion.classList.contains('open')) {
        gachaManagerAccordion.classList.add('open');
    }

    // Scroll smoothly to Gacha manager form
    gachaManagerAccordion.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Update submit button text and styling
    const submitBtn = addRecipeForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = "変更を保存する 💾";
        submitBtn.style.background = "linear-gradient(135deg, #FF7E40, #FF5500)";
    }

    // Append cancel button if not already present
    let cancelBtn = document.getElementById('cancelEditRecipeBtn');
    if (!cancelBtn && submitBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.id = 'cancelEditRecipeBtn';
        cancelBtn.className = 'gacha-btn secondary';
        cancelBtn.textContent = '編集をキャンセル ❌';
        cancelBtn.style.cssText = 'margin-top: 8px; width: 100%; padding: 12px; background: #eee; color: #555; border: 1px solid #ddd; font-weight: bold; border-radius: var(--radius-md); cursor: pointer;';
        submitBtn.parentNode.insertBefore(cancelBtn, submitBtn.nextSibling);
        
        cancelBtn.addEventListener('click', stopEditingRecipe);
    }
}

function stopEditingRecipe() {
    editingRecipeId = null;
    addRecipeForm.reset();
    recipeUrlInput.disabled = false;

    // Restore submit button
    const submitBtn = addRecipeForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = "ガチャに新レシピを登録する ✨";
        submitBtn.style.background = ""; // Restore default CSS styling
    }

    // Remove cancel button
    const cancelBtn = document.getElementById('cancelEditRecipeBtn');
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

// --- Delete recipe from Gacha list ---
function handleDeleteRecipe(videoId, title) {
    if (db) {
        if (!currentUser || !ADMIN_EMAILS.includes(currentUser.email)) {
            alert("削除権限がありません。");
            return;
        }
        if (!confirm(`「${title}」をガチャから削除しますか？`)) return;

        db.collection('meals').doc('shared_gacha_recipes').get().then(doc => {
            if (doc.exists) {
                let recipes = doc.data().recipes || [];
                recipes = recipes.filter(r => r.id !== videoId);
                return db.collection('meals').doc('shared_gacha_recipes').set({ recipes: recipes }).then(() => {
                    youtubeRecipes = recipes;
                    renderCustomRecipeList(youtubeRecipes);
                    showToastNotification(`「${title}」を削除しました。`);
                });
            }
        }).catch(err => {
            console.error("Failed to delete recipe from Firestore:", err);
            alert("削除に失敗しました。");
        });
    } else {
        if (!confirm(`「${title}」をガチャから削除しますか？`)) return;
        try {
            let localCustoms = JSON.parse(localStorage.getItem('custom_recipes')) || [];
            localCustoms = localCustoms.filter(r => r.id !== videoId);
            localStorage.setItem('custom_recipes', JSON.stringify(localCustoms));

            youtubeRecipes = youtubeRecipes.filter(r => r.id !== videoId);
            renderCustomRecipeList(youtubeRecipes);
            showToastNotification(`「${title}」を削除しました。`);
        } catch (err) {
            console.error("Failed to delete recipe from LocalStorage:", err);
            alert("削除に失敗しました。");
        }
    }
}

// --- Helper to show Toast Notification ---
function showToastNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: var(--text-main);
        color: #FFF;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 4px 15px rgba(0,0,0,0.25);
        z-index: 99999;
        animation: toast-fade 2s ease-in-out forwards;
    `;

    if (!document.getElementById('toast-style')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'toast-style';
        styleSheet.textContent = `
            @keyframes toast-fade {
                0% { opacity: 0; transform: translate(-50%, 20px); }
                15% { opacity: 1; transform: translate(-50%, 0); }
                85% { opacity: 1; transform: translate(-50%, 0); }
                100% { opacity: 0; transform: translate(-50%, -20px); }
            }
        `;
        document.head.appendChild(styleSheet);
    }

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// --- Utility Helpers ---
function getMealTypeLabel(type) {
    switch (type) {
        case 'morning': return '朝食';
        case 'lunch': return '昼食';
        case 'dinner': return '夕食';
        case 'snack': return 'おやつ';
        default: return '食事';
    }
}

function getMealTypeEmoji(type) {
    switch (type) {
        case 'morning': return '🌅';
        case 'lunch': return '☀️';
        case 'dinner': return '🌙';
        case 'snack': return '☕';
        default: return '🍴';
    }
}

function getCategoryLabel(cat) {
    switch (cat) {
        case 'self-cooked': return '自炊';
        case 'eating-out': return '外食';
        case 'takeout': return '出来合い';
        default: return 'その他';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return '今日';
    if (dateStr === yesterday) return '昨日';
    
    return `${m}月${d}日`;
}
