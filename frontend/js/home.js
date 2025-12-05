/* -----------------------------
   DUMMY CHALLENGES
----------------------------- */
const dummyChallenges = [
  { id: 'c1', title: "30‑Day Morning Meditation", tags: ["Wellness", "Long-term"], participants: 234, duration: "30 days", location: "San Francisco", description: "Start every day with a 10‑minute morning meditation.", points: 50 },
  { id: 'c2', title: "7‑Day Water Challenge", tags: ["Health", "Short-term"], participants: 567, duration: "7 days", location: "Los Angeles", description: "Drink 8 cups of water daily.", points: 20 },
  { id: 'c3', title: "Read 5 Books This Month", tags: ["Learning", "Long-term"], participants: 189, duration: "30 days", location: "New York", description: "Read 5 books this month.", points: 40 },
  { id: 'c4', title: "100 Push‑ups Daily", tags: ["Fitness", "Short-term"], participants: 312, duration: "14 days", location: "Austin", description: "100 push‑ups every day.", points: 30 },
  { id: 'c5', title: "14‑Day No Social Media", tags: ["Mindfulness", "Short-term"], participants: 423, duration: "14 days", location: "San Francisco", description: "Take a break from social media.", points: 25 },
  { id: 'c6', title: "21‑Day Gratitude Journal", tags: ["Wellness", "Long-term"], participants: 445, duration: "21 days", location: "Chicago", description: "Write 3 things you're grateful for each day.", points: 35 },
  { id: 'c7', title: "5K Run Training", tags: ["Fitness", "Long-term"], participants: 289, duration: "30 days", location: "Seattle", description: "Train daily for a 5K run.", points: 45 },
  { id: 'c8', title: "Learn Spanish in 60 Days", tags: ["Learning", "Long-term"], participants: 198, duration: "60 days", location: "Miami", description: "Learn beginner‑intermediate Spanish.", points: 60 }
];

/* -----------------------------
   LOCAL STORAGE HELPERS
----------------------------- */
function getJoinedChallenges() {
  return JSON.parse(localStorage.getItem("joinedChallenges")) || [];
}
function saveJoinedChallenges(arr) {
  localStorage.setItem("joinedChallenges", JSON.stringify(arr));
}

if (!localStorage.getItem("userPoints")) {
  localStorage.setItem("userPoints", "0");
}

function addUserPoints(pts) {
  const now = parseInt(localStorage.getItem("userPoints"));
  localStorage.setItem("userPoints", now + pts);
}

/* -----------------------------
   CREATE CHALLENGE CARD
----------------------------- */
function createCard(ch) {
  const joined = getJoinedChallenges();
  const isJoined = joined.includes(ch.id);

  const card = document.createElement("div");
  card.className = "challenge-card";

  card.innerHTML = `
    <h3>${ch.title}</h3>
    <div class="tags">${ch.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div>
    <div class="location">📍 ${ch.location}</div>
    <div class="duration">⏳ ${ch.duration}</div>
    <div><small>${ch.participants} participants</small></div>
    <div class="challenge-points">⭐ Earn ${ch.points} pts</div>
    <button class="${isJoined ? 'joined-button' : 'join-btn'}"
            data-id="${ch.id}">
      ${isJoined ? "Joined ✅" : "Join Challenge"}
    </button>
  `;
  return card;
}

/* -----------------------------
   LOAD CHALLENGES
----------------------------- */
function loadChallenges(list) {
  const grid = document.getElementById("challengeGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = `<p style="text-align:center; color:#666; margin-top:2rem;">No challenges to show.</p>`;
    return;
  }

  list.forEach(ch => grid.appendChild(createCard(ch)));

  document.querySelectorAll(".join-btn").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const joined = getJoinedChallenges();
      if (!joined.includes(id)) {
        joined.push(id);
        saveJoinedChallenges(joined);

        const ch = dummyChallenges.find(c => c.id === id);
        addUserPoints(ch.points);

        updateMyTabCount();
        filterChallenges(currentFilter);
        alert(`🎉 You earned ${ch.points} points!`);
      }
    };
  });

  // (If you had detail modal) add click for joined-button
  // document.querySelectorAll(".joined-button").forEach(btn => {
  //   btn.onclick = () => openChallengeDetail(btn.dataset.id);
  // });
}

let currentFilter = "all";

function filterChallenges(type) {
  currentFilter = type;
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelector(`.tab[data-tab="${type}"]`)?.classList.add("active");

  if (type === "my") {
    const joined = getJoinedChallenges();
    loadChallenges(dummyChallenges.filter(ch => joined.includes(ch.id)));
  } else {
    loadChallenges(dummyChallenges);
  }
}

function updateMyTabCount() {
  const joined = getJoinedChallenges();
  const myTab = document.querySelector('.tab[data-tab="my"]');
  if (myTab) myTab.textContent = `My Challenges (${joined.length})`;
}

/* -----------------------------
   BUDDY LIST + SEARCH WITH CHALLENGES
----------------------------- */
const allUsers = [
  { id: "u1", name: "Siddhi", location: "San Francisco", joinedChallenges: ["c1"] },
  { id: "u2", name: "Prakriti", location: "Seattle", joinedChallenges: ["c2", "c4"] },
  { id: "u3", name: "Ananya", location: "New York", joinedChallenges: ["c3", "c8"] },
  { id: "u4", name: "Yash", location: "Austin", joinedChallenges: ["c4"] },
  { id: "u5", name: "Zara", location: "Miami", joinedChallenges: ["c8"] }
];

function getBuddyList() {
  return JSON.parse(localStorage.getItem("buddyList")) || [];
}
function saveBuddyList(arr) {
  localStorage.setItem("buddyList", JSON.stringify(arr));
}

function renderBuddyList() {
  const ul = document.getElementById("buddyList");
  if (!ul) return;

  const buddies = getBuddyList();
  if (!buddies.length) {
    ul.innerHTML = `<li class="buddy-empty">No buddies yet. Use search to add friends!</li>`;
    return;
  }

  ul.innerHTML = buddies.map(uid => {
    const user = allUsers.find(u => u.id === uid);
    if (!user) return "";

    const initials = user.name.charAt(0).toUpperCase();
    const joinedTitles = user.joinedChallenges
      .map(cid => dummyChallenges.find(c => c.id === cid)?.title)
      .filter(Boolean)
      .join(", ");

    return `
      <li>
        <div class="buddy-info">
          <div class="buddy-avatar">${initials}</div>
          <div>
            <div class="buddy-name">${user.name}</div>
            <div class="buddy-meta">📍 ${user.location}</div>
            <div class="buddy-meta">🏆 ${joinedTitles || "No challenges yet"}</div>
          </div>
        </div>
        <button class="buddy-remove" onclick="removeBuddy('${uid}')">Remove</button>
      </li>
    `;
  }).join("");
}

function removeBuddy(uid) {
  const updated = getBuddyList().filter(b => b !== uid);
  saveBuddyList(updated);
  renderBuddyList();
}

function handleSearchInput(e) {
  const q = e.target.value.trim().toLowerCase();
  const results = q
    ? allUsers.filter(u => u.name.toLowerCase().includes(q))
    : [];

  renderSearchResults(results);
}

function renderSearchResults(list) {
  const box = document.getElementById("searchResults");
  if (!box) return;

  if (!list.length) {
    box.innerHTML = `<div class="no-results">No users found.</div>`;
    return;
  }

  box.innerHTML = list.map(u => {
    const initials = u.name.charAt(0).toUpperCase();
    const joinedTitles = u.joinedChallenges
      .map(cid => dummyChallenges.find(c => c.id === cid)?.title)
      .filter(Boolean)
      .join(", ");

    return `
      <div class="search-item" data-id="${u.id}">
        <div class="search-avatar">${initials}</div>
        <div class="search-info">
          <div class="search-name">${u.name}</div>
          <div class="search-location">📍 ${u.location}</div>
          <div class="search-challenges">🏆 ${joinedTitles || "No challenges yet"}</div>
        </div>
        <button class="add-buddy-btn">➕ Add Buddy</button>
      </div>
    `;
  }).join("");

  box.querySelectorAll(".add-buddy-btn").forEach(btn => {
    btn.onclick = () => {
      const uid = btn.parentElement.getAttribute("data-id");
      const buddies = getBuddyList();
      if (!buddies.includes(uid)) {
        buddies.push(uid);
        saveBuddyList(buddies);
        renderBuddyList();
        alert("Buddy added!");
      } else {
        alert("Already in your buddy list!");
      }
    };
  });
}

/* -----------------------------
   MOTIVATION FEED WITH EDITABLE COMMENTS
----------------------------- */
function getFeed() {
  return JSON.parse(localStorage.getItem("motivationFeed")) || [];
}
function saveFeed(feed) {
  localStorage.setItem("motivationFeed", JSON.stringify(feed));
}
function generateId() {
  return "p_" + Math.random().toString(36).substr(2, 9);
}

function renderFeed() {
  const container = document.getElementById("motivationFeed");
  if (!container) return;

  const feed = getFeed();
  container.innerHTML = feed.map(post => {
    const commentsHTML = post.comments.map((c, i) => `
      <div class="comment" data-comment-index="${i}">
        <span class="comment-author">${c.author}:</span>
        <span class="comment-text">${escapeHtml(c.text)}</span>
        <button class="edit-comment-btn">✏️ Edit</button>
      </div>
    `).join("");

    return `
      <li class="post" data-id="${post.id}">
        <div class="post-header">
          <div class="author">${post.author}</div>
          <div class="time">${new Date(post.time).toLocaleString()}</div>
        </div>
        <div class="post-content">${escapeHtml(post.text)}</div>
        <div class="post-actions">
          <button class="like-btn ${post.liked ? 'liked' : ''}">❤️ ${post.likes}</button>
          <button class="comment-toggle-btn">💬 ${post.comments.length}</button>
          <button class="edit-post-btn">✏️ Edit</button>
<button class="delete-btn">🗑️ Delete</button>

        </div>
        <div class="comments" style="display:${post.comments.length ? 'block' : 'none'}">
          ${commentsHTML}
          <form class="comment-form">
            <input type="text" placeholder="Add a comment..." required />
            <button type="submit">Comment</button>
          </form>
        </div>
      </li>
    `;
  }).join("");

  attachPostHandlers();
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}


function attachPostHandlers() {
  document.querySelectorAll(".post").forEach(postEl => {
    const id = postEl.getAttribute("data-id");
    const feed = getFeed();
    const postObj = feed.find(x => x.id === id);
    if (!postObj) return;

    postEl.querySelector(".like-btn").onclick = () => {
      postObj.liked = !postObj.liked;
      postObj.likes += postObj.liked ? 1 : -1;
      saveFeed(feed);
      renderFeed();
    };

    postEl.querySelector(".delete-btn").onclick = () => {
      if (confirm("Delete this post?")) {
        const newFeed = feed.filter(x => x.id !== id);
        saveFeed(newFeed);
        renderFeed();
      }
    };

    postEl.querySelector(".comment-toggle-btn").onclick = () => {
      const cDiv = postEl.querySelector(".comments");
      cDiv.style.display = cDiv.style.display === "none" ? "block" : "none";
    };

    postEl.querySelector(".comment-form").onsubmit = e => {
      e.preventDefault();
      const input = e.target.querySelector("input");
      const commentText = input.value.trim();
      if (!commentText) return;

      postObj.comments.push({ author: "You", text: commentText });
      saveFeed(feed);
      renderFeed();
    };

    postEl.querySelector(".edit-post-btn").onclick = () => {
      const contentDiv = postEl.querySelector(".post-content");

      contentDiv.innerHTML = `
    <textarea class="edit-post-input">${escapeHtml(postObj.text)}</textarea>
    <div style="margin-top: 0.5rem;">
      <button class="save-post-btn">💾 Save</button>
      <button class="cancel-post-btn">❌ Cancel</button>
    </div>
  `;

      postEl.querySelector(".save-post-btn").onclick = () => {
        const newText = postEl.querySelector(".edit-post-input").value.trim();
        if (newText) {
          postObj.text = newText;
          saveFeed(feed);
          renderFeed();
        }
      };

      postEl.querySelector(".cancel-post-btn").onclick = () => {
        renderFeed();
      };
    };

  });
}

function ensureDummyPosts() {
  if (!Array.isArray(getFeed()) || getFeed().length === 0) {
    const initial = [
      { id: generateId(), author: "Demo", text: "Welcome to the Motivation Feed of BuddyBoost!", time: Date.now() - 86400000, likes: 1, liked: false, comments: [] }
    ];
    saveFeed(initial);
  }
}

/* -----------------------------
    BACKEND CONFIG
----------------------------- */
const API_URL = window.API_BASE_URL;
const token = localStorage.getItem("buddyToken");

function getLoggedInUserId() {
  try {
    const u = JSON.parse(localStorage.getItem("buddyUser"));
    return u?.userId || u?.id || u?.user_id || null;
  } catch {
    return null;
  }
}

/* -----------------------------
    LOAD FEED (API)
----------------------------- */
async function loadFeed() {
  const feed = document.getElementById("feedContainer");
  if (!feed) return;

  const res = await fetch(`${API_URL}/posts`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  feed.innerHTML = "";

  if (!data.success) return;

  data.posts.forEach(post => {
    const postDiv = document.createElement("div");
    postDiv.className = "post-card";

    postDiv.innerHTML = `
      <p><strong>${post.author.firstName}:</strong> ${post.content}</p>
      <small>${new Date(post.createdAt).toLocaleString()}</small>

      <button class="react-btn" data-id="${post.id}">
        ❤️ ${post.reaction_count}
      </button>

      <button class="comment-btn" data-id="${post.id}">💬 Comment</button>

      ${post.userId === getLoggedInUserId()
        ? `
          <button class="edit-btn" data-id="${post.id}">✏️ Edit</button>
          <button class="delete-btn" data-id="${post.id}">🗑 Delete</button>
        `
        : ""
      }

      <div class="comment-section" id="comments-${post.id}"></div>
      <hr>
    `;

    feed.appendChild(postDiv);

    loadComments(post.id);
  });
}

/* -----------------------------
    LOAD COMMENTS
----------------------------- */
async function loadComments(postId) {
  const box = document.getElementById(`comments-${postId}`);
  if (!box) return;

  const res = await fetch(`${API_URL}/comments/post/${postId}`);
  const data = await res.json();

  if (!data.success) return;

  box.innerHTML = data.comments
    .map(
      c => `
        <div class="single-comment">
          <b>${c.author.firstName}</b>: ${c.content}
          ${c.userId === getLoggedInUserId()
          ? `<button class="delete-comment-btn" data-id="${c.id}">❌</button>`
          : ""
        }
        </div>
      `
    )
    .join("");
}

/* -----------------------------
    ADD COMMENT
----------------------------- */
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("comment-btn")) return;

  const postId = e.target.dataset.id;
  const comment = prompt("Write your comment:");

  if (!comment || !comment.trim()) return;

  const res = await fetch(`${API_URL}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ post_id: postId, content: comment })
  });

  const data = await res.json();
  if (data.success) loadFeed();
  else alert(data.message);
});

/* -----------------------------
    DELETE COMMENT
----------------------------- */
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("delete-comment-btn")) return;

  if (!confirm("Delete this comment?")) return;

  const id = e.target.dataset.id;

  const res = await fetch(`${API_URL}/comments/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data.success) loadFeed();
});

/* -----------------------------
    LIKE / UNLIKE (TOGGLE)
----------------------------- */
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("react-btn")) return;

  const postId = e.target.dataset.id;

  const res = await fetch(`${API_URL}/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      post_id: postId,
      reaction_type: "love"
    })
  });

  await res.json();
  loadFeed();
});

/* -----------------------------
    DELETE POST (API)
----------------------------- */
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("delete-btn")) return;

  if (!confirm("Delete this post?")) return;

  const id = e.target.dataset.id;

  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  if (data.success) loadFeed();
});

/* -----------------------------
    EDIT POST (API)
----------------------------- */
document.addEventListener("click", async e => {
  if (!e.target.classList.contains("edit-btn")) return;

  const id = e.target.dataset.id;
  const newContent = prompt("Update post:");

  if (!newContent || !newContent.trim()) return;

  const res = await fetch(`${API_URL}/posts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content: newContent.trim(), image_url: null })
  });

  const data = await res.json();
  if (data.success) loadFeed();
});

/* -----------------------------
    CREATE POST (API)
----------------------------- */

function initPostCreation() {
  const form = document.getElementById("postForm");
  const input = document.getElementById("postContent");

  if (!form || !input) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const content = input.value.trim();

    // 1. Validation Check (stops execution if empty)
    if (!content) {
      return alert("Write something first!");
    }

    // 2. LOCAL STORAGE POST (for immediate visual feedback)
    // We capture the content before the API call to ensure it's not empty
    const localFeed = getFeed();
    const newLocalPost = {
      id: generateId(),
      author: "You",
      text: content,
      time: Date.now(),
      likes: 0,
      liked: false,
      comments: []
    };
    localFeed.unshift(newLocalPost);
    saveFeed(localFeed);
    renderFeed(); // Update local UI immediately

    // 3. API POST
    const res = await fetch(`${API_URL}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, image_url: null })
    });

    // 4. Cleanup & Error Handling (Checking res.ok is key for 500 error handling)
    const data = await res.json();

    if (res.ok && data.success) {
      // API Success: Clear input, reload official posts
      input.value = "";
      loadFeed();
    } else {
      // API Failure (e.g., 500 Internal Server Error)
      console.error(`API post failed (Status ${res.status}):`, data.message || "Internal Server Error");
      alert(`Post failed to reach the server. Error: ${data.message || '500 Internal Server Error'}. The local post has been removed.`);

      // Remove the temporary local post to prevent confusion
      let updatedFeed = getFeed().filter(p => p.id !== newLocalPost.id);
      saveFeed(updatedFeed);
      renderFeed();
    }
  });
}

/* -----------------------------
    INIT
----------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  // Initialize Tab Listeners
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => filterChallenges(btn.dataset.tab));
  });

  // Attach search input listener (using correct ID "buddyInput")
  document.getElementById("buddyInput")?.addEventListener("input", handleSearchInput);

  // Initialize Local Storage Feed
  ensureDummyPosts();
  renderFeed();

  // Initialize Challenges and Buddy List
  renderBuddyList();
  filterChallenges("all");
  updateMyTabCount();

  // Initialize API-related functions
  initPostCreation();
  loadFeed();
});