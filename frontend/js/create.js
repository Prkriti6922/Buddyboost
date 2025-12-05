// create.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("challengeForm");
  const cancelBtn = document.getElementById("cancelBtn");

  const token = localStorage.getItem("buddyToken");
  const API = `${API_BASE_URL}/posts`;

  // Cancel button
  cancelBtn.addEventListener("click", () => form.reset());

  // Submit form
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const category = document.getElementById("category").value.trim();
    const duration = document.getElementById("duration").value.trim();
    const durationType = document.getElementById("type").value.trim();
    const location = document.getElementById("location").value.trim() || "Not specified";

    // Create post text
    const content =
      `🔥 New Challenge: ${title}\n\n` +
      `📌 Category: ${category}\n` +
      `⏳ Duration: ${duration} days (${durationType})\n` +
      `📍 Location: ${location}\n\n` +
      `📝 Description:\n${description}`;

    if (!token) {
      alert("Please login before creating a challenge!");
      return;
    }

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          image_url: null
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert("🎉 Challenge Posted Successfully!");
        form.reset();
        window.location.href = "home.html";  // redirect to feed
      } else {
        alert(`Failed: ${data.message}`);
      }

    } catch (err) {
      console.error("Error creating challenge:", err);
      alert("Server error while creating your challenge.");
    }
  });
});
