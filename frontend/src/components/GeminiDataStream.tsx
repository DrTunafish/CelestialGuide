import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { AICommentaryResponse } from '../types';

interface GeminiDataStreamProps {
  commentary: AICommentaryResponse | null;
  isLoading: boolean;
}

interface StructuredSection {
  title: string;
  summary: string;
  paragraphs: string[];
}

const SECTION_TRANSLATIONS: Record<string, string> = {
  'Kişisel Kimlik ve Görünüm (ASC ve Yöneticisi)': 'Identity & Appearance (Ascendant)',
  'Hayat Amacı ve Kariyer Yolu (Güneş, MC ve Yöneticileri)': 'Life Purpose & Career Trajectory (Sun & MC)',
  'Duygusal Dünya ve İçsel İhtiyaçlar (Ay Konumu ve Açıları)': 'Emotional Core & Inner Needs (Moon)',
  'İlişkiler ve Uyum Dinamikleri (Venüs, Mars ve 7. Ev)': 'Relationship Dynamics (Venus, Mars, 7th House)',
  'Meydan Okumalar ve Gelişim Alanları (Satürn, Dış Gezegenler ve Kare/Karşıt Açılar)':
    'Challenges & Growth Vectors (Saturn & Outer Planets)',
  'Yaşam Boyu Misyon (Ay Düğümleri ve Misyon)': 'Lifetime Mission (Lunar Nodes)',
};

const HIGHLIGHT_PATTERN =
  '(Yükselen\\s+[\\p{L}0-9]+|Güneş\\s+[\\p{L}0-9]+(?:\\s+\\d+\\.\\s*Ev)?|Ay\\s+[\\p{L}0-9]+(?:\\s+\\d+\\.\\s*Ev)?|Ay\\s+Düğümleri|Kuzey\\s+Düğümü|Güney\\s+Düğümü|ASC|MC|Venüs|Mars|Satürn|Jüpiter|Plüton|Neptün|Uranüs)';

const formatSummary = (content: string) => {
  const cleaned = content.replace(/\s+/g, ' ').trim();
  const sentenceMatch = cleaned.match(/[^.!?]+[.!?]/);
  return sentenceMatch ? sentenceMatch[0].trim() : cleaned.slice(0, 160).trim();
};

const highlightParagraph = (paragraph: string) => {
  const segments = paragraph.split(new RegExp(HIGHLIGHT_PATTERN, 'giu'));
  return segments
    .map((segment, idx) => {
      if (!segment) return null;
      if (idx % 2 === 1) {
        return (
          <span key={`highlight-${idx}`} className="text-violet-soft font-semibold">
            {segment}
          </span>
        );
      }
      return <span key={`segment-${idx}`}>{segment}</span>;
    })
    .filter(Boolean);
};

const useStructuredSections = (commentary: AICommentaryResponse | null): StructuredSection[] =>
  useMemo(() => {
    if (!commentary) return [];

    const sections: StructuredSection[] = [];
    const text = commentary.commentary_text || '';
    const regex = /##\s*\d?\.?\s*([^\n]+)\n([\s\S]*?)(?=##\s*\d?\.|$)/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const rawTitle = match[1].trim();
      const title = SECTION_TRANSLATIONS[rawTitle] || rawTitle;
      const content = match[2].trim();
      if (!content) continue;

      const paragraphs = content
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
        .filter(Boolean);

      sections.push({
        title,
        summary: formatSummary(content),
        paragraphs,
      });
    }

    if (sections.length > 0) {
      return sections;
    }

    // Fallback: use predefined sections array
    return (commentary.sections || []).map((rawTitle, index) => {
      const title = SECTION_TRANSLATIONS[rawTitle] || rawTitle;
      const fallbackParagraphs = commentary.commentary_text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
        .filter(Boolean);
      const content = fallbackParagraphs[index] || fallbackParagraphs[0] || '';
      return {
        title,
        summary: formatSummary(content),
        paragraphs: [content],
      };
    });
  }, [commentary]);

export default function GeminiDataStream({ commentary, isLoading }: GeminiDataStreamProps) {
  const sections = useStructuredSections(commentary);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  useEffect(() => {
    if (commentary) {
      setExpandedSection(0);
    }
  }, [commentary?.commentary_text]);

  if (!commentary && !isLoading) {
    return null;
  }

  return (
    <section className="panel overflow-hidden relative">
      <div className="panel__header">
        <div className="flex items-center gap-4">
          <div className="icon-orb">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold title-sun">Gemini analysis</h3>
            <p className="text-xs tracking-[0.06em] text-ink-muted mt-1">
              Structured six-phase reading from Gemini 2.0 Flash
            </p>
          </div>
        </div>
        <div className="text-xs tracking-[0.06em] text-ink-faint">
          Model: {commentary?.model || 'gemini-2.0-flash-exp'}
        </div>
      </div>

      <div className="panel__body relative">
        {isLoading && (
          <div className="scanning-panel">
            <div className="scanning-panel__beam" />
            <div className="scanning-panel__content">
              <div className="scanning-panel__icon">
                <span className="scan-loader"><span className="scan-loader__beam" /></span>
              </div>
              <div>
                <p className="text-sm tracking-[0.08em] text-ink-muted">
                  Gemini is preparing your chart analysis...
                </p>
                <p className="text-[0.7rem] tracking-[0.06em] text-ink-faint mt-2">
                  Reading planetary positions and house relationships
                </p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && sections.length > 0 && (
          <div className="data-stream">
            {sections.map((section, index) => {
              const isExpanded = expandedSection === index;
              return (
                <article
                  key={section.title}
                  className={`data-block ${isExpanded ? 'data-block--expanded' : ''}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-4 text-left"
                    onClick={() => setExpandedSection(isExpanded ? null : index)}
                  >
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-violet-soft">
                        {section.title}
                      </h4>
                      <p className="data-block__summary">
                        {highlightParagraph(section.summary)}
                      </p>
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-ink-muted transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div className="data-block__content">
                    <div className="space-y-4 text-sm leading-7 text-ink-body">
                      {section.paragraphs.map((paragraph, paragraphIndex) => (
                        <p key={`${section.title}-${paragraphIndex}`} className="text-ink-body">
                          {highlightParagraph(paragraph)}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!isLoading && sections.length === 0 && commentary && (
          <div className="text-sm text-ink-muted">
            Gemini returned commentary, but it could not be structured. Raw output:
            <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-violet/25 bg-night/80 p-4 text-xs text-ink-body">
              {commentary.commentary_text}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

