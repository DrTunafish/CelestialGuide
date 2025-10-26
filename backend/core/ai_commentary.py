"""
AI-Powered Astrology Commentary Service
Uses Google Gemini 2.5 Flash for deep astrological interpretations
"""
import os
from typing import Dict
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# System instruction for Gemini
SYSTEM_INSTRUCTION = """[SYSTEM INSTRUCTION]
Sen, 500 yıllık geleneksel ve modern astrolojik bilgiyi kusursuzca sentezleyen, derin bir bilge ve yol gösterici rolündesin. Yanıtın, her zaman **empatik, yapıcı ve profesyonel** bir tonda olmalıdır. Yorumunu oluştururken sadece temel gezegen/burç/ev konumlarını değil, aynı zamanda haritanın **tümünü bir hikaye gibi** okuyarak karmaşık açı kombinasyonlarını bağlamsal olarak analiz et. Yanıt, sadece Markdown formatında, tam 6 ana başlık altında yapılandırılmalıdır. Her başlık altında detaylı ve özgün bir paragraf olmalıdır. Asla bir tabloda basitçe listeleme yapma.

Kullanılacak 6 Başlık (Bu sırayla ve bu isimlerle):
1. Kişisel Kimlik ve Görünüm (ASC ve Yöneticisi)
2. Hayat Amacı ve Kariyer Yolu (Güneş, MC ve Yöneticileri)
3. Duygusal Dünya ve İçsel İhtiyaçlar (Ay Konumu ve Açıları)
4. İlişkiler ve Uyum Dinamikleri (Venüs, Mars ve 7. Ev)
5. Meydan Okumalar ve Gelişim Alanları (Satürn, Dış Gezegenler ve Kare/Karşıt Açılar)
6. Yaşam Boyu Misyon (Ay Düğümleri ve Misyon)

Her bölümde:
- Sadece o bölümle ilgili gezegen/ev/açı kombinasyonlarını kullan
- Minimum 150 kelime, maksimum 250 kelime yaz
- Somut yaşam örnekleri ver
- Kişinin güçlü yönlerini ve gelişim fırsatlarını dengeli bir şekilde ele al
- Türkçe dilbilgisi kurallarına titizlikle uy

[/SYSTEM INSTRUCTION]"""


def format_chart_data_for_prompt(chart_data: Dict) -> str:
    """
    Format natal chart data into a structured prompt for Gemini
    
    Args:
        chart_data: Complete natal chart data from calculate_natal_chart
    
    Returns:
        Formatted string prompt
    """
    prompt_parts = []
    
    # Birth info
    birth_info = chart_data.get("birth_info", {})
    prompt_parts.append(f"**Doğum Bilgileri:**")
    prompt_parts.append(f"- Tarih: {birth_info.get('datetime', 'N/A')}")
    prompt_parts.append(f"- Konum: Lat {birth_info.get('latitude', 'N/A')}, Lon {birth_info.get('longitude', 'N/A')}")
    prompt_parts.append(f"- Zaman Dilimi: {birth_info.get('timezone', 'N/A')}")
    prompt_parts.append("")
    
    # Ascendant and MC
    prompt_parts.append(f"**Yükselen Burç (Ascendant):** {chart_data.get('ascendant_formatted', 'N/A')}")
    prompt_parts.append(f"**Gökyüzü Ortası (MC):** {chart_data.get('midheaven_formatted', 'N/A')}")
    prompt_parts.append(f"**Ev Sistemi:** {chart_data.get('house_system', 'Placidus')}")
    prompt_parts.append("")
    
    # Planets
    prompt_parts.append("**Gezegen Pozisyonları:**")
    for planet in chart_data.get("planet_positions", []):
        prompt_parts.append(
            f"- {planet['name']}: {planet['formatted']} (Ev {planet['house']})"
        )
    prompt_parts.append("")
    
    # Aspects
    aspects = chart_data.get("aspects", [])
    if aspects:
        prompt_parts.append("**Önemli Açılar (Aspects):**")
        for aspect in aspects[:15]:  # Limit to top 15 aspects
            prompt_parts.append(
                f"- {aspect['planet1']} {aspect['type']} {aspect['planet2']} (Orb: {aspect['orb']}°)"
            )
        prompt_parts.append("")
    
    # Houses
    prompt_parts.append("**Ev Başlangıç Noktaları:**")
    for house in chart_data.get("house_cusps", [])[:6]:  # First 6 houses as reference
        prompt_parts.append(
            f"- {house['house']}. Ev: {int(house['degree_in_sign'])}° {house['sign']}"
        )
    prompt_parts.append("")
    
    return "\n".join(prompt_parts)


def generate_astrology_commentary(chart_data: Dict) -> str:
    """
    Generate deep astrological commentary using Gemini 2.5 Flash
    
    Args:
        chart_data: Complete natal chart data dictionary
    
    Returns:
        Markdown formatted commentary text
    
    Raises:
        ValueError: If API key is not configured
        Exception: For API errors
    """
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY not found in environment variables. "
            "Please add your API key to the .env file."
        )
    
    try:
        # Format chart data into prompt
        chart_prompt = format_chart_data_for_prompt(chart_data)
        
        # Full prompt
        full_prompt = f"""{SYSTEM_INSTRUCTION}

---

{chart_prompt}

---

Yukarıdaki doğum haritası verilerini kullanarak, 6 başlık altında derin ve kapsamlı bir astrolojik yorum oluştur. Her başlıkta ilgili gezegen/ev/açı kombinasyonlarını bağlamsal olarak analiz et ve kişiye özgü, yapıcı içgörüler sun.
"""
        
        # Initialize model
        model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config={
                "temperature": 0.8,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 4096,
            }
        )
        
        # Generate content
        print("[AI COMMENTARY] Generating commentary with Gemini...")
        response = model.generate_content(full_prompt)
        
        if not response or not response.text:
            raise Exception("Empty response from Gemini API")
        
        print(f"[AI COMMENTARY] Generated {len(response.text)} characters")
        return response.text
        
    except Exception as e:
        print(f"[AI COMMENTARY ERROR] {type(e).__name__}: {e}")
        raise Exception(f"Failed to generate commentary: {str(e)}")

