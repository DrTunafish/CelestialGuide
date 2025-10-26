"""
PDF Export Module
Generate observation plan PDFs using ReportLab
"""
from datetime import datetime
from typing import List, Dict, Optional
import io
import base64

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


class ObservationPlanPDF:
    """Generate observation plan PDFs"""
    
    def __init__(self, title: str = "CelestialGuide Pro - Observation Plan"):
        self.title = title
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a5490'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=12,
            spaceBefore=12
        ))
    
    def generate(
        self,
        location_data: Dict,
        weather_data: Dict,
        light_pollution_data: Dict,
        target_stars: List[Dict],
        star_map_base64: Optional[str] = None,
        observation_notes: Optional[str] = None
    ) -> bytes:
        """
        Generate complete observation plan PDF
        
        Args:
            location_data: Location information
            weather_data: Weather conditions
            light_pollution_data: Light pollution info
            target_stars: List of target stars with positions
            star_map_base64: Base64 encoded star map image
            observation_notes: Optional user notes
            
        Returns:
            PDF as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        
        # Title
        title = Paragraph(self.title, self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 0.3*inch))
        
        # Date and time
        now = datetime.utcnow()
        date_text = f"Generated: {now.strftime('%Y-%m-%d %H:%M UTC')}"
        story.append(Paragraph(date_text, self.styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        # Location Section
        story.append(Paragraph("Location Information", self.styles['SectionHeader']))
        location_table_data = [
            ['Location:', location_data.get('formatted_address', 'N/A')],
            ['Coordinates:', f"{location_data.get('latitude', 0):.4f}°, {location_data.get('longitude', 0):.4f}°"],
            ['Elevation:', f"{location_data.get('elevation', 0):.0f} m"]
        ]
        location_table = Table(location_table_data, colWidths=[2*inch, 4*inch])
        location_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        story.append(location_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Environmental Conditions
        story.append(Paragraph("Observing Conditions", self.styles['SectionHeader']))
        
        conditions_data = [
            ['Temperature:', f"{weather_data.get('temperature_c', 0):.1f}°C"],
            ['Humidity:', f"{weather_data.get('humidity', 0)}%"],
            ['Cloud Cover:', f"{weather_data.get('cloud_cover', 0)}% - {weather_data.get('conditions', 'N/A')}"],
            ['Bortle Scale:', f"{light_pollution_data.get('bortle_scale', 0):.1f} - {light_pollution_data.get('description', 'N/A')}"],
            ['Sky Brightness:', f"{light_pollution_data.get('brightness', 0):.1f} mag/arcsec²"]
        ]
        
        conditions_table = Table(conditions_data, colWidths=[2*inch, 4*inch])
        conditions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        story.append(conditions_table)
        story.append(Spacer(1, 0.3*inch))
        
        # Target Stars
        if target_stars:
            story.append(Paragraph("Target Objects", self.styles['SectionHeader']))
            
            stars_data = [['Name', 'HIP ID', 'Alt (°)', 'Az (°)', 'Mag', 'Visible']]
            
            for star in target_stars:
                stars_data.append([
                    star.get('name', 'N/A'),
                    str(star.get('hip_id', 'N/A')),
                    f"{star.get('altitude', 0):.1f}",
                    f"{star.get('azimuth', 0):.1f}",
                    f"{star.get('magnitude', 0):.2f}",
                    '✓' if star.get('is_visible', False) else '✗'
                ])
            
            stars_table = Table(stars_data, colWidths=[1.5*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch])
            stars_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
            ]))
            story.append(stars_table)
            story.append(Spacer(1, 0.3*inch))
        
        # Star Map
        if star_map_base64:
            story.append(PageBreak())
            story.append(Paragraph("Sky Map", self.styles['SectionHeader']))
            story.append(Spacer(1, 0.2*inch))
            
            try:
                # Decode base64 image
                image_data = base64.b64decode(star_map_base64)
                image_buffer = io.BytesIO(image_data)
                
                # Add image to PDF
                img = Image(image_buffer, width=6*inch, height=6*inch)
                story.append(img)
            except Exception as e:
                story.append(Paragraph(f"Error loading star map: {str(e)}", self.styles['Normal']))
        
        # Observation Notes
        if observation_notes:
            story.append(Spacer(1, 0.3*inch))
            story.append(Paragraph("Observation Notes", self.styles['SectionHeader']))
            story.append(Paragraph(observation_notes, self.styles['Normal']))
        
        # Footer
        story.append(Spacer(1, 0.5*inch))
        footer_style = ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        story.append(Paragraph("Generated by CelestialGuide Pro", footer_style))
        
        # Build PDF
        doc.build(story)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes


def create_observation_plan_pdf(
    location_data: Dict,
    weather_data: Dict,
    light_pollution_data: Dict,
    target_stars: List[Dict],
    star_map_base64: Optional[str] = None,
    observation_notes: Optional[str] = None,
    title: str = "CelestialGuide Pro - Observation Plan"
) -> bytes:
    """
    Helper function to create observation plan PDF
    
    Returns:
        PDF as bytes
    """
    generator = ObservationPlanPDF(title=title)
    return generator.generate(
        location_data=location_data,
        weather_data=weather_data,
        light_pollution_data=light_pollution_data,
        target_stars=target_stars,
        star_map_base64=star_map_base64,
        observation_notes=observation_notes
    )

