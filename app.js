// ==========================================================================
// Firebase & LocalStorage Fallback Initialization
// ==========================================================================
let db = null;
let auth = null;
let currentUser = null;
let isGuestMode = false;

// Firebase configuration (using existing credentials or fallback to guest local-only)
const firebaseConfig = {
    apiKey: "AIzaSyC8bfzol0oGji86823dr8h2r4CIQjfbR0U",
    authDomain: "whatiate-7d5ba.firebaseapp.com",
    projectId: "whatiate-7d5ba",
    storageBucket: "whatiate-7d5ba.firebasestorage.app",
    messagingSenderId: "465598882926",
    appId: "1:465598882926:web:95c9343182a457178bf27f",
    measurementId: "G-2V65GWTWRE"
};

try {
    // Attempt Firebase initialization
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
    } else {
        console.warn("Firebase SDK not loaded. Defaulting to LocalStorage Mode.");
        isGuestMode = true;
    }
} catch (error) {
    console.error("Firebase init failed, switching to LocalStorage Mode:", error);
    isGuestMode = true;
}

// ==========================================================================
// Application State & Rebranding Admin Settings
// ==========================================================================
const ADMIN_EMAILS = ['doraganrei.oss@gmail.com', 'reido.doraganrei@gmail.com', 'reido.oss@gmail.com'];

function isAdmin() {
    return currentUser && 
           !isGuestMode && 
           currentUser.uid !== guestProfile.uid && 
           currentUser.email && 
           ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
}

let currentTab = 'timeline';
let timelineViewMode = 'grid'; // Grid mode is default for FoodTube
let likesViewMode = 'grid';

// Local memory cache for recipes and recommendations
let cachedRecipes = [];
let cachedRecommendations = [];
let drawnSessionIds = new Set(); // Excludes already drawn recipe IDs in Gacha session
let editingRecipeId = null; // Tracks the ID of the recipe being edited

// Default guest profile
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120&h=120";
let guestProfile = {
    uid: "guest-user-123",
    displayName: "ゲストシェフ 🍳",
    photoURL: DEFAULT_AVATAR
};

// ==========================================================================
// YouTube Parser Helpers
// ==========================================================================
function getYouTubeId(url) {
    if (!url) return null;
    // Trim spaces
    url = url.trim();
    // Check if it's already an 11-character video ID
    if (url.length === 11 && !url.includes('/') && !url.includes('.')) {
        return url;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getYouTubeThumbnail(videoId) {
    if (!videoId) return '';
    // Use maximum resolution default thumbnail (16:9 high res)
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

function isShortsVideo(url) {
    if (!url) return false;
    return url.toLowerCase().includes('/shorts/');
}

// ==========================================================================
// LocalStorage Database Operations (Guest Mode Fallback)
// ==========================================================================
function getLocalData(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
        console.error("LocalStorage read error", e);
        return defaultValue;
    }
}

function setLocalData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("LocalStorage write error", e);
    }
}

// ==========================================================================
// Database & Auth Controller
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initEventListeners();
    switchTab('timeline'); // Default active tab
});

function initAuth() {
    if (isGuestMode || !auth) {
        setupGuestSession();
        return;
    }

    // Monitor Firebase Auth state
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            isGuestMode = false;
            document.getElementById('headerLoginBtn').style.display = 'none';
            
            const userProfileHeader = document.getElementById('userProfileHeader');
            document.getElementById('userHeaderAvatar').src = user.photoURL || DEFAULT_AVATAR;
            document.getElementById('userHeaderName').innerText = user.displayName || "o";
            userProfileHeader.style.display = 'flex';
            
            updateAuthUiState();
            loadData();
        } else {
            // Check if user has selected guest session fallback
            const hasChosenGuest = localStorage.getItem('chosenGuestSession') === 'true';
            if (hasChosenGuest) {
                setupGuestSession();
            } else {
                // Show login overlay
                document.getElementById('loginOverlay').style.display = 'flex';
            }
        }
    });

    // Google Login Handler
    document.getElementById('googleLoginBtn').addEventListener('click', () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider)
            .then(() => {
                document.getElementById('loginOverlay').style.display = 'none';
                localStorage.setItem('chosenGuestSession', 'false');
            })
            .catch(error => {
                console.error("Google sign-in error:", error);
                alert("ログインに失敗しました。時間をおいて再度お試しください。");
            });
    });

    // Guest Mode login Handler
    document.getElementById('guestLoginBtn').addEventListener('click', () => {
        setupGuestSession();
        document.getElementById('loginOverlay').style.display = 'none';
    });

    // Header profile logout click
    document.getElementById('userProfileHeader').addEventListener('click', () => {
        if (confirm("ログアウトしますか？")) {
            if (auth) {
                auth.signOut().then(() => {
                    localStorage.removeItem('chosenGuestSession');
                    location.reload();
                });
            } else {
                localStorage.removeItem('chosenGuestSession');
                location.reload();
            }
        }
    });

    // Bind login buttons in guest placeholders
    document.querySelectorAll('.login-trigger-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const googleLoginBtn = document.getElementById('googleLoginBtn');
            if (googleLoginBtn) googleLoginBtn.click();
        });
    });
}

function updateAuthUiState() {
    const isRealUser = currentUser && !isGuestMode && currentUser.uid !== guestProfile.uid;
    const admin = isAdmin();

    // Toggle admin upload button
    const bottomNavUploadBtn = document.getElementById('bottomNavUploadBtn');
    if (bottomNavUploadBtn) {
        bottomNavUploadBtn.style.display = admin ? 'flex' : 'none';
    }

    // Toggle Everyone's Recommendations submit area
    const guestPlaceholder = document.getElementById('recommendGuestPlaceholder');
    const addRecommendForm = document.getElementById('addRecommendForm');
    
    if (guestPlaceholder && addRecommendForm) {
        if (isRealUser) {
            guestPlaceholder.style.display = 'none';
            addRecommendForm.style.display = 'block';
        } else {
            guestPlaceholder.style.display = 'block';
            addRecommendForm.style.display = 'none';
        }
    }

    // Toggle Gacha registered recipe list manager accordion (only visible to admin!)
    const gachaManagerAccordion = document.getElementById('gachaManagerAccordion');
    if (gachaManagerAccordion) {
        gachaManagerAccordion.style.display = admin ? 'block' : 'none';
    }
}

function setupGuestSession() {
    currentUser = guestProfile;
    isGuestMode = true;
    localStorage.setItem('chosenGuestSession', 'true');
    
    document.getElementById('headerLoginBtn').style.display = 'none';
    const userProfileHeader = document.getElementById('userProfileHeader');
    document.getElementById('userHeaderAvatar').src = guestProfile.photoURL;
    document.getElementById('userHeaderName').innerText = guestProfile.displayName;
    userProfileHeader.style.display = 'flex';
    
    updateAuthUiState();
    loadData();
}

// Load data either from Firestore or LocalStorage
function loadData() {
    if (db) {
        // Run migration from legacy 'shared_gacha_recipes' document if present (only if not guest mode)
        if (!isGuestMode && currentUser && currentUser.uid !== guestProfile.uid) {
            db.collection('meals').doc('shared_gacha_recipes').get()
                .then(doc => {
                    if (doc.exists) {
                        const data = doc.data();
                        const legacyRecipes = data.recipes || [];
                        if (legacyRecipes.length > 0) {
                            console.log("Migrating legacy recipes count:", legacyRecipes.length);
                            
                            db.collection('meals').get().then(snap => {
                                const existingVideoIds = new Set();
                                snap.forEach(d => {
                                    if (d.id !== 'shared_gacha_recipes' && d.data().videoId) {
                                        existingVideoIds.add(d.data().videoId);
                                    }
                                });
                                
                                const promises = [];
                                legacyRecipes.forEach(legacy => {
                                    if (!existingVideoIds.has(legacy.id)) {
                                        const mappedRecipe = {
                                            youtubeUrl: `https://www.youtube.com/watch?v=${legacy.id}`,
                                            videoId: legacy.id,
                                            dishName: legacy.title || '無題のレシピ',
                                            channelName: legacy.creator || 'YouTube',
                                            style: legacy.style || '自炊',
                                            mealTime: 'dinner',
                                            genre: 'その他',
                                            taste: legacy.taste || 'その他',
                                            ingredient: legacy.ingredients && legacy.ingredients.length > 0 ? legacy.ingredients[0] : 'その他',
                                            focus: legacy.focus || 'その他',
                                            review: '以前登録されたレシピ動画',
                                            likesCount: 0,
                                            likedUsers: [],
                                            createdBy: currentUser.uid,
                                            createdByName: currentUser.displayName || 'o',
                                            avatarUrl: currentUser.photoURL || DEFAULT_AVATAR,
                                            createdAt: new Date().toISOString()
                                        };
                                        promises.push(db.collection('meals').add(mappedRecipe));
                                    }
                                });
                                
                                Promise.all(promises).then(() => {
                                    db.collection('meals').doc('shared_gacha_recipes').delete()
                                        .then(() => console.log("Legacy recipe migration completed successfully."));
                                });
                            });
                        } else {
                            db.collection('meals').doc('shared_gacha_recipes').delete();
                        }
                    }
                }).catch(err => {
                    console.error("Migration check failed:", err);
                });
        }

        // Stream shared recipes from Firestore for EVERYONE (Guests and Logged in users!)
        db.collection('meals').orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                // Filter out the legacy migration document from rendering list
                cachedRecipes = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(r => r.id !== 'shared_gacha_recipes');
                renderFeed();
                updateRegisteredRecipesList();
            }, error => {
                console.error("Firestore meals stream error:", error);
                loadLocalRecipes();
            });
    } else {
        loadLocalRecipes();
    }

    // Stream recommended meals from Firestore (Guests and Logged in users!)
    if (db) {
        db.collection('recommended_meals').orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                cachedRecommendations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderRecommendations();
            }, error => {
                console.error("Firestore recommended stream error:", error);
                loadLocalRecommendations();
            });
    } else {
        loadLocalRecommendations();
    }
}

function loadLocalRecommendations() {
    cachedRecommendations = getLocalData('what_i_ate_recommendations', []);
    renderRecommendations();
}

function loadLocalRecipes() {
    cachedRecipes = getLocalData('what_i_ate_recipes', []);
    renderFeed();
    updateRegisteredRecipesList();
}

// ==========================================================================
// UI Tab Switcher
// ==========================================================================
function switchTab(tabId) {
    currentTab = tabId;
    
    // Update active state in panel views
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`tab-${tabId}`);
    if (activePanel) activePanel.classList.add('active');

    // Update active tab styling on Desktop Nav
    document.querySelectorAll('.app-nav .nav-tab').forEach(tab => {
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Update active tab styling on Mobile Bottom Nav
    document.querySelectorAll('.bottom-nav-bar .bottom-nav-item').forEach(item => {
        if (item.dataset.tab === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Refresh rendering depending on tab
    if (tabId === 'timeline') {
        renderFeed();
    } else if (tabId === 'recommend') {
        renderRecommendations();
    } else if (tabId === 'likes') {
        renderFeed();
    } else if (tabId === 'gacha') {
        resetGachaScreen();
        updateRegisteredRecipesList();
    }
}

// ==========================================================================
// Event Listeners Registration
// ==========================================================================
function initEventListeners() {
    // Navigation Tabs Event Listeners (Desktop)
    document.querySelectorAll('.app-nav .nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Navigation Tabs Event Listeners (Mobile Bottom)
    document.querySelectorAll('.bottom-nav-bar .bottom-nav-item').forEach(item => {
        if (item.dataset.tab) {
            item.addEventListener('click', () => switchTab(item.dataset.tab));
        }
    });

    // Bottom Navigation central Upload "+" button trigger
    const bottomNavUploadBtn = document.getElementById('bottomNavUploadBtn');
    if (bottomNavUploadBtn) {
        bottomNavUploadBtn.addEventListener('click', () => {
            resetAddMealFormState();
            document.getElementById('addMealModal').classList.add('active');
        });
    }

    // Modal close buttons
    document.querySelectorAll('.modal-overlay .close-btn, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Reset Add Meal Form state if it was open
            const addMealModal = document.getElementById('addMealModal');
            if (addMealModal && addMealModal.classList.contains('active')) {
                resetAddMealFormState();
            }
            // Close all overlays
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                if (modal.id !== 'loginOverlay') {
                    modal.classList.remove('active');
                }
            });
            // Stop YouTube player inside player iframe if active
            const iframeContainer = document.getElementById('youtubeIframeContainer');
            if (iframeContainer) iframeContainer.innerHTML = '';
        });
    });

    // Collapsible Filter Dashboard toggle
    const timelineFilterToggleBtn = document.getElementById('timelineFilterToggleBtn');
    const timelineFilterDashboard = document.getElementById('timelineFilterDashboard');
    if (timelineFilterToggleBtn && timelineFilterDashboard) {
        timelineFilterToggleBtn.addEventListener('click', () => {
            timelineFilterDashboard.classList.toggle('collapsed');
            timelineFilterToggleBtn.classList.toggle('active');
        });
    }

    // Bind top search input search events
    const searchInput = document.getElementById('recipeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => renderFeed());
    }

    // Bind 21 Tag Chips toggle events
    document.querySelectorAll('#timelineTagChips .tag-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            renderFeed();
        });
    });

    // Bind Sorting changes
    const filterSort = document.getElementById('filterSort');
    if (filterSort) {
        filterSort.addEventListener('change', () => renderFeed());
    }

    // Add recipe submit form handler
    const addMealForm = document.getElementById('addMealForm');
    if (addMealForm) {
        addMealForm.addEventListener('submit', handleAddRecipeSubmit);
    }

    // Add recommendation submit form handler
    const addRecommendForm = document.getElementById('addRecommendForm');
    if (addRecommendForm) {
        addRecommendForm.addEventListener('submit', handleAddRecommendSubmit);
    }

    // Gacha Lever pulling logic
    const gachaLever = document.getElementById('gachaLever');
    if (gachaLever) {
        gachaLever.addEventListener('click', triggerGachaSpin);
    }
    const gachaRetryBtn = document.getElementById('gachaRetryBtn');
    if (gachaRetryBtn) {
        gachaRetryBtn.addEventListener('click', triggerGachaSpin);
    }

    // Accordion expand logic
    const accordionHeader = document.getElementById('accordionHeader');
    const gachaManagerAccordion = document.getElementById('gachaManagerAccordion');
    if (accordionHeader && gachaManagerAccordion) {
        accordionHeader.addEventListener('click', () => {
            gachaManagerAccordion.classList.toggle('open');
        });
    }

    // Modal Close Cancellation buttons
    const cancelAddMealBtn = document.getElementById('cancelAddMealBtn');
    if (cancelAddMealBtn) {
        cancelAddMealBtn.addEventListener('click', () => {
            document.getElementById('addMealModal').classList.remove('active');
        });
    }
}

// ==========================================================================
// Recipe Submission Controller
// ==========================================================================
function handleAddRecipeSubmit(e) {
    e.preventDefault();

    // Verify Admin rights
    if (!isAdmin()) {
        alert("レシピの新規登録・編集は管理者のみ許可されています。");
        return;
    }

    const recipeUrl = document.getElementById('recipeUrl').value.trim();
    const recipeTitle = document.getElementById('recipeTitle').value.trim();
    const recipeChannel = document.getElementById('recipeChannel').value.trim();
    const recipeDescription = document.getElementById('recipeDescription').value.trim();
    
    // Retrieve checked 21 tags
    const recipeTags = Array.from(document.querySelectorAll('input[name="recipeTags"]:checked')).map(cb => cb.value);

    const videoId = getYouTubeId(recipeUrl);
    if (!videoId) {
        alert("有効なYouTube動画URLまたは動画IDを入力してください。");
        return;
    }

    if (editingRecipeId) {
        // UPDATE MODE
        if (isGuestMode || !db) {
            const index = cachedRecipes.findIndex(r => r.id === editingRecipeId);
            if (index !== -1) {
                cachedRecipes[index].youtubeUrl = recipeUrl;
                cachedRecipes[index].videoId = videoId;
                cachedRecipes[index].dishName = recipeTitle;
                cachedRecipes[index].channelName = recipeChannel;
                cachedRecipes[index].tags = recipeTags;
                cachedRecipes[index].description = recipeDescription;
                setLocalData('what_i_ate_recipes', cachedRecipes);
            }
            completeSubmission();
        } else {
            // Update Firestore
            db.collection('meals').doc(editingRecipeId).update({
                youtubeUrl: recipeUrl,
                videoId: videoId,
                dishName: recipeTitle,
                channelName: recipeChannel,
                tags: recipeTags,
                description: recipeDescription
            })
            .then(() => {
                completeSubmission();
            })
            .catch(error => {
                console.error("Firestore update error:", error);
                alert("更新に失敗しました。");
            });
        }
    } else {
        // CREATE MODE
        const newRecipe = {
            youtubeUrl: recipeUrl,
            videoId: videoId,
            dishName: recipeTitle,
            channelName: recipeChannel,
            tags: recipeTags,
            description: recipeDescription,
            likesCount: 0,
            likedUsers: [],
            createdBy: currentUser.uid,
            createdByName: currentUser.displayName,
            avatarUrl: currentUser.photoURL || DEFAULT_AVATAR,
            createdAt: new Date().toISOString()
        };

        if (isGuestMode || !db) {
            // Save to LocalStorage
            newRecipe.id = 'recipe_' + Date.now();
            cachedRecipes.unshift(newRecipe);
            setLocalData('what_i_ate_recipes', cachedRecipes);
            completeSubmission();
        } else {
            // Save to Firestore
            db.collection('meals').add(newRecipe)
                .then(() => {
                    completeSubmission();
                })
                .catch(error => {
                    console.error("Firestore save error:", error);
                    alert("登録に失敗しました。");
                });
        }
    }

    function completeSubmission() {
        resetAddMealFormState();
        document.getElementById('addMealModal').classList.remove('active');
        renderFeed();
        updateRegisteredRecipesList();
    }
}

function openEditRecipeModal(recipeId) {
    if (!isAdmin()) {
        alert("編集権限がありません。");
        return;
    }

    const recipe = cachedRecipes.find(r => r.id === recipeId);
    if (!recipe) {
        alert("該当するレシピが見つかりませんでした。");
        return;
    }

    editingRecipeId = recipeId;

    // Pre-populate input fields
    document.getElementById('recipeUrl').value = recipe.youtubeUrl || '';
    document.getElementById('recipeTitle').value = recipe.dishName || '';
    document.getElementById('recipeChannel').value = recipe.channelName || '';
    document.getElementById('recipeDescription').value = recipe.description || '';

    // Check matching tags
    document.querySelectorAll('input[name="recipeTags"]').forEach(cb => {
        cb.checked = recipe.tags && recipe.tags.includes(cb.value);
    });

    // Modify modal titles
    const modalTitle = document.querySelector('#addMealModal .form-title');
    if (modalTitle) {
        modalTitle.innerText = "レシピ情報の編集 ✏️";
    }
    const saveBtn = document.getElementById('saveMealBtn');
    if (saveBtn) {
        saveBtn.innerText = "更新する";
    }

    // Open the modal
    document.getElementById('addMealModal').classList.add('active');
}

function resetAddMealFormState() {
    editingRecipeId = null;
    const form = document.getElementById('addMealForm');
    if (form) form.reset();
    
    // Clear check boxes
    document.querySelectorAll('input[name="recipeTags"]').forEach(cb => {
        cb.checked = false;
    });

    const modalTitle = document.querySelector('#addMealModal .form-title');
    if (modalTitle) {
        modalTitle.innerText = "レシピ新規登録 🍳";
    }
    const saveBtn = document.getElementById('saveMealBtn');
    if (saveBtn) {
        saveBtn.innerText = "登録する";
    }
}

// ==========================================================================
// Timeline / Feed Rendering Engine
// ==========================================================================
function getFilteredRecipes() {
    let list = [...cachedRecipes];

    if (currentTab === 'likes') {
        if (!currentUser || isGuestMode || currentUser.uid === guestProfile.uid) {
            return [];
        }
        list = list.filter(r => r.likedUsers && r.likedUsers.includes(currentUser.uid));
    }

    // 1. Keyword search (料理名, チャンネル, タグ, コピペ説明文)
    const searchInput = document.getElementById('recipeSearchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        const query = searchInput.value.toLowerCase().trim();
        list = list.filter(r => {
            const nameMatch = r.dishName && r.dishName.toLowerCase().includes(query);
            const channelMatch = r.channelName && r.channelName.toLowerCase().includes(query);
            const tagsMatch = r.tags && r.tags.some(tag => tag.toLowerCase().includes(query));
            const descMatch = r.description && r.description.toLowerCase().includes(query);
            return nameMatch || channelMatch || tagsMatch || descMatch;
        });
    }

    // 2. Active tag chips filtering (AND logic)
    const activeChips = Array.from(document.querySelectorAll('#timelineTagChips .tag-chip.active')).map(btn => btn.dataset.tag);
    if (activeChips.length > 0) {
        list = list.filter(r => {
            return activeChips.every(tag => r.tags && r.tags.includes(tag));
        });
    }

    // 3. Sorting
    const sortVal = document.getElementById('filterSort') ? document.getElementById('filterSort').value : 'newest';
    if (sortVal === 'newest') {
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortVal === 'likes') {
        list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    }

    return list;
}

function renderFeed() {
    const list = getFilteredRecipes();

    // Map targets depending on active Tab
    const isLikesTab = (currentTab === 'likes');
    const feedContainer = document.getElementById(isLikesTab ? 'likesFeed' : 'timelineFeed');
    const gridContainer = document.getElementById(isLikesTab ? 'likesGrid' : 'timelineGrid');

    // Both containers hide list feed and show grid view
    if (feedContainer) feedContainer.style.display = 'none';
    if (gridContainer) gridContainer.style.display = 'grid';

    gridContainer.innerHTML = '';

    // Guard: for Likes Tab, if not logged in, show guest placeholder and hide grid
    if (isLikesTab && (!currentUser || isGuestMode || currentUser.uid === guestProfile.uid)) {
        const guestPlaceholder = document.getElementById('likesGuestPlaceholder');
        if (guestPlaceholder) guestPlaceholder.style.display = 'block';
        gridContainer.style.display = 'none';
        return;
    } else if (isLikesTab) {
        const guestPlaceholder = document.getElementById('likesGuestPlaceholder');
        if (guestPlaceholder) guestPlaceholder.style.display = 'none';
    }

    if (list.length === 0) {
        gridContainer.style.display = 'none';
        if (feedContainer) {
            feedContainer.style.display = 'flex';
            feedContainer.innerHTML = `
                <div class="feed-empty-state" style="text-align: center; padding: 40px 20px; width: 100%;">
                    <div class="empty-state-emoji" style="font-size: 48px; margin-bottom: 12px;">🍳</div>
                    <h3 style="font-weight: 800; font-size: 16px; margin-bottom: 8px;">レシピ動画がありません</h3>
                    <p style="font-size: 12px; color: var(--text-muted);">${isLikesTab ? 'お気に入りに登録された料理動画がありません。' : 'まだレシピ動画が登録されていません。'}</p>
                </div>
            `;
        }
        return;
    }

    list.forEach(recipe => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-post-item';
        
        // Show delete button on the card ONLY for admins in timeline
        const showDelete = isAdmin() && !isLikesTab;

        gridItem.innerHTML = `
            <img src="${getYouTubeThumbnail(recipe.videoId)}" alt="${recipe.dishName}" class="grid-post-img" onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${recipe.videoId}/hqdefault.jpg';">
            <div class="grid-post-overlay">
                <div class="grid-overlay-item">🤤 ${recipe.likesCount || 0}</div>
            </div>
            ${showDelete ? `
                <button class="grid-card-delete-btn" style="position: absolute; top: 8px; right: 8px; z-index: 10; background: rgba(0,0,0,0.6); color: #FFF; border: none; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px; transition: background 0.2s;" title="削除">🗑️</button>
            ` : ''}
            
            <div class="grid-post-title-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%); padding: 24px 8px 8px 8px; color: #FFF; text-align: left; text-shadow: 0 1px 2px rgba(0,0,0,0.7); pointer-events: none;">
                <div style="font-size: 11px; font-weight: 800; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-bottom: 2px;">${recipe.dishName}</div>
                <div style="font-size: 9px; opacity: 0.85; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">👤 ${recipe.channelName}</div>
            </div>
        `;

        gridItem.addEventListener('click', () => openVideoDetailModal(recipe.id));
        
        if (showDelete) {
            const delBtn = gridItem.querySelector('.grid-card-delete-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent opening video details modal
                deleteRecipe(recipe.id);
            });
        }
        
        gridContainer.appendChild(gridItem);
    });
}

function formatPostDate(isoStr) {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffMin < 1) return '今さっき';
    if (diffMin < 60) return `${diffMin}分前`;
    if (diffHr < 24) return `${diffHr}時間前`;
    if (diffDay === 1) return '昨日';
    if (diffDay < 7) return `${diffDay}日前`;
    
    // Default calendar dates format
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// ==========================================================================
// Recipe Rating & Interaction (Like / Delete)
// ==========================================================================
function toggleLikeRecipe(recipeId) {
    if (db && (isGuestMode || currentUser.uid === guestProfile.uid)) {
        // Close modal if open
        document.getElementById('youtubePlayerModal').classList.remove('active');
        const iframeContainer = document.getElementById('youtubeIframeContainer');
        if (iframeContainer) iframeContainer.innerHTML = '';
        
        document.getElementById('loginOverlay').style.display = 'flex';
        return;
    }

    // Check if it is a main timeline recipe or recommended recipe
    let idx = cachedRecipes.findIndex(r => r.id === recipeId);
    let isRecommended = false;
    let recipe = null;

    if (idx > -1) {
        recipe = cachedRecipes[idx];
    } else {
        idx = cachedRecommendations.findIndex(r => r.id === recipeId);
        if (idx > -1) {
            recipe = cachedRecommendations[idx];
            isRecommended = true;
        }
    }

    if (!recipe) return;
    if (!recipe.likedUsers) recipe.likedUsers = [];

    const userLikeIndex = recipe.likedUsers.indexOf(currentUser.uid);
    if (userLikeIndex > -1) {
        // Unlike
        recipe.likedUsers.splice(userLikeIndex, 1);
    } else {
        // Like
        recipe.likedUsers.push(currentUser.uid);
    }
    recipe.likesCount = recipe.likedUsers.length;

    if (isGuestMode || !db) {
        if (isRecommended) {
            cachedRecommendations[idx] = recipe;
            setLocalData('what_i_ate_recommendations', cachedRecommendations);
            renderRecommendations();
        } else {
            cachedRecipes[idx] = recipe;
            setLocalData('what_i_ate_recipes', cachedRecipes);
            renderFeed();
        }
        updateModalLikeState(recipe);
    } else {
        const collectionName = isRecommended ? 'recommended_meals' : 'meals';
        db.collection(collectionName).doc(recipeId).update({
            likedUsers: recipe.likedUsers,
            likesCount: recipe.likesCount
        }).then(() => {
            updateModalLikeState(recipe);
        });
    }
}

function updateModalLikeState(recipe) {
    const modal = document.getElementById('youtubePlayerModal');
    if (modal.classList.contains('active')) {
        const detailLikeBtn = document.getElementById('detailLikeBtn');
        const detailLikeCount = document.getElementById('detailLikeCount');
        
        const hasLiked = recipe.likedUsers && recipe.likedUsers.includes(currentUser.uid);
        if (hasLiked) {
            detailLikeBtn.classList.add('liked');
        } else {
            detailLikeBtn.classList.remove('liked');
        }
        detailLikeCount.innerText = recipe.likesCount || 0;
    }
}

function deleteRecipe(recipeId) {
    // Only admins can delete from timeline
    if (!isAdmin()) {
        alert("削除権限がありません。");
        return;
    }

    if (!confirm("このレシピ動画を削除しますか？")) return;

    if (isGuestMode || !db) {
        cachedRecipes = cachedRecipes.filter(r => r.id !== recipeId);
        setLocalData('what_i_ate_recipes', cachedRecipes);
        renderFeed();
        updateRegisteredRecipesList();
    } else {
        db.collection('meals').doc(recipeId).delete()
            .then(() => {
                console.log("Document successfully deleted.");
            })
            .catch(err => console.error("Error deleting document:", err));
    }
}

// ==========================================================================
// Embedded Video Player Modal Controller
// ==========================================================================
function openVideoDetailModal(recipeId) {
    const recipe = cachedRecipes.find(r => r.id === recipeId) || cachedRecommendations.find(r => r.id === recipeId);
    if (!recipe) return;

    // Set player markup
    const iframeContainer = document.getElementById('youtubeIframeContainer');
    const isShorts = isShortsVideo(recipe.youtubeUrl);
    
    if (isShorts) {
        iframeContainer.className = "youtube-player-wrapper shorts-mode";
        iframeContainer.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${recipe.videoId}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        `;
    } else {
        iframeContainer.className = "youtube-player-wrapper";
        iframeContainer.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${recipe.videoId}?autoplay=1&rel=0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        `;
    }

    // Set details text
    document.getElementById('detailVideoTitle').innerText = recipe.dishName;
    document.getElementById('detailChannelName').innerText = recipe.channelName;
    document.getElementById('detailUserName').innerText = recipe.createdByName || 'おすすめシェフ';
    document.getElementById('detailUserReview').innerText = recipe.description || '動画の説明・材料リストはありません。';

    // Tags list
    const tagsContainer = document.getElementById('detailTagsContainer');
    tagsContainer.innerHTML = '';
    if (recipe.tags && recipe.tags.length > 0) {
        recipe.tags.forEach(tag => {
            const badge = document.createElement('span');
            badge.className = 'post-tag-badge';
            badge.innerText = `#${tag}`;
            badge.style.marginRight = '4px';
            tagsContainer.appendChild(badge);
        });
    }

    // Like button state
    const detailLikeBtn = document.getElementById('detailLikeBtn');
    const hasLiked = recipe.likedUsers && recipe.likedUsers.includes(currentUser.uid);
    if (hasLiked) {
        detailLikeBtn.classList.add('liked');
    } else {
        detailLikeBtn.classList.remove('liked');
    }
    document.getElementById('detailLikeCount').innerText = recipe.likesCount || 0;

    // Remove old listeners
    const newLikeBtn = detailLikeBtn.cloneNode(true);
    detailLikeBtn.parentNode.replaceChild(newLikeBtn, detailLikeBtn);
    newLikeBtn.addEventListener('click', () => toggleLikeRecipe(recipe.id));

    document.getElementById('youtubePlayerModal').classList.add('active');
}

// ==========================================================================
// Date Picker Modal (For calendar scheduling)
// ==========================================================================
// ==========================================================================
// Everyone's Recommendations Board Controller
// ==========================================================================
function renderRecommendations() {
    const gridContainer = document.getElementById('recommendGrid');
    if (!gridContainer) return;
    
    gridContainer.innerHTML = '';
    
    // Guard: show guest placeholder if not logged in
    const isRealUser = currentUser && !isGuestMode && currentUser.uid !== guestProfile.uid;
    const guestPlaceholder = document.getElementById('recommendGuestPlaceholder');
    const addRecommendForm = document.getElementById('addRecommendForm');
    
    if (guestPlaceholder && addRecommendForm) {
        if (isRealUser) {
            guestPlaceholder.style.display = 'none';
            addRecommendForm.style.display = 'block';
        } else {
            guestPlaceholder.style.display = 'block';
            addRecommendForm.style.display = 'none';
        }
    }

    if (cachedRecommendations.length === 0) {
        gridContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; width: 100%; grid-column: 1 / -1;">
                <p style="font-size: 12px; color: var(--text-muted);">投稿されたおすすめ料理動画がまだありません。</p>
            </div>
        `;
        return;
    }

    cachedRecommendations.forEach(recipe => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-post-item';
        
        // Show delete button if user is Admin OR if they authored this recommendation
        const canDelete = isAdmin() || (currentUser && !isGuestMode && currentUser.uid === recipe.createdBy);

        gridItem.innerHTML = `
            <img src="${getYouTubeThumbnail(recipe.videoId)}" alt="${recipe.dishName}" class="grid-post-img" onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${recipe.videoId}/hqdefault.jpg';">
            <div class="grid-post-overlay">
                <div class="grid-overlay-item">🤤 ${recipe.likesCount || 0}</div>
            </div>
            ${canDelete ? `
                <button class="grid-card-delete-btn" style="position: absolute; top: 8px; right: 8px; z-index: 10; background: rgba(0,0,0,0.6); color: #FFF; border: none; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 11px; transition: background 0.2s;" title="削除">🗑️</button>
            ` : ''}
            
            <div class="grid-post-title-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%); padding: 24px 8px 8px 8px; color: #FFF; text-align: left; text-shadow: 0 1px 2px rgba(0,0,0,0.7); pointer-events: none;">
                <div style="font-size: 11px; font-weight: 800; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; margin-bottom: 2px;">${recipe.dishName}</div>
                <div style="font-size: 9px; opacity: 0.85; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">👤 ${recipe.createdByName || 'おすすめシェフ'}</div>
            </div>
        `;

        gridItem.addEventListener('click', () => openVideoDetailModal(recipe.id));
        
        if (canDelete) {
            const delBtn = gridItem.querySelector('.grid-card-delete-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent detail modal pop
                deleteRecommendation(recipe.id);
            });
        }
        
        gridContainer.appendChild(gridItem);
    });
}

function deleteRecommendation(recipeId) {
    if (!confirm("このおすすめ投稿を削除しますか？")) return;

    if (isGuestMode || !db) {
        cachedRecommendations = cachedRecommendations.filter(r => r.id !== recipeId);
        setLocalData('what_i_ate_recommendations', cachedRecommendations);
        renderRecommendations();
    } else {
        db.collection('recommended_meals').doc(recipeId).delete()
            .then(() => {
                console.log("Recommendation deleted successfully.");
            })
            .catch(err => console.error("Error deleting recommendation:", err));
    }
}

function handleAddRecommendSubmit(e) {
    e.preventDefault();

    if (!currentUser || isGuestMode || currentUser.uid === guestProfile.uid) {
        alert("ログインが必要です。");
        return;
    }

    const url = document.getElementById('recommendUrl').value.trim();
    const title = document.getElementById('recommendTitle').value.trim();
    const channel = document.getElementById('recommendChannel').value.trim();
    const description = document.getElementById('recommendDescription').value.trim();
    
    // Checked tags array
    const tags = Array.from(document.querySelectorAll('input[name="recommendTags"]:checked')).map(cb => cb.value);

    const videoId = getYouTubeId(url);
    if (!videoId) {
        alert("有効なYouTube動画URLを入力してください。");
        return;
    }

    const newRecommend = {
        youtubeUrl: url,
        videoId: videoId,
        dishName: title,
        channelName: channel,
        tags: tags,
        description: description,
        likesCount: 0,
        likedUsers: [],
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || 'おすすめシェフ',
        avatarUrl: currentUser.photoURL || DEFAULT_AVATAR,
        createdAt: new Date().toISOString()
    };

    if (isGuestMode || !db) {
        newRecommend.id = 'rec_' + Date.now();
        cachedRecommendations.unshift(newRecommend);
        setLocalData('what_i_ate_recommendations', cachedRecommendations);
        completeSubmission();
    } else {
        db.collection('recommended_meals').add(newRecommend)
            .then(() => {
                completeSubmission();
            })
            .catch(err => {
                console.error("Firestore recommended add error:", err);
                alert("共有に失敗しました。");
            });
    }

    function completeSubmission() {
        document.getElementById('addRecommendForm').reset();
        alert("おすすめレシピ動画を共有しました！📢");
        renderRecommendations();
    }
}

// ==========================================================================
// Curation Gacha Simulator Engine
// ==========================================================================
function resetGachaScreen() {
    document.getElementById('gachaScreenContent').innerHTML = `<div class="gacha-placeholder">❓</div>`;
    document.getElementById('gachaResultCard').style.display = 'none';
    const iframeContainer = document.getElementById('gachaYoutubeContainer');
    if (iframeContainer) iframeContainer.innerHTML = '';
    document.getElementById('gachaLever').classList.remove('pulled');
}

function triggerGachaSpin() {
    const list = cachedRecipes; // Draw from all registered videos
    if (list.length === 0) {
        alert("ガチャに登録されている動画がありません。先にフィードの「＋」ボタンからYouTubeレシピ動画を登録してください！");
        return;
    }

    // Filter out recipes already drawn in this session
    let availableList = list.filter(r => !drawnSessionIds.has(r.id));
    if (availableList.length === 0) {
        // Auto reset session draw history when all are exhausted
        drawnSessionIds.clear();
        availableList = list;
    }

    // Lever animation
    const lever = document.getElementById('gachaLever');
    lever.classList.add('pulled');

    // Visual screen roll effect
    const screen = document.getElementById('gachaScreenContent');
    screen.innerHTML = `
        <div class="rolling">
            <div style="font-size: 32px; padding: 4px;">🍛</div>
            <div style="font-size: 32px; padding: 4px;">🍔</div>
            <div style="font-size: 32px; padding: 4px;">🍜</div>
            <div style="font-size: 32px; padding: 4px;">🍣</div>
            <div style="font-size: 32px; padding: 4px;">🍖</div>
        </div>
    `;

    // Pick random recipe item
    const randomIndex = Math.floor(Math.random() * availableList.length);
    const chosenRecipe = availableList[randomIndex];

    // Mark as drawn in the current session
    drawnSessionIds.add(chosenRecipe.id);

    // Stop roll after 1.4s
    setTimeout(() => {
        // Display circular capsule ball inside Gacha screen
        screen.innerHTML = `
            <img src="${getYouTubeThumbnail(chosenRecipe.videoId)}" alt="${chosenRecipe.dishName}" 
                 style="width: 75px; height: 75px; border-radius: 50%; object-fit: cover; border: 3px solid #FFC045; box-shadow: 0 4px 10px rgba(0,0,0,0.3); animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);" 
                 onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${chosenRecipe.videoId}/hqdefault.jpg';">
        `;
        
        // Pop result card details
        document.getElementById('gachaResultTitle').innerText = chosenRecipe.dishName;
        
        let creatorText = `「${chosenRecipe.createdByName || '管理者'}」の登録レシピ！`;
        let reviewText = chosenRecipe.description ? `「${chosenRecipe.description}」` : '（紹介メモなし）';
        
        document.getElementById('gachaResultDesc').innerHTML = `
            <div style="font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${creatorText}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 8px;">チャンネル: ${chosenRecipe.channelName}</div>
            <div style="font-style: italic; font-size: 11px; color: var(--text-light); margin-top: 6px; padding-left: 8px; border-left: 2px solid var(--border-color); white-space: pre-wrap; text-align: left; max-height: 120px; overflow-y: auto; background: var(--bg-main); padding: 8px; border-radius: var(--radius-sm);">${reviewText}</div>
        `;
        
        // Dynamically recreate the iframe to force loading in all browser security contexts
        const iframeContainer = document.getElementById('gachaYoutubeContainer');
        if (iframeContainer) {
            iframeContainer.innerHTML = `
                <iframe id="gachaYoutubeIframe" src="https://www.youtube.com/embed/${chosenRecipe.videoId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"></iframe>
            `;
        }
        
        // Configure Gacha Like button
        const likeBtn = document.getElementById('gachaLikeBtn');
        if (likeBtn) {
            const newLikeBtn = likeBtn.cloneNode(true);
            likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);
            
            const hasLiked = chosenRecipe.likedUsers && chosenRecipe.likedUsers.includes(currentUser.uid);
            newLikeBtn.innerText = hasLiked ? 'お気に入りから外す 💔' : 'お気に入りに追加する 💛';
            if (hasLiked) {
                newLikeBtn.style.background = '#FFD2D2';
                newLikeBtn.style.color = '#D60000';
                newLikeBtn.style.border = '1px solid #D60000';
            } else {
                newLikeBtn.style.background = '';
                newLikeBtn.style.color = '';
                newLikeBtn.style.border = '';
            }

            newLikeBtn.addEventListener('click', () => {
                toggleLikeRecipe(chosenRecipe.id);
                setTimeout(() => {
                    const freshRecipe = cachedRecipes.find(r => r.id === chosenRecipe.id);
                    if (freshRecipe) {
                        const nowLiked = freshRecipe.likedUsers && freshRecipe.likedUsers.includes(currentUser.uid);
                        newLikeBtn.innerText = nowLiked ? 'お気に入りから外す 💔' : 'お気に入りに追加する 💛';
                        if (nowLiked) {
                            newLikeBtn.style.background = '#FFD2D2';
                            newLikeBtn.style.color = '#D60000';
                            newLikeBtn.style.border = '1px solid #D60000';
                        } else {
                            newLikeBtn.style.background = '';
                            newLikeBtn.style.color = '';
                            newLikeBtn.style.border = '';
                        }
                    }
                }, 200);
            });
        }
        
        const resultCard = document.getElementById('gachaResultCard');
        resultCard.style.display = 'block';

        // Auto scroll down smoothly to result card
        setTimeout(() => {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);

        // Reset lever styling state
        lever.classList.remove('pulled');
    }, 1400);
}

// ==========================================================================
// Recipe Manager Accordion List
// ==========================================================================
function updateRegisteredRecipesList() {
    const listContainer = document.getElementById('customRecipesList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    // Update registered count label
    document.getElementById('registeredCount').innerText = cachedRecipes.length;

    if (cachedRecipes.length === 0) {
        listContainer.innerHTML = `<div class="custom-recipe-empty">登録されているレシピ動画がありません。</div>`;
        return;
    }

    cachedRecipes.forEach(recipe => {
        const item = document.createElement('div');
        item.className = 'custom-recipe-item';
        item.innerHTML = `
            <div class="custom-recipe-info">
                <div class="custom-recipe-title">${recipe.dishName}</div>
                <div class="custom-recipe-creator">${recipe.channelName}</div>
            </div>
            ${isAdmin() ? `
            <div class="custom-recipe-actions">
                <button class="edit-recipe-btn" data-id="${recipe.id}">編集 ✏️</button>
                <button class="delete-recipe-btn" data-id="${recipe.id}">削除 🗑️</button>
            </div>
            ` : ''}
        `;
        
        // Video details open listener
        item.querySelector('.custom-recipe-info').addEventListener('click', () => {
            openVideoDetailModal(recipe.id);
        });

        // Recipe actions (Edit / Delete)
        if (isAdmin()) {
            item.querySelector('.edit-recipe-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditRecipeModal(recipe.id);
            });
            item.querySelector('.delete-recipe-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRecipe(recipe.id);
            });
        }

        listContainer.appendChild(item);
    });
}
