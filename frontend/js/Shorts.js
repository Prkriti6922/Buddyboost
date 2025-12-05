// shorts.js

let dummyShorts = [
  { id: 's1', title: "5‑Minute Morning Yoga Flow", videoId: "sTANio_2E0Q", videoType: "youtube", date: "2025-11-26", author: "Alex" },
  { id: 's2', title: "Quick HIIT for Busy Days", videoId: "ml6cT4AZdqI", videoType: "youtube", date: "2025-11-25", author: "Jordan" },
  { id: 's3', title: "Meditation: Calm Your Mind", videoId: "inpok4MKVLM", videoType: "youtube", date: "2025-11-24", author: "Sam" },
  { id: 's4', title: "Healthy Smoothie Recipe 🍓", videoId: "1G4isv_Fylg", videoType: "youtube", date: "2025-11-23", author: "Taylor" },
  { id: 's5', title: "Learn Spanish: Day 1", videoId: "xScyO5bZa7Y", videoType: "youtube", date: "2025-11-22", author: "Maria" },
  { id: 's6', title: "Evening Stretch Routine", videoId: "bMteR_tmyhY", videoType: "youtube", date: "2025-11-21", author: "Chris" },
  { id: 's7', title: "Productivity Tips While Working", videoId: "1nXP4kHodZA", videoType: "youtube", date: "2025-11-20", author: "Lee" },
  { id: 's8', title: "Gratitude Journal Setup 📔", videoId: "kXYiU_JCYtU", videoType: "youtube", date: "2025-11-19", author: "Nina" }
];

// Extract YouTube video ID from URL or raw ID
function extractYouTubeID(input) {
  input = input.trim();
  const urlPattern = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([A-Za-z0-9_-]{11})/;
  const urlMatch = input.match(urlPattern);
  if (urlMatch) return urlMatch[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(input)) return input;
  return null;
}

// Generate video card
function createShortCard(sh) {
  const card = document.createElement('div');
  card.className = 'video-card';

  let media;
  if (sh.videoType === 'youtube') {
    media = `
      <div class="video-container">
        <iframe
          src="https://www.youtube.com/embed/${sh.videoId}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>`;
  } else {
    media = `
      <div class="video-container">
        <video controls src="${sh.videoBlobURL}" preload="metadata"></video>
      </div>`;
  }

  card.innerHTML = `
    ${media}
    <div class="info">
      <div class="title">${sh.title}</div>
      <div class="meta">By ${sh.author} • ${new Date(sh.date).toLocaleDateString()}</div>
    </div>
  `;

  return card;
}

// Render all shorts
function loadShorts(list) {
  const grid = document.getElementById('shortsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  list.forEach(sh => grid.appendChild(createShortCard(sh)));
}

// Modal logic
const modal = document.getElementById('createShortModal');
const openBtn = document.getElementById('openCreateShort');
const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelShort');
const form = document.getElementById('shortForm');
const sourceSel = document.getElementById('videoSourceSelect');
const ytGroup = document.getElementById('youtubeInputGroup');
const fileGroup = document.getElementById('uploadInputGroup');
const fileInput = document.getElementById('videoFile');

function toggleSourceFields() {
  if (sourceSel.value === 'youtube') {
    ytGroup.classList.remove('hidden');
    fileGroup.classList.add('hidden');
  } else {
    ytGroup.classList.add('hidden');
    fileGroup.classList.remove('hidden');
  }
}

openBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
  toggleSourceFields();
});

cancelBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  form.reset();
  toggleSourceFields();
});

sourceSel.addEventListener('change', toggleSourceFields);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = form.shortTitle.value.trim();
  const author = form.author.value.trim() || "Anonymous";
  const date = new Date().toISOString().split('T')[0];

  if (sourceSel.value === 'youtube') {
    const raw = form.videoUrl.value;
    const vId = extractYouTubeID(raw);
    if (!vId) {
      alert("Please enter a valid YouTube URL or ID.");
      return;
    }
    dummyShorts.unshift({
      id: 's' + (dummyShorts.length + 1),
      title, author, date,
      videoId: vId,
      videoType: 'youtube'
    });
  } else {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a video file.");
      return;
    }
    const blobURL = URL.createObjectURL(file);
    dummyShorts.unshift({
      id: 's' + (dummyShorts.length + 1),
      title, author, date,
      videoBlobURL: blobURL,
      videoType: 'file'
    });
  }

  loadShorts(dummyShorts);
  modal.classList.add('hidden');
  form.reset();
  toggleSourceFields();
});

window.addEventListener('DOMContentLoaded', () => {
  toggleSourceFields();
  loadShorts(dummyShorts);
});

// BACKEND INTEGRATION
const API_BASE = "http://localhost:4000/api";
const token = localStorage.getItem("buddyToken");

// ✅ Load Shorts from Backend (if available)
async function loadShortsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.posts)) {
      const backendShorts = data.posts.map(p => ({
        id: "p" + p.post_id,
        title: p.content.slice(0, 50) + "...",
        author: p.author?.firstName || "User",
        date: p.createdAt || new Date().toISOString().split("T")[0],
        videoId: p.imageUrl || "kXYiU_JCYtU", // fallback ID
        videoType: "youtube"
      }));

      dummyShorts = backendShorts.concat(dummyShorts);
      loadShorts(dummyShorts);
      console.log("Shorts loaded from backend ✅");
    }
  } catch (err) {
    console.warn("Failed to fetch backend shorts:", err);
  }
}

// ✅ Upload New Short to Backend
async function uploadShortToBackend(shortData) {
  if (!token) {
    alert("Please log in to upload your short!");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        content: shortData.title,
        image_url: shortData.videoType === "youtube" ? shortData.videoId : null
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      alert("Short successfully uploaded ✅");
      console.log("Uploaded:", data);
      loadShortsFromBackend();
    } else {
      alert(`Upload failed: ${data.message}`);
    }
  } catch (err) {
    console.error("Error uploading short:", err);
    alert("Server error while uploading short.");
  }
}

// Optional — replace front-end dummy submission with backend
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = form.shortTitle.value.trim();
  const author = form.author.value.trim() || "Anonymous";
  const date = new Date().toISOString().split("T")[0];

  let newShort;
  if (sourceSel.value === "youtube") {
    const raw = form.videoUrl.value;
    const vId = extractYouTubeID(raw);
    if (!vId) {
      alert("Please enter a valid YouTube URL or ID.");
      return;
    }
    newShort = { title, author, date, videoId: vId, videoType: "youtube" };
  } else {
    const file = fileInput.files[0];
    if (!file) {
      alert("Please select a video file.");
      return;
    }
    const blobURL = URL.createObjectURL(file);
    newShort = { title, author, date, videoBlobURL: blobURL, videoType: "file" };
  }

  await uploadShortToBackend(newShort);

  modal.classList.add("hidden");
  form.reset();
  toggleSourceFields();
});

// Fetch backend shorts on page load
window.addEventListener("DOMContentLoaded", loadShortsFromBackend);