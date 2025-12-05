// rewards.js

// Dummy list of available rewards
const availableRewards = [
  { id: 'r1', name: "🎁 $10 Amazon Gift Card", description: "Redeemable as an Amazon digital gift card.", cost: 500 },
  { id: 'r2', name: "🌟 Premium BuddyBoost Badge", description: "Highlight badge for your profile for 30 days.", cost: 300 },
  { id: 'r3', name: "🧠 Productivity e‑Book", description: "Download a curated productivity e‑book.", cost: 200 },
  { id: 'r4', name: "☕ Starbucks Coffee Voucher", description: "Redeem a digital coffee voucher.", cost: 150 },
  { id: 'r5', name: "🏅 Custom Avatar Frame", description: "Decorative frame for your profile avatar.", cost: 250 },
  { id: 'r6', name: "📅 1‑Month Premium Kindle Access", description: "Access to premium challenges and content.", cost: 1000 }
];

// Load user state from localStorage (or initialize)
let userState = JSON.parse(localStorage.getItem("buddyRewardsUser")) || {
  points: 800,          // example starting points
  redeemed: []         // list of reward ids redeemed
};

// Utility to save state
function saveState() {
  localStorage.setItem("buddyRewardsUser", JSON.stringify(userState));
}

// Render user points
function renderPoints() {
  const el = document.getElementById("userPoints");
  el.innerText = userState.points;
}

// Render reward cards
function renderRewards() {
  const grid = document.getElementById("rewardsGrid");
  grid.innerHTML = "";

  availableRewards.forEach(r => {
    const card = document.createElement("div");
    card.className = "reward-card";

    const claimed = userState.redeemed.includes(r.id);
    const affordable = userState.points >= r.cost;

    card.innerHTML = `
      <h3>${r.name}</h3>
      <p>${r.description}</p>
      <div class="cost">Cost: ${r.cost} pts</div>
      <button ${claimed ? 'disabled class="claimed"' : (affordable ? '' : 'disabled')}>
        ${claimed ? "Redeemed ✅" : (affordable ? "Redeem" : "Not enough points")}
      </button>
    `;

    // Attach click handler if redeemable
    const btn = card.querySelector("button");
    if (!claimed && affordable) {
      btn.addEventListener("click", () => {
        // Deduct points, mark redeemed, save state, re-render
        userState.points -= r.cost;
        userState.redeemed.push(r.id);
        saveState();
        renderPoints();
        renderRewards();
        alert(`You redeemed: ${r.name}`);
      });
    }

    grid.appendChild(card);
  });
}

// Init on load
window.addEventListener("DOMContentLoaded", () => {
  renderPoints();
  renderRewards();
});
