"""
PDF Export API
Generate and download observation plan PDFs
"""
from fastapi import APIRouter, Response
from pydantic import BaseModel, Field
from typing import List, Optional, Dict

from core.pdf_generator import create_observation_plan_pdf


router = APIRouter()


class PDFExportRequest(BaseModel):
    """PDF export request"""
    location_data: Dict
    weather_data: Dict
    light_pollution_data: Dict
    target_stars: List[Dict]
    star_map_base64: Optional[str] = None
    observation_notes: Optional[str] = Field(None, description="User observation notes")
    title: str = Field("CelestialGuide Pro - Observation Plan", description="PDF title")


@router.post("/generate")
async def generate_observation_pdf(request: PDFExportRequest):
    """
    Generate observation plan PDF
    
    Returns PDF file as downloadable attachment
    """
    pdf_bytes = create_observation_plan_pdf(
        location_data=request.location_data,
        weather_data=request.weather_data,
        light_pollution_data=request.light_pollution_data,
        target_stars=request.target_stars,
        star_map_base64=request.star_map_base64,
        observation_notes=request.observation_notes,
        title=request.title
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=observation_plan.pdf"
        }
    )

