document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const studentId = urlParams.get("studentId");
  // ⬇️ PASTE YOUR GOOGLE SHEET CSV URL HERE (AGAIN) ⬇️
  const googleSheetURL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzFJD8ddsNeP1TKh6nlboo2yp2oMi_CDcc1MegYEM6RvM9VZiEzS73tXhV62btKfiKAonL-FF3YxsC/pub?gid=0&single=true&output=csv";

  // Helper function to convert string numbers from CSV to actual numbers
  function processStudentData(student) {
    student.spoken_english_rating =
      parseInt(student.spoken_english_rating) || 0;
    student.written_communication_rating =
      parseInt(student.written_communication_rating) || 0;
    student.problem_solving_rating =
      parseInt(student.problem_solving_rating) || 0;
    student.attendance_percentage =
      parseFloat(student.attendance_percentage) || 0;
    return student;
  }

  Papa.parse(googleSheetURL, {
    download: true,
    header: true,
    complete: (results) => {
      const students = results.data.map(processStudentData);
      const student = students.find((s) => s.registration_number == studentId);
      if (!student) {
        alert("Student not found.");
        return;
      }
      student.readiness = calculateReadiness(student);
      loadProfile(student);
    },
    error: (err) => console.error("Error loading student data:", err),
  });
});

function calculateReadiness(student) {
  const weights = {
    communication: 15,
    problemSolving: 15,
    technicalSkills: 15,
    attendance: 15,
    resume: 15,
    portfolio: 15,
    proactive: 10,
  };
  const communication =
    ((student.spoken_english_rating + student.written_communication_rating) /
      2) *
    20;
  const problemSolving = student.problem_solving_rating * 20;
  const technicalSkills = student.familiar_tools ? 70 : 40;
  const attendance = student.attendance_percentage;
  const resumeReadiness = student.has_resume.toLowerCase() === "yes" ? 100 : 0;
  const portfolioReadiness =
    student.has_online_portfolio.toLowerCase() === "yes" ? 100 : 0;
  let proactive = 0;
  if (student.has_project.toLowerCase() === "yes") proactive += 50;
  if (student.has_certification.toLowerCase() === "yes") proactive += 50;
  const readiness =
    (communication * weights.communication +
      problemSolving * weights.problemSolving +
      technicalSkills * weights.technicalSkills +
      attendance * weights.attendance +
      resumeReadiness * weights.resume +
      portfolioReadiness * weights.portfolio +
      proactive * weights.proactive) /
    100;
  return Math.round(readiness);
}

function loadProfile(student) {
  document.getElementById("studentName").innerText = student.name;
  const themeColors = {
    primary: "#6366f1",
    accent: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };
  Plotly.newPlot(
    "readinessGauge",
    [
      {
        type: "indicator",
        mode: "gauge+number",
        value: student.readiness,
        gauge: {
          axis: { range: [0, 100], tickwidth: 1, tickcolor: "darkblue" },
          bar: {
            color:
              student.readiness >= 75
                ? themeColors.accent
                : student.readiness >= 50
                ? themeColors.warning
                : themeColors.danger,
          },
          bgcolor: "white",
          borderwidth: 2,
          bordercolor: "#ccc",
          steps: [
            { range: [0, 50], color: "rgba(239, 68, 68, 0.1)" },
            { range: [50, 75], color: "rgba(245, 158, 11, 0.1)" },
            { range: [75, 100], color: "rgba(16, 185, 129, 0.1)" },
          ],
        },
      },
    ],
    {
      width: 300,
      height: 250,
      margin: { t: 0, b: 0, l: 0, r: 0 },
      paper_bgcolor: "rgba(0,0,0,0)",
    }
  );
  const skillValues = [
    ((student.spoken_english_rating + student.written_communication_rating) /
      2) *
      20,
    student.problem_solving_rating * 20,
    student.familiar_tools ? 70 : 40,
    student.attendance_percentage,
    student.has_resume.toLowerCase() === "yes" ? 100 : 0,
    student.has_online_portfolio.toLowerCase() === "yes" ? 100 : 0,
    (student.has_project.toLowerCase() === "yes" ? 50 : 0) +
      (student.has_certification.toLowerCase() === "yes" ? 50 : 0),
  ];
  const skillLabels = [
    "Communication",
    "Problem Solving",
    "Tech Skills",
    "Attendance",
    "Resume",
    "Portfolio",
    "Proactivity",
  ];
  Plotly.newPlot(
    "skillRadar",
    [
      {
        type: "scatterpolar",
        r: skillValues,
        theta: skillLabels,
        fill: "toself",
        fillcolor: "rgba(99, 102, 241, 0.3)",
        line: { color: themeColors.primary },
      },
    ],
    {
      polar: { radialaxis: { visible: true, range: [0, 100] } },
      showlegend: false,
      paper_bgcolor: "rgba(0,0,0,0)",
      width: 300,
      height: 250,
      margin: { t: 40, b: 40, l: 40, r: 40 },
    }
  );
  const badgeDiv = document.getElementById("badges");
  badgeDiv.innerHTML = "<h4>Strengths</h4>";
  skillLabels.forEach((label, i) => {
    if (skillValues[i] >= 75)
      badgeDiv.innerHTML += `<span class='badge'>${label}</span>`;
  });
  badgeDiv.innerHTML += "<h4 style='margin-top: 1rem;'>Improvement Areas</h4>";
  skillLabels.forEach((label, i) => {
    if (skillValues[i] < 50)
      badgeDiv.innerHTML += `<span class='badge weak'>${label}</span>`;
  });
  const progressDiv = document.getElementById("progressDetails");
  progressDiv.innerHTML = "";
  skillValues.forEach((val, i) => {
    progressDiv.innerHTML += `<p>${skillLabels[i]} <span>${Math.round(
      val
    )}%</span></p><div class='progress-container'><div class='progress-bar' style='width:${val}%;'></div></div>`;
  });
  document.getElementById(
    "profileDetails"
  ).innerHTML = `<p><strong>Resume:</strong> ${
    student.has_resume.toLowerCase() === "yes"
      ? `<a href="${student.resume_link}" target="_blank">View Resume <i class="fas fa-external-link-alt"></i></a>`
      : "Not Uploaded"
  }</p><p><strong>Portfolio:</strong> ${
    student.has_online_portfolio.toLowerCase() === "yes"
      ? `<a href="${student.portfolio_link}" target="_blank">View Portfolio <i class="fas fa-external-link-alt"></i></a>`
      : "Not Uploaded"
  }</p>`;
  const suggestionDiv = document.getElementById("personalSuggestions");
  const suggestions = [];
  if (skillValues[0] < 75)
    suggestions.push(
      "Enhance communication skills for better interview performance."
    );
  if (skillValues[1] < 75)
    suggestions.push(
      "Practice coding challenges to boost problem-solving abilities."
    );
  if (skillValues[4] === 0)
    suggestions.push(
      "Create and upload a professional resume. <a href='#'>Use a template</a>."
    );
  if (skillValues[5] === 0)
    suggestions.push("Develop an online portfolio to showcase your work.");
  if (skillValues[6] < 75)
    suggestions.push(
      "Start a personal project or earn a certification to demonstrate proactivity."
    );
  suggestionDiv.innerHTML =
    suggestions.length > 0
      ? `<ul>${suggestions.map((s) => `<li>${s}</li>`).join("")}</ul>`
      : "<p>Great work! Keep up the momentum.</p>";
  if (student.attendance_percentage < 70) {
    document.getElementById(
      "attendanceWarning"
    ).innerHTML = `<p><i class="fas fa-exclamation-triangle"></i> With this attendance level, you are not eligible for placements.</p>`;
  }
  const backBtn = document.createElement("button");
  backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> Back to Leaderboard`;
  backBtn.className = "back-btn";
  backBtn.onclick = () => (window.location.href = "index.html");
  document.getElementById("profileSection").prepend(backBtn);
}
