import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';
import type { NatalChart } from '../types';

interface BirthChartVisualizationProps {
  chart: NatalChart;
}

const ZODIAC_SYMBOLS: { [key: string]: string } = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricornus: '♑',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

const PLANET_SYMBOLS: { [key: string]: string } = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
  'North Node': '☊',
  Chiron: '⚷',
};

/** Traditional Western aspect colors */
const ASPECT_COLORS: { [key: string]: string } = {
  Conjunction: '#FFD700',
  Opposition: '#DC143C',
  Trine: '#228B22',
  Square: '#FF4500',
  Sextile: '#1E90FF',
  Quincunx: '#8B008B',
  'Semi-Sextile': '#808080',
};

/** Traditional planetary glyph colors */
const PLANET_COLORS: { [key: string]: string } = {
  Sun: '#FFD700',
  Moon: '#C0C0C0',
  Mercury: '#FF8C00',
  Venus: '#2E8B57',
  Mars: '#DC143C',
  Jupiter: '#4169E1',
  Saturn: '#8B7355',
  Uranus: '#40E0D0',
  Neptune: '#4169E1',
  Pluto: '#8B0000',
  'North Node': '#DAA520',
  Chiron: '#CD853F',
};

/** Zodiac by classical element */
const ELEMENT_COLORS = {
  fire: '#E74C3C',
  earth: '#27AE60',
  air: '#F1C40F',
  water: '#3498DB',
};

const ZODIAC_ELEMENTS = [
  'fire', 'earth', 'air', 'water',
  'fire', 'earth', 'air', 'water',
  'fire', 'earth', 'air', 'water',
] as const;

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
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0);

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

    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    const svg = svgRef.current;

    const createSVGElement = (tag: string, attrs: { [key: string]: string | number }) => {
      const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([key, value]) => {
        elem.setAttribute(key, String(value));
      });
      return elem;
    };

    const degreeToXY = (degree: number, radius: number) => {
      const adjustedDegree = chart.ascendant_degree - degree;
      const radian = (adjustedDegree * Math.PI) / 180;
      return {
        x: center + radius * Math.cos(radian),
        y: center - radius * Math.sin(radian),
      };
    };

    // Soft parchment-dark center
    svg.appendChild(
      createSVGElement('circle', {
        cx: center,
        cy: center,
        r: 270,
        fill: '#121212',
      })
    );

    const outerRadius = 250;
    const zodiacSigns = [
      'Aries', 'Taurus', 'Gemini', 'Cancer',
      'Leo', 'Virgo', 'Libra', 'Scorpio',
      'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ];

    // Colored zodiac band segments by element
    for (let i = 0; i < 12; i++) {
      const startDeg = i * 30;
      const endDeg = (i + 1) * 30;
      const element = ZODIAC_ELEMENTS[i];
      const color = ELEMENT_COLORS[element];

      const outerStart = degreeToXY(startDeg, outerRadius);
      const outerEnd = degreeToXY(endDeg, outerRadius);
      const innerStart = degreeToXY(startDeg, outerRadius - 32);
      const innerEnd = degreeToXY(endDeg, outerRadius - 32);

      const path = createSVGElement('path', {
        d: [
          `M ${outerStart.x} ${outerStart.y}`,
          `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
          `L ${innerEnd.x} ${innerEnd.y}`,
          `A ${outerRadius - 32} ${outerRadius - 32} 0 0 0 ${innerStart.x} ${innerStart.y}`,
          'Z',
        ].join(' '),
        fill: color,
        'fill-opacity': 0.18,
        stroke: color,
        'stroke-width': 1,
        'stroke-opacity': 0.55,
      });
      svg.appendChild(path);
    }

    svg.appendChild(
      createSVGElement('circle', {
        cx: center,
        cy: center,
        r: outerRadius,
        fill: 'none',
        stroke: '#E8E0D0',
        'stroke-width': 2,
      })
    );

    svg.appendChild(
      createSVGElement('circle', {
        cx: center,
        cy: center,
        r: outerRadius - 32,
        fill: 'none',
        stroke: '#E8E0D0',
        'stroke-width': 1.25,
        'stroke-opacity': 0.7,
      })
    );

    for (let i = 0; i < 12; i++) {
      const startDeg = i * 30;
      const element = ZODIAC_ELEMENTS[i];
      const color = ELEMENT_COLORS[element];

      const lineStart = degreeToXY(startDeg, outerRadius - 32);
      const lineEnd = degreeToXY(startDeg, outerRadius);
      svg.appendChild(
        createSVGElement('line', {
          x1: lineStart.x,
          y1: lineStart.y,
          x2: lineEnd.x,
          y2: lineEnd.y,
          stroke: color,
          'stroke-width': 1.5,
        })
      );

      const symbolPos = degreeToXY(startDeg + 15, outerRadius - 16);
      const text = createSVGElement('text', {
        x: symbolPos.x,
        y: symbolPos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: color,
        'font-size': '22',
        'font-family': 'serif',
        'font-weight': '700',
      });
      text.textContent = ZODIAC_SYMBOLS[zodiacSigns[i]] || zodiacSigns[i];
      svg.appendChild(text);
    }

    const houseRadius = 210;
    svg.appendChild(
      createSVGElement('circle', {
        cx: center,
        cy: center,
        r: houseRadius,
        fill: 'none',
        stroke: '#D0C8B8',
        'stroke-width': 1.5,
      })
    );

    chart.house_cusps.forEach((cusp) => {
      const cuspPos = degreeToXY(cusp.degree, houseRadius);
      const isAngular = cusp.house === 1 || cusp.house === 4 || cusp.house === 7 || cusp.house === 10;

      svg.appendChild(
        createSVGElement('line', {
          x1: center,
          y1: center,
          x2: cuspPos.x,
          y2: cuspPos.y,
          stroke: isAngular ? '#E8E0D0' : '#6B6560',
          'stroke-width': isAngular ? 1.75 : 1,
          'stroke-dasharray': isAngular ? 'none' : '3,3',
          'stroke-opacity': isAngular ? 0.85 : 0.55,
        })
      );

      const labelPos = degreeToXY(cusp.degree, houseRadius - 20);
      const houseText = createSVGElement('text', {
        x: labelPos.x,
        y: labelPos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#C8C0B0',
        'font-size': '13',
        'font-weight': '600',
        'font-family': 'serif',
      });
      houseText.textContent = String(cusp.house);
      svg.appendChild(houseText);
    });

    // Ascendant — traditional thick red
    const ascPos = degreeToXY(chart.ascendant_degree, houseRadius + 12);
    svg.appendChild(
      createSVGElement('line', {
        x1: center,
        y1: center,
        x2: ascPos.x,
        y2: ascPos.y,
        stroke: '#DC143C',
        'stroke-width': 3.5,
      })
    );
    const ascText = createSVGElement('text', {
      x: ascPos.x,
      y: ascPos.y,
      'text-anchor': 'middle',
      fill: '#DC143C',
      'font-size': '13',
      'font-weight': '700',
      'font-family': 'serif',
    });
    ascText.textContent = 'ASC';
    svg.appendChild(ascText);

    // Midheaven — traditional deep blue
    const mcPos = degreeToXY(chart.midheaven_degree, houseRadius + 12);
    svg.appendChild(
      createSVGElement('line', {
        x1: center,
        y1: center,
        x2: mcPos.x,
        y2: mcPos.y,
        stroke: '#1E3A8A',
        'stroke-width': 3,
      })
    );
    const mcText = createSVGElement('text', {
      x: mcPos.x,
      y: mcPos.y,
      'text-anchor': 'middle',
      fill: '#60A5FA',
      'font-size': '13',
      'font-weight': '700',
      'font-family': 'serif',
    });
    mcText.textContent = 'MC';
    svg.appendChild(mcText);

    chart.aspects.forEach((aspect) => {
      const p1 = chart.planet_positions.find((p) => p.name === aspect.planet1);
      const p2 = chart.planet_positions.find((p) => p.name === aspect.planet2);

      if (p1 && p2) {
        const pos1 = degreeToXY(p1.degree, 80);
        const pos2 = degreeToXY(p2.degree, 80);

        svg.appendChild(
          createSVGElement('line', {
            x1: pos1.x,
            y1: pos1.y,
            x2: pos2.x,
            y2: pos2.y,
            stroke: ASPECT_COLORS[aspect.type] || '#808080',
            'stroke-width': 1.75,
            opacity: 0.75,
          })
        );
      }
    });

    const planetRadius = 180;
    chart.planet_positions.forEach((planet) => {
      const pos = degreeToXY(planet.degree, planetRadius);
      const color = PLANET_COLORS[planet.name] || '#F5F5F5';

      const planetText = createSVGElement('text', {
        x: pos.x,
        y: pos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: color,
        'font-size': '26',
        'font-weight': '700',
        'font-family': 'serif',
        stroke: '#0A0A0A',
        'stroke-width': '0.8',
      });
      planetText.textContent = PLANET_SYMBOLS[planet.name] || planet.name.slice(0, 2);
      svg.appendChild(planetText);

      const degreePos = degreeToXY(planet.degree, planetRadius - 25);
      const degreeText = createSVGElement('text', {
        x: degreePos.x,
        y: degreePos.y,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        fill: '#A8A090',
        'font-size': '10',
        'font-family': 'serif',
      });
      degreeText.textContent = `${Math.floor(planet.degree_in_sign)}°`;
      svg.appendChild(degreeText);
    });

    svg.appendChild(
      createSVGElement('circle', {
        cx: center,
        cy: center,
        r: 50,
        fill: 'none',
        stroke: '#E8E0D0',
        'stroke-width': 1.5,
        'stroke-opacity': 0.55,
      })
    );
  }, [chart]);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-end gap-4 mb-6">
        <button
          onClick={handleDownload}
          className="btn-core btn-primary btn-inline sm:w-auto"
          title="Download chart as PNG image"
        >
          <Download size={16} />
          <span>Download PNG</span>
        </button>
      </div>

      <div className="relative flex justify-center overflow-x-auto">
        <svg
          ref={svgRef}
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="responsive-svg"
          preserveAspectRatio="xMidYMid meet"
        />
      </div>

      <div className="mt-6 text-center text-xs tracking-[0.1em] text-ink-muted">
        Fire · Earth · Air · Water bands · ASC in crimson · MC in blue
      </div>
    </div>
  );
}
