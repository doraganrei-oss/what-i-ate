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

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initData();
    initEventListeners();
    // For LocalStorage mode, fallbackToLocalStorage() will handle rendering.
    // For Firebase mode, the Firestore onSnapshot listener will handle rendering.
});

// Load posts from LocalStorage or Firebase
function initData() {
    const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.startsWith("YOUR_");
    
    if (isFirebaseConfigured) {
        try {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            
            // Set up real-time listener for shared data
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
                        username: data.username || "あなた",
                        avatar: data.avatar || "🥑",
                        dishName: data.dishName || "",
                        mealType: data.mealType || "lunch",
                        category: data.category || "self-cooked",
                        rating: data.rating || 3,
                        comment: data.comment || "",
                        image: data.image || "",
                        date: dateStr || new Date().toISOString().split('T')[0],
                        deliciousCount: data.deliciousCount || 0
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
        addMealModal.classList.add('active');
        // Reset form
        mealForm.reset();
        imagePreview.style.display = 'none';
        dropzoneText.style.display = 'block';
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
        card.innerHTML = `
            <div class="post-header">
                <div class="post-user-info">
                    <div class="post-avatar">${post.avatar || '🍴'}</div>
                    <span class="post-username">${post.username}</span>
                </div>
                <div class="post-meta">
                    <span class="post-time">${formatDate(post.date)}</span>
                    <div class="post-badges">
                        <span class="post-badge type-${post.mealType}">${getMealTypeLabel(post.mealType)}</span>
                        <span class="post-badge cat-${post.category}">${getCategoryLabel(post.category)}</span>
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
                        <button class="delicious-btn" onclick="handleDeliciousClick(this, '${post.id}', event)">
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

    const newPost = {
        username: "あなた",
        avatar: "🥑",
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
    // Trigger emoji floating particles locally
    const emojis = ['🤤', '🍕', '🍰', '🥞', '🍔', '🍛', '🍳', '✨', '💛'];
    const buttonRect = button.getBoundingClientRect();
    
    for (let i = 0; i < 4; i++) {
        setTimeout(() => {
            const particle = document.createElement('span');
            particle.className = 'emoji-particle';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            
            // Random horizontal offsets & rotation angles
            const randomX = (Math.random() - 0.5) * 40; // -20px to 20px
            const randomRot = (Math.random() - 0.5) * 60; // -30deg to 30deg
            
            particle.style.left = `${buttonRect.left + buttonRect.width / 2 + randomX}px`;
            particle.style.top = `${buttonRect.top + window.scrollY - 10}px`;
            particle.style.setProperty('--rotation', `${randomRot}deg`);
            
            document.body.appendChild(particle);
            
            // Remove after animation finishes
            particle.addEventListener('animationend', () => {
                particle.remove();
            });
        }, i * 100);
    }

    if (db) {
        // Firebase mode: Update in remote Firestore database (onSnapshot will refresh UI)
        db.collection('meals').doc(postId).update({
            deliciousCount: firebase.firestore.FieldValue.increment(1)
        }).catch(err => {
            console.error("Firestore update failed:", err);
        });
    } else {
        // LocalStorage mode
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        post.deliciousCount = (post.deliciousCount || 0) + 1;
        localStorage.setItem('what-i-ate-posts', JSON.stringify(posts));
        
        // Update counter text inside this card only
        const countEl = button.querySelector('.delicious-count');
        if (countEl) countEl.textContent = post.deliciousCount;
    }
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
