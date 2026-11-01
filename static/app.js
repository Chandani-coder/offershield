
const form = document.getElementById("analysis-form");
const submitButton = document.getElementById("submit-button");

const resultPanel = document.getElementById("result-panel");
const formStatus = document.getElementById("form-status");


// Show messages below the form
function setStatus(message, isError = false) {
    formStatus.textContent = message;
    formStatus.style.color = isError ? "#9f493e" : "#796f60";
}


// Submit a job posting
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fields = [
        "title",
        "company_profile",
        "description",
        "requirements",
        "benefits"
    ];

    const payload = {};

    fields.forEach((field) => {
        payload[field] = form.elements[field].value.trim();
    });

    const hasContent = Object.values(payload).some(
        value => value.length > 0
    );

    if (!hasContent) {
        setStatus("Please enter at least one job detail.", true);
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Checking...";
    setStatus("Checking the posting. Just a moment...");

    try {
        const response = await fetch("/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Something went wrong.");
        }

        showResult(data);
        setStatus("Done. Here's what the model found.");

        resultPanel.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    } catch (error) {
        setStatus(
            error.message || "Couldn't reach the server. Please try again.",
            true
        );

    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Check this posting <span>→</span>';
    }
});


// Display the actual model result
function showResult(data) {
    const isFraud = data.predicted_label === 1;

    const resultLabel = document.getElementById("result-label");
    const heading = document.getElementById("result-heading");
    const description = document.getElementById("result-description");
    const score = document.getElementById("score-value");
    const fill = document.getElementById("score-fill");
    const disclaimer = document.getElementById("result-disclaimer");

    resultPanel.hidden = false;

    resultLabel.textContent = isFraud
        ? "Potential fraud patterns detected"
        : "No suspicious patterns flagged";

    resultLabel.className = isFraud
        ? "result-label is-fraud"
        : "result-label";

    heading.textContent = isFraud
        ? "Our model noticed some suspicious patterns."
        : "Our model didn't flag this posting.";

    description.textContent = isFraud
        ? "The posting contains patterns that the model has associated with fraudulent job advertisements. It's worth checking the details carefully before applying."
        : "The model didn't identify enough patterns to flag this posting. But this doesn't necessarily mean the job or employer is genuine.";

    const fraudScore = Math.min(
        100,
        Math.max(0, Number(data.fraud_score_percent))
    );

    score.textContent = `${fraudScore.toFixed(2)}%`;
    fill.style.width = `${fraudScore}%`;

    fill.className = isFraud ? "is-fraud" : "";

    disclaimer.textContent = data.disclaimer;
}


// Add table cells safely
function addCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.appendChild(cell);
}


// Format percentages
function formatRate(value) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const number = Number(value);

    return Number.isFinite(number)
        ? `${number.toFixed(1)}%`
        : "—";
}


// Load industry and job-function research
async function loadResearch(endpoint, tableId, statusId, categoryKey) {
    const tableBody = document.getElementById(tableId);
    const status = document.getElementById(statusId);

    try {
        const response = await fetch(endpoint);

        if (!response.ok) {
            throw new Error("Couldn't load these results.");
        }

        const data = await response.json();

        const rows = data.results
            .sort((a, b) => Number(b.postings) - Number(a.postings))
            .slice(0, 10);

        tableBody.replaceChildren();

        rows.forEach((item) => {
            const row = document.createElement("tr");

            addCell(row, item[categoryKey] ?? "Unknown");
            addCell(row, item.postings);
            addCell(row, item.fraudulent);
            addCell(row, item.false_positives);
            addCell(row, item.false_negatives);
            addCell(row, formatRate(item.false_positive_rate));
            addCell(row, formatRate(item.false_negative_rate));

            tableBody.appendChild(row);
        });

        status.textContent =
            `Showing ${rows.length} categories with the most postings.`;

    } catch (error) {
        status.textContent = error.message;
    }
}


// Load both reports when the page opens
loadResearch(
    "/api/research/industry",
    "industry-body",
    "industry-status",
    "industry_grp"
);

loadResearch(
    "/api/research/function",
    "function-body",
    "function-status",
    "function_grp"
);
