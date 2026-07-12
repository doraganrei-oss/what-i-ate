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
const detailStarsInner = document.getElementById('detailStarsInner');
const detailComment = document.getElementById('detailComment');

// Calendar Elements
const calendarTitle = document.getElementById('calendarTitle');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');

// Stats Elements
const selfCookedSegment = document.getElementById('selfCookedSegment');
const selfCookedPercent = document.getElementById('selfCookedPercent');
const countSelf = document.getElementById('countSelf');
const countOut = document.getElementById('countOut');
const countTakeout = document.getElementById('countTakeout');
const countMorning = document.getElementById('countMorning');
const countLunch = document.getElementById('countLunch');
const countDinner = document.getElementById('countDinner');
const countSnack = document.getElementById('countSnack');
const fillMorning = document.getElementById('fillMorning');
const fillLunch = document.getElementById('fillLunch');
const fillDinner = document.getElementById('fillDinner');
const fillSnack = document.getElementById('fillSnack');
const avgRating = document.getElementById('avgRating');
const avgStars = document.getElementById('avgStars');
const statsComment = document.getElementById('statsComment');
const streakCount = document.getElementById('streakCount');

// Gacha Elements
const gachaBtn = document.getElementById('gachaBtn');
const gachaLever = document.getElementById('gachaLever');
const gachaScreenContent = document.getElementById('gachaScreenContent');
const gachaResultCard = document.getElementById('gachaResultCard');
const gachaResultTitle = document.getElementById('gachaResultTitle');
const gachaResultDesc = document.getElementById('gachaResultDesc');
const gachaAcceptBtn = document.getElementById('gachaAcceptBtn');
const gachaRetryBtn = document.getElementById('gachaRetryBtn');

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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    initEventListeners();
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
                }
            });
            
            // Set up real-time listener for shared meal data (guests can read too!)
            db.collection('meals').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
                posts = [];
                snapshot.forEach((doc) => {
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
                else if (activeTab === 'stats') updateStats();
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
    updateStats();
    updateStreak();
}

function updateUserProfileUI() {
    userHeaderName.textContent = userProfile.nickname || "名無し";
    userHeaderAvatar.src = userProfile.avatar || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";
    userProfileHeader.style.display = 'flex';
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


// Set up all event listeners
function initEventListeners() {
    // Navigation Tabs Switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            navTabs.forEach(t => t.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const targetPanel = document.getElementById(`tab-${tab.dataset.tab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }

            // Perform specific updates based on selected tab
            if (tab.dataset.tab === 'calendar') {
                renderCalendar();
            } else if (tab.dataset.tab === 'stats') {
                updateStats();
            }
        });
    });

    // Timeline Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderFeed();
        });
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
    gachaAcceptBtn.addEventListener('click', () => {
        gachaResultCard.style.display = 'none';
        // Auto fill form with gacha details
        const selected = gachaResultTitle.textContent;
        openModalBtn.click();
        document.getElementById('dishName').value = selected;
    });
    gachaRetryBtn.addEventListener('click', spinGacha);

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
function renderFeed() {
    feedGrid.innerHTML = '';
    
    const filteredPosts = posts.filter(post => {
        if (currentFilter === 'all') return true;
        return post.mealType === currentFilter;
    });

    if (filteredPosts.length === 0) {
        feedGrid.innerHTML = `
            <div class="empty-state">
                <span class="empty-emoji">🥣</span>
                <p>まだこの時間帯の投稿がありません。<br>今日食べたものを記録してみましょう！</p>
            </div>
        `;
        return;
    }

    filteredPosts.forEach(post => {
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

        // Check if current user has liked this post
        const hasLiked = db
            ? (currentUser && post.deliciousUsers && post.deliciousUsers.includes(currentUser.uid))
            : (getLikedPostsLocal().includes(post.id));
        const activeClass = hasLiked ? 'active' : '';

        card.innerHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    ${avatarHtml}
                    <span class="post-username">${post.username}</span>
                </div>
                <div class="post-meta">
                    <span class="post-time">${formatDate(post.date)}</span>
                    <div class="post-badges">
                        <span class="post-badge type-${post.mealType}">${getMealTypeLabel(post.mealType)}</span>
                        <span class="post-badge cat-${post.category}">${getCategoryLabel(post.category)}</span>
                        ${actionButtonsHtml}
                    </div>
                </div>
            </div>
            <div class="post-img-container" onclick="openDetailModal('${post.id}')">
                <img src="${post.image}" alt="${post.dishName}" class="post-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'">
            </div>
            <div class="post-body">
                <div class="post-stars-rating">${'★'.repeat(post.rating)}${'☆'.repeat(5 - post.rating)}</div>
                <h3 class="post-dish-name">${post.dishName}</h3>
                <p class="post-comment">${post.comment}</p>
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
    
    // Read star rating
    let rating = 3;
    const starRadios = document.getElementsByName('rating');
    for (let radio of starRadios) {
        if (radio.checked) {
            rating = parseInt(radio.value);
            break;
        }
    }

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
                rating: rating,
                comment: comment,
                image: mealImage
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
                post.rating = rating;
                post.comment = comment;
                post.image = mealImage;
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
        rating: rating,
        comment: comment,
        image: mealImage,
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
        updateStats();
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
    
    // 星評価ラジオボタンを設定
    const starRadios = document.getElementsByName('rating');
    for (let radio of starRadios) {
        radio.checked = (parseInt(radio.value) === post.rating);
    }
    
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
    detailStarsInner.style.width = `${post.rating * 20}%`;
    detailComment.textContent = post.comment || "メモはありません。";

    // Populate Author Profile Card
    const detailAuthorAvatar = document.getElementById('detailAuthorAvatar');
    const detailAuthorName = document.getElementById('detailAuthorName');
    const detailAuthorBio = document.getElementById('detailAuthorBio');

    const isCustomImage = post.avatar && (post.avatar.startsWith('data:image/') || post.avatar.startsWith('http'));
    detailAuthorAvatar.src = isCustomImage ? post.avatar : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23FFF0EC'/><text x='50' y='60' font-size='40' text-anchor='middle'>🥑</text></svg>";
    
    detailAuthorName.textContent = post.username || "匿名";
    detailAuthorBio.textContent = post.userBio || "自己紹介はありません。";

    detailModal.classList.add('active');
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
        
        // Find if user has a meal logged on this day
        const dayMeals = posts.filter(post => post.date === dateStr);
        
        if (dayMeals.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'day-indicator';
            
            // Show thumbnail for the first meal of the day
            const meal = dayMeals[0];
            if (meal.image) {
                indicator.innerHTML = `<img src="${meal.image}" alt="${meal.dishName}" class="day-thumb">`;
            } else {
                indicator.innerHTML = `<span class="day-emoji">${getMealTypeEmoji(meal.mealType)}</span>`;
            }
            
            cell.appendChild(indicator);
            
            // Click to open details
            cell.addEventListener('click', () => {
                openDetailModal(meal.id);
            });
        }
        
        calendarDays.appendChild(cell);
    }
}

// --- Stats calculation Logic ---
function updateStats() {
    const total = posts.length;
    if (total === 0) return;

    // 1. Self-cooked Ratio
    const selfCount = posts.filter(p => p.category === 'self-cooked').length;
    const outCount = posts.filter(p => p.category === 'eating-out').length;
    const takeCount = posts.filter(p => p.category === 'takeout').length;
    
    countSelf.textContent = selfCount;
    countOut.textContent = outCount;
    countTakeout.textContent = takeCount;
    
    const selfRatio = Math.round((selfCount / total) * 100);
    selfCookedPercent.textContent = `${selfRatio}%`;
    
    // Draw SVG circle segment
    // Circle radius = 60, circumference = 2 * PI * 60 = ~377
    const strokeDash = (selfRatio / 100) * 377;
    selfCookedSegment.style.strokeDasharray = `${strokeDash} 377`;

    // 2. Meal Type Distributions
    const morningNum = posts.filter(p => p.mealType === 'morning').length;
    const lunchNum = posts.filter(p => p.mealType === 'lunch').length;
    const dinnerNum = posts.filter(p => p.mealType === 'dinner').length;
    const snackNum = posts.filter(p => p.mealType === 'snack').length;
    
    countMorning.textContent = `${morningNum}回`;
    countLunch.textContent = `${lunchNum}回`;
    countDinner.textContent = `${dinnerNum}回`;
    countSnack.textContent = `${snackNum}回`;
    
    const maxVal = Math.max(morningNum, lunchNum, dinnerNum, snackNum, 1);
    fillMorning.style.width = `${(morningNum / maxVal) * 100}%`;
    fillLunch.style.width = `${(lunchNum / maxVal) * 100}%`;
    fillDinner.style.width = `${(dinnerNum / maxVal) * 100}%`;
    fillSnack.style.width = `${(snackNum / maxVal) * 100}%`;

    // 3. Satisfaction Score (Average rating)
    const ratingSum = posts.reduce((sum, p) => sum + p.rating, 0);
    const avg = (ratingSum / total).toFixed(1);
    avgRating.textContent = avg;
    avgStars.style.width = `${avg * 20}%`; // Avg out of 5 mapped to percent

    // Dynamic advice text
    if (avg >= 4.5) {
        statsComment.textContent = "美味しいごはんに溢れていますね！素晴らしい毎日です！✨";
    } else if (avg >= 3.5) {
        statsComment.textContent = "バランスの良い豊かな食生活が送れていますね！🍎";
    } else {
        statsComment.textContent = "美味しかったメニューをお気に入りに登録して、楽しみを増やしましょう！🍙";
    }
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

// --- Spin Gacha Action ---
function spinGacha() {
    // Prevent double clicking
    if (gachaLever.classList.contains('pulled')) return;

    // 1. Pulled lever animation
    gachaLever.classList.add('pulled');
    
    // Reset result view
    gachaResultCard.style.display = 'none';
    
    // 2. Rolling animation on screen
    gachaScreenContent.innerHTML = '';
    const rollingText = document.createElement('div');
    rollingText.className = 'rolling';
    rollingText.textContent = "🍔 🍜 🍳 🍱 🥞 🍣 🍛";
    gachaScreenContent.appendChild(rollingText);
    
    // Choose random menu item
    const selectedMeal = GACHA_DB[Math.floor(Math.random() * GACHA_DB.length)];

    setTimeout(() => {
        // Reset lever
        gachaLever.classList.remove('pulled');
        
        // Show result on gacha screen
        gachaScreenContent.innerHTML = `<span style="font-size: 36px;">${selectedMeal.emoji}</span>`;
        
        // Show detail result card
        gachaResultTitle.textContent = selectedMeal.title;
        gachaResultDesc.textContent = selectedMeal.desc;
        gachaResultCard.style.display = 'block';
    }, 1500); // Roll for 1.5 seconds
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
        case 'takeout': return 'テイクアウト';
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
