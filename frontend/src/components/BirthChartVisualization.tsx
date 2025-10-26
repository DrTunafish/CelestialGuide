import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import type { NatalChart } from '../types';

interface BirthChartVisualizationProps {
  chart: NatalChart;
}

// Zodiac symbols
const ZODIAC_SYMBOLS: { [key: string]: string } = {
  'Aries': '♈',
  'Taurus': '♉',
  'Gemini': '♊',
  'Cancer': '♋',
  'Leo': '♌',
  'Virgo': '♍',
  'Libra': '♎',
  'Scorpio': '♏',
  'Sagittarius': '♐',
  'Capricornus': '♑',
  'Capricorn': '♑',
  'Aquarius': '♒',
  'Pisces': '♓',
};

// Planet symbols
const PLANET_SYMBOLS: { [key: string]: string } = {
  'Sun': '☉',
  'Moon': '☽',
  'Mercury': '☿',
  'Venus': '♀',
  'Mars': '♂',
  'Jupiter': '♃',
  'Saturn': '♄',
  'Uranus': '♅',
  'Neptune': '♆',
  'Pluto': '♇',
  'North Node': '☊',
  'Chiron': '⚷',
};

// Aspect colors - Updated with cosmic theme
const ASPECT_COLORS: { [key: string]: string } = {
  'Conjunction': '#FFD700', // Gold
  'Opposition': '#FF6B6B', // Cosmic Red
  'Trine': '#4ECDC4', // Cosmic Teal
  'Square': '#FF8E53', // Cosmic Orange
  'Sextile': '#00C4FF', // Neon Blue
  'Quincunx': '#A855F7', // Nebula Purple
  'Semi-Sextile': '#94A3B8', // Space Gray
};

export default function BirthChartVisualization({ chart }: BirthChartVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const size = 600;
  const center = size / 2;

  const handleDownload = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Fill with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
      
      // Draw SVG
      ctx.drawImage(img, 0, 0);
      
      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const pngUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        const birthDate = chart.birth_info.datetime.split('T')[0];
        downloadLink.download = `birth-chart-${birthDate}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
        
        URL.revokeObjectURL(pngUrl);
        URL.revokeObjectURL(url);
      });
    };

    img.src = url;
  };

  useEffect(() => {
    if (!svgRef.current || !chart) return;

    // Clear previous content
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    const svg = svgRef.current;

    // Helper function to create SVG element
    const createSVGElement = (tag: string, attrs: { [key: string]: any }) => {
      const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => {
        elem.setAttribute(key, String(value));
      });
      return elem;
    };

    // Helper to convert degree to position
    const degreeToXY = (degree: number, radius: number) => {
      // Adjust: 0° = 9 o'clock position (Ascendant), increase counter-clockwise
      const adjustedDegree = chart.ascendant_degree - degree;
      const radian = (adjustedDegree * Math.PI) / 180;
      return {
        x: center + radius * Math.cos(radian),
        y: center - radius * Math.sin(radian),
      };
    };

    // 1. Draw outer zodiac circle with cosmic glow
    const outerRadius = 250;
    const zodiacCircle = createSVGElement('circle', {
      cx: center,
      cy: center,
      r: outerRadius,
      fill: 'none',
      stroke: '#00C4FF',
      'stroke-width': 3,
      'stroke-opacity': 0.8,
    });
    svg.appendChild(zodiacCircle);
    
    // Add inner glow circle
    const innerGlowCircle = createSVGElement('circle', {
      cx: center,
      cy: center,
      r: outerRadius - 2,
      fill: 'none',
      stroke: '#00C4FF',
      'stroke-width': 1,
      'stroke-opacity': 0.3,
    });
    svg.appendChild(innerGlowCircle);

    // 2. Draw zodiac signs (12 divisions)
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer',
      'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
    ];

    for (let i = 0; i < 12; i++) {
      const startDeg = i * 30;
      const endDeg = (i + 1) * 30;

      // Draw division line with cosmic styling
      const lineStart = degreeToXY(startDeg, outerRadius - 30);
      const lineEnd = degreeToXY(startDeg, outerRadius);
      const line = createSVGElement('line', {
        x1: lineStart.x,
        y1: lineStart.y,
        x2: lineEnd.x,
        y2: lineEnd.y,
        stroke: '#A855F7',
        'stroke-width': 1.5,
        'stroke-opacity': 0.6,
      });
      svg.appendChild(line);

      // Draw zodiac symbol with stellar styling
      const symbolDeg = startDeg + 15;
      const symbolPos = degreeToXY(symbolDeg, outerRadius - 15);
      const text = createSVGElement('text', {
        x: symbolPos.x,
        y: symbolPos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#FFD700',
        'font-size': '24',
        'font-family': 'serif',
        'font-weight': 'bold',
      });
      text.textContent = ZODIAC_SYMBOLS[zodiacSigns[i]] || zodiacSigns[i];
      svg.appendChild(text);
    }

    // 3. Draw house circle and divisions with cosmic styling
    const houseRadius = 210;
    const houseCircle = createSVGElement('circle', {
      cx: center,
      cy: center,
      r: houseRadius,
      fill: 'none',
      stroke: '#4ECDC4',
      'stroke-width': 2,
      'stroke-opacity': 0.7,
    });
    svg.appendChild(houseCircle);

    // Draw house cusps
    chart.house_cusps.forEach((cusp) => {
      const cuspPos = degreeToXY(cusp.degree, houseRadius);
      const centerPos = { x: center, y: center };

      const line = createSVGElement('line', {
        x1: centerPos.x,
        y1: centerPos.y,
        x2: cuspPos.x,
        y2: cuspPos.y,
        stroke: '#00C4FF',
        'stroke-width': 1.5,
        'stroke-dasharray': '4,4',
        'stroke-opacity': 0.6,
      });
      svg.appendChild(line);

      // House number with cosmic styling
      const labelPos = degreeToXY(cusp.degree, houseRadius - 20);
      const houseText = createSVGElement('text', {
        x: labelPos.x,
        y: labelPos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#FFD700',
        'font-size': '16',
        'font-weight': 'bold',
        'font-family': 'Orbitron, monospace',
      });
      houseText.textContent = String(cusp.house);
      svg.appendChild(houseText);
    });

    // 4. Mark Ascendant with cosmic glow
    const ascPos = degreeToXY(chart.ascendant_degree, houseRadius + 10);
    const ascLine = createSVGElement('line', {
      x1: center,
      y1: center,
      x2: ascPos.x,
      y2: ascPos.y,
      stroke: '#FFD700',
      'stroke-width': 4,
      'stroke-opacity': 0.9,
    });
    svg.appendChild(ascLine);

    const ascText = createSVGElement('text', {
      x: ascPos.x,
      y: ascPos.y,
      'text-anchor': 'middle',
      fill: '#FFD700',
      'font-size': '16',
      'font-weight': 'bold',
    });
    ascText.textContent = 'ASC';
    svg.appendChild(ascText);

    // 5. Mark MC
    const mcPos = degreeToXY(chart.midheaven_degree, houseRadius + 10);
    const mcLine = createSVGElement('line', {
      x1: center,
      y1: center,
      x2: mcPos.x,
      y2: mcPos.y,
      stroke: '#4488FF',
      'stroke-width': 3,
    });
    svg.appendChild(mcLine);

    const mcText = createSVGElement('text', {
      x: mcPos.x,
      y: mcPos.y,
      'text-anchor': 'middle',
      fill: '#00C4FF',
      'font-size': '16',
      'font-weight': 'bold',
      'font-family': 'Orbitron, monospace',
    });
    mcText.textContent = 'MC';
    svg.appendChild(mcText);

    // 6. Draw aspect lines (in center)
    chart.aspects.forEach((aspect) => {
      const p1 = chart.planet_positions.find((p) => p.name === aspect.planet1);
      const p2 = chart.planet_positions.find((p) => p.name === aspect.planet2);

      if (p1 && p2) {
        const pos1 = degreeToXY(p1.degree, 80);
        const pos2 = degreeToXY(p2.degree, 80);

        const line = createSVGElement('line', {
          x1: pos1.x,
          y1: pos1.y,
          x2: pos2.x,
          y2: pos2.y,
          stroke: ASPECT_COLORS[aspect.type] || '#94A3B8',
          'stroke-width': 2,
          opacity: 0.8,
        });
        svg.appendChild(line);
      }
    });

    // 7. Draw planets
    const planetRadius = 180;
    chart.planet_positions.forEach((planet) => {
      const pos = degreeToXY(planet.degree, planetRadius);

      // Planet symbol with cosmic glow
      const planetText = createSVGElement('text', {
        x: pos.x,
        y: pos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#FFD700',
        'font-size': '28',
        'font-weight': 'bold',
        'font-family': 'serif',
        'stroke': '#000000',
        'stroke-width': '0.5',
      });
      planetText.textContent = PLANET_SYMBOLS[planet.name] || planet.name.slice(0, 2);
      svg.appendChild(planetText);

      // Degree label
      const degreePos = degreeToXY(planet.degree, planetRadius - 25);
      const degreeText = createSVGElement('text', {
        x: degreePos.x,
        y: degreePos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#AAA',
        'font-size': '10',
      });
      degreeText.textContent = `${Math.floor(planet.degree_in_sign)}°`;
      svg.appendChild(degreeText);
    });

    // 8. Draw inner circle with cosmic styling
    const innerCircle = createSVGElement('circle', {
      cx: center,
      cy: center,
      r: 50,
      fill: 'none',
      stroke: '#A855F7',
      'stroke-width': 2,
      'stroke-opacity': 0.5,
    });
    svg.appendChild(innerCircle);

  }, [chart]);

  return (
    <div className="card-glow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-orbitron font-semibold text-cosmic-400">
          ✨ Birth Chart Wheel
        </h3>
        <button
          onClick={handleDownload}
          className="btn-gold flex items-center space-x-2 text-sm"
          title="Download chart as PNG image"
        >
          <Download size={18} />
          <span>Download</span>
        </button>
      </div>
      <div className="flex justify-center">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="bg-gradient-to-br from-cosmic-950 to-space-950 rounded-xl border-2 border-cosmic-500/30"
        />
      </div>
      <div className="mt-6 text-center">
        <div className="star-separator">
          <span className="text-stellar-400 font-orbitron">✦</span>
        </div>
        <p className="text-cosmic-300 text-sm">
          Ascendant (ASC) marked in gold at 9 o'clock position
        </p>
        <p className="text-nebula-300 text-xs mt-2 font-orbitron">
          House System: {chart.house_system}
        </p>
      </div>
    </div>
  );
}

