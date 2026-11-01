from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from pathlib import Path
from contextlib import asynccontextmanager
import joblib
import pandas as pd 
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

project_root = Path(__file__).resolve().parent.parent
model_path = project_root / "models" / "offershield_pipeline.joblib"

industry_report_path = (project_root / "data" / "processed" / "industry_error_report.csv")

function_report_path = ( project_root / "data" / "processed" / "function_error_report.csv")

def load_report(path: Path):
    if not path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Research report not found."
        )
    report= pd.read_csv(path)
    report = report.astype(object).where(pd.notna(report),None)
    return report.to_dict(orient="records")


async def lifespan(app: FastAPI):
    if not model_path.is_file():
        raise RuntimeError(f"Model not found:{model_path}")

    app.state.model = joblib.load(model_path)
    print("OfferShield model loaded successfully.")
    
    yield
    
    del app.state.model


app=FastAPI(title="OfferShield",
description= "An experimental job-posting fraud assessment API",
version="1.0.0",
lifespan=lifespan)

app.mount(
    "/static",
    StaticFiles(directory=project_root/"static"),
    name="static"
)


class JobPosting(BaseModel):
    title: str= ""
    company_profile:str = ""
    description: str = ""
    requirements: str = ""
    benefits: str = ""

@app.get("/health")
def health_check(request:Request):
    return{
        "status": "ok",
        "service": "OfferShield",
        "model_loaded": hasattr(request.app.state, "model")
    }

@app.get("/api/research/industry")
def get_industry_report():
    return {
        "category": "industry",
        "results":load_report(industry_report_path)
    }


@app.get("/api/research/function")
def get_function_report():
    return {
        "category": "function",
        "results": load_report(function_report_path)
    }


@app.post("/predict")
def predict_posting(posting: JobPosting, request: Request):

    fields=[
        posting.title,
        posting.company_profile,
        posting.description,
        posting.requirements,
        posting.benefits
    ]

    combined_text= " ".join(field.strip() for field in fields).strip()
    if not combined_text:
        raise HTTPException(status_code=400,
        detail="Please provide at least one job-posting field.")

    model= request.app.state.model

    predicted_label = int(model.predict([combined_text])[0])

    probabilities = model.predict_proba([combined_text])[0]

    fraud_index = list(model.classes_).index(1)

    fraud_score = float(probabilities[fraud_index])

    assessment = (
        "Potentially fraudulent"
        if predicted_label ==1 
        else "Not flagged as fraudulent"
    )

    return {
        "prediction": assessment,
        "predicted_label": predicted_label,
        "fraud_score": round(fraud_score,4),
        "fraud_score_percent": round(fraud_score*100, 2),
        "disclaimer":(
            "Experimental assessment are based on historical job-posting data."
            " So, This result does not verify an employer  or prove fraud."
        )
    }

@app.get("/",include_in_schema= False)
def home():
    return FileResponse(project_root / "static" / "index.html")
