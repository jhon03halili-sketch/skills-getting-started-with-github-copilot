document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Create participants list HTML
        let participantsHTML = "<ul class='participants-list'>";
        if (details.participants.length > 0) {
          details.participants.forEach(email => {
            participantsHTML += `<li>
              <span class='participant-avatar'>${email[0].toUpperCase()}</span>
              <span class='participant-email'>${email}</span>
              <button class='delete-participant-btn' title='Remove participant' data-activity='${name}' data-email='${email}'>
                <span class='delete-icon'>&#128465;</span>
              </button>
            </li>`;
          });
        } else {
          participantsHTML += "<li class='no-participants'>No participants yet</li>";
        }
        participantsHTML += "</ul>";

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants:</strong>
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities(); // Refresh activities list
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  // Handle participant deletion
  activitiesList.addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-icon") || event.target.classList.contains("delete-participant-btn")) {
      // Find the button element
      const btn = event.target.classList.contains("delete-icon") ? event.target.parentElement : event.target;
      const activity = btn.getAttribute("data-activity");
      const email = btn.getAttribute("data-email");
      if (!activity || !email) return;

      if (!confirm(`Remove ${email} from ${activity}?`)) return;

      try {
        const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
          method: "POST",
        });
        const result = await response.json();
        if (response.ok) {
          fetchActivities(); // Refresh list
        } else {
          alert(result.detail || "Failed to remove participant.");
        }
      } catch (error) {
        alert("Failed to remove participant. Please try again.");
      }
    }
  });
});
