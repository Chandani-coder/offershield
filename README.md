# OfferShield

**Before you apply, take a closer look.**

[Visit OfferShield](https://offershield-virid.vercel.app/)

<img width="1306" height="709" alt="image" src="https://github.com/user-attachments/assets/c1b62c3a-ef91-42fb-b591-dc1a58b99fee" />
<img width="1291" height="712" alt="image" src="https://github.com/user-attachments/assets/0fc5258d-8617-4000-8e03-c6fe2ba46cc3" />


Paste a job advertisement and see what patterns our model identifies. It might help you decide what deserves a closer look before applying.

OfferShield is an experimental job-posting fraud checker, with a little more focus on understanding where a model gets things wrong.

## Why I built this..

A fraud classifier can give us a prediction, but that prediction alone doesn't tell us much about how reliable the model is.

I wanted to look beyond the overall score and explore another question:

**Does the model make different kinds of mistakes across industries and job functions?**

For this, I built a text classification model and examined its false positives and false negatives across different categories.

The aim is not just to flag job postings. It is also to understand the model's mistakes.

## What can you do with it?

- **Check a job posting:** Add the job title, company profile, description, requirements, and benefits. You don't need to fill in every field.
- **See the model's assessment:** Get the predicted class and the model's score for the fraudulent class.
- **Explore its mistakes:** Look at false positives and false negatives across industries and job functions.

## The data

I used the **Employment Scam Aegean Dataset (EMSCAD)**.

It contains 17,880 historical job postings collected between 2012 and 2014.

| Class | Number of postings |
|---|---:|
| Legitimate | 17,014 |
| Fraudulent | 866 |
| **Total** | **17,880** |

The dataset is imbalanced, with fraudulent postings making up a small part of the data. This is important when evaluating the model, so I didn't rely on accuracy alone.

## How the model works

I used the following approach:

1. Combined the job title, company profile, description, requirements, and benefits into one text input.
2. Used **TF-IDF** to convert the text into numerical features.
3. Trained a **Logistic Regression** classifier with balanced class weights.
4. Evaluated the model using a group-aware, stratified five-fold split.

Repeated or normalized job descriptions were kept within the same group during splitting. This helps reduce the chance of similar postings appearing across training and evaluation partitions.

### Test set results

| Metric | Result |
|---|---:|
| Average Precision (AP) | 88.75% |
| Fraud precision | 81.8% |
| Fraud recall | 85.5% |

These results come from the held-out test set. They describe performance on this historical dataset, not guaranteed performance on current job advertisements.

## Looking beyond the overall score

One part of this project that I wanted to explore was model error across categories.

I generated separate reports for:

- **Industries:** How many false positives and false negatives occurred in each industry?
- **Job functions:** Does the model behave differently across different types of work?

I also included the number of postings in each category because error percentages can be misleading when a category contains very few examples.

## Tech used

- Python
- Pandas and NumPy
- Scikit-learn
- TF-IDF and Logistic Regression
- FastAPI
- HTML, CSS and JavaScript
- Vercel

## Run it locally

Clone the repository:

```bash
git clone https://github.com/Chandani-coder/offershield.git
cd offershield
```

Create and activate a virtual environment:

```bash
python -m venv .venv
```

On Windows:

```bash
.venv\Scripts\activate
```

On macOS or Linux:

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the application:

```bash
uvicorn backend.app:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

The API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

**OfferShield is a work in progress.**

The interesting part isn't only whether a model can make a prediction. It's also understanding when that prediction can be wrong.
