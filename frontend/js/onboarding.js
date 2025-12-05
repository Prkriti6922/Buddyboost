// List of motivation options (you can customize this)
const motivations = [
  "Fitness & Health", "Learning & Growth", "Mental Wellness",
  "Productivity", "Creativity", "Social Connection",
  "Mindfulness", "Career Growth", "Building Habits",
  "Personal Achievement", "Focus & Discipline", "Adventure & Fun"
];

const grid = document.getElementById("motivationGrid");
const continueBtn = document.getElementById("continueBtn");
let selected = [];

// Dynamically render the motivation options
motivations.forEach(motivation => {
  const btn = document.createElement("button");
  btn.textContent = motivation;
  btn.classList.add("motivation-btn");

  btn.addEventListener("click", () => {
    if (btn.classList.contains("selected")) {
      btn.classList.remove("selected");
      selected = selected.filter(item => item !== motivation);
    } else if (selected.length < 3) {
      btn.classList.add("selected");
      selected.push(motivation);
    }

    // Update button state and text
    continueBtn.disabled = selected.length !== 3;
    continueBtn.textContent = selected.length === 3 ? "Continue" : `Select ${3 - selected.length} more`;
  });

  grid.appendChild(btn);
});

// Redirect to home page with selected motivations
continueBtn.addEventListener("click", () => {
  localStorage.setItem("userMotivations", JSON.stringify(selected));
  window.location.href = "home.html";
});

// BACKEND INTEGRATION
const API_BASE = "http://localhost:4000/api";
const token = localStorage.getItem("buddyToken");

// ✅ Save selected motivations (goals) to backend
async function saveMotivationsToBackend(goals) {
  if (!token) {
    console.warn("No login token found — skipping backend save.");
    return;
  }

  try {
    for (const goal of goals) {
      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content: `Motivation Goal: ${goal}`,
          image_url: null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.warn(`Failed to save goal "${goal}":`, data.message);
      }
    }

    console.log("✅ Motivations successfully saved to backend!");
  } catch (err) {
    console.error("❌ Error saving motivations:", err);
  }
}

// Override continue button to also save to backend
continueBtn.addEventListener("click", async () => {
  if (selected.length === 3) {
    await saveMotivationsToBackend(selected);
  }
});