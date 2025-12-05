// ------------------
// CONFIG FIRST (IMPORTANT)
// ------------------
const API_BASE = "http://localhost:4000/api";
const token = localStorage.getItem("buddyToken");

// Load stored profile OR defaults
let userData = JSON.parse(localStorage.getItem("buddyUser")) || {
  name: "Google User",
  email: "user@gmail.com",
  tags: ["Mental Wellness", "Learning & Growth", "Creativity"],
  photo: null,
  stats: { active: 0, streak: 12, goals: 24, days: 87 },
  achievements: [
    "First Challenge — Unlocked",
    "Week Warrior — Unlocked",
    "Connected With 10 Buddies — Unlocked"
  ],
  activity: [
    "Completed Day 12 of Morning Meditation",
    "Joined 100 Push-ups Challenge",
    "Achieved 10-day streak"
  ]
};

// ------------------
// RENDER PROFILE
// ------------------
function renderProfile() {
  // Use a fallback empty string for safety
  const name = userData.name || "";
  const email = userData.email || "N/A";

  document.getElementById("userName").innerText = name;
  document.getElementById("userEmail").innerText = email;

  const pf = document.getElementById("profileAvatar");
  const nav = document.getElementById("navAvatar");

  // Safety check for name initial
  const initial = name.length > 0 ? name[0].toUpperCase() : 'U';

  if (userData.photo) {
    pf.style.backgroundImage = `url(${userData.photo})`;
    pf.style.backgroundSize = "cover";
    nav.style.backgroundImage = `url(${userData.photo})`;
    nav.style.backgroundSize = "cover";
    pf.innerText = "";
    nav.innerText = "";
  } else {
    pf.style.backgroundImage = "";
    nav.style.backgroundImage = "";
    pf.innerText = initial;
    nav.innerText = initial;
  }

  // === FIX for TypeError: Cannot read properties of undefined (reading 'forEach') ===
  const tagDiv = document.getElementById("userTags");
  tagDiv.innerHTML = "";
  // If userData.tags is null/undefined, default to an empty array []
  const tags = userData.tags || [];

  tags.forEach(t => {
    const span = document.createElement("span");
    span.classList.add("tag");
    span.innerText = t;
    tagDiv.appendChild(span);
  });
  // =================================================================================

  // Safety check for stats object
  const stats = userData.stats || {};

  document.getElementById("statActive").innerText = stats.active || 0;
  document.getElementById("statStreak").innerText = stats.streak || 0;
  document.getElementById("statGoals").innerText = stats.goals || 0;
  document.getElementById("statDays").innerText = stats.days || 0;

  // Safety check for achievements array
  const ach = document.getElementById("achievementsList");
  ach.innerHTML = "";
  const achievements = userData.achievements || [];

  achievements.forEach(a => {
    const box = document.createElement("div");
    box.innerText = a;
    ach.appendChild(box);
  });

  // Safety check for activity array
  const act = document.getElementById("activityList");
  act.innerHTML = "";
  const activity = userData.activity || [];

  activity.forEach(a => {
    const li = document.createElement("li");
    li.innerText = a;
    act.appendChild(li);
  });
}

renderProfile();

// ------------------
// EDIT PROFILE MODAL
// ------------------
const modal = document.getElementById("editModal");
const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveEdit");
const cancelBtn = document.getElementById("cancelEdit");

editBtn.onclick = () => {
  modal.classList.remove("hidden");
  document.getElementById("editName").value = userData.name;
  document.getElementById("editEmail").value = userData.email;
  document.getElementById("editTags").value = userData.tags.join(", ");
};

cancelBtn.onclick = () => modal.classList.add("hidden");

saveBtn.onclick = () => {
  userData.name = document.getElementById("editName").value.trim();
  userData.email = document.getElementById("editEmail").value.trim();
  userData.tags = document.getElementById("editTags").value.split(",").map(t => t.trim());

  const file = document.getElementById("editPhoto").files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      userData.photo = reader.result;
      updateAndRender();
    };
    reader.readAsDataURL(file);
  } else {
    updateAndRender();
  }

  function updateAndRender() {
    localStorage.setItem("buddyUser", JSON.stringify(userData));
    modal.classList.add("hidden");
    renderProfile();
  }
};

// ------------------
// DELETE ACCOUNT
// ------------------
const deleteBtn = document.getElementById("deleteAccountBtn");
const deleteModal = document.getElementById("deleteModal");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

deleteBtn.addEventListener("click", () => {
  deleteModal.classList.remove("hidden");
});

cancelDelete.addEventListener("click", () => {
  deleteModal.classList.add("hidden");
});

confirmDelete.addEventListener("click", async () => {
  if (!token) return alert("You are not logged in.");

  try {
    const res = await fetch(`${API_BASE}/users/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok && data.success) {
      localStorage.clear();
      alert("Your account has been deleted permanently.");
      window.location.href = "login.html";
    } else {
      alert(data.message || "Unable to delete account.");
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Server error deleting account.");
  }
});

// ------------------
// BACKEND PROFILE LOAD
// ------------------
async function loadProfileFromBackend() {
  if (!token) return console.warn("No token found.");

  try {
    const res = await fetch(`${API_BASE}/users/profile`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok && data.success) {
      userData.name = `${data.user.firstName} ${data.user.lastName}`;
      userData.email = data.user.email;

      localStorage.setItem("buddyUser", JSON.stringify(userData));
      renderProfile();
    }
  } catch (err) {
    console.error("Profile fetch failed:", err);
  }
}

loadProfileFromBackend();

// ------------------
// LOGOUT
// ------------------
async function logoutUser() {
  try {
    await fetch(`${API_BASE}/users/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (e) {
    console.warn("Logout skipped.");
  }

  localStorage.removeItem("buddyUser");
  localStorage.removeItem("buddyToken");
  window.location.href = "login.html";
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
