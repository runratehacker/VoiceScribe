import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Component used to render maths elements on the frontend

/**
 * LatexRenderer — Renders text containing LaTeX math.
 *
 * Supports:
 *   $$...$$ → display (block) math
 *   $...$   → inline math
 *   Bare LaTeX commands (e.g. \frac{}{}, \sqrt{}) → auto-detected and rendered
 *
 * Non-math text is rendered as plain text spans.
 * Falls back to raw text if KaTeX fails to parse a segment.
 */

/**
 * Preprocesses text to auto-wrap bare LaTeX commands in $...$ delimiters.
 * Handles cases where Gemini outputs LaTeX commands without $ wrapping.
 *
 * Detects patterns like: \frac{a}{b}, \sqrt{x}, \alpha, x^{2}, etc.
 */
const wrapBareLatex = (text) => {
  if (!text) return text;

  // If text already has $ delimiters, it's already formatted — skip preprocessing
  if (text.includes('$')) return text;

  // Quick check: does the text contain any LaTeX-like patterns?
  if (!/\\[a-zA-Z]/.test(text)) return text;

  // Match LaTeX command sequences: \command{arg1}{arg2}^{sup}_{sub}
  // Supports up to 2 levels of nested braces for complex expressions
  // e.g. \frac{(4a-5)(4a+5)}{4a^2}  or  \sqrt{x^{2}+1}
  const BARE_LATEX_RE = /(\\[a-zA-Z]+(?:\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*(?:[_^](?:\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}|[a-zA-Z0-9]))*)/g;

  return text.replace(BARE_LATEX_RE, (match) => {
    const trimmed = match.trim();
    if (!trimmed) return match;
    return `$${trimmed}$`;
  });
};

const LatexRenderer = ({ text, className = '' }) => {
  const rendered = useMemo(() => {
    if (!text) return null;

    // Step 1: Preprocess — auto-wrap bare LaTeX commands in $...$
    const preprocessed = wrapBareLatex(text);

    // Step 2: Split on display math ($$...$$) first, then inline math ($...$)
    // Regex explanation:
    //   (\$\$[\s\S]+?\$\$)  — match display math (non-greedy, multiline)
    //   (\$(?!\$)(?:[^$\\]|\\.)+?\$) — match inline math (not starting with $$)
    const parts = preprocessed.split(/(\$\$[\s\S]+?\$\$|\$(?!\$)(?:[^$\\]|\\.)+?\$)/g);

    return parts.map((part, index) => {
      if (!part) return null;

      // Display math: $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2).trim();
        try {
          const html = katex.renderToString(latex, {
            displayMode: true,
            throwOnError: false,
            strict: false,
          });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="latex-display"
            />
          );
        } catch {
          // Fallback: show raw text if KaTeX can't parse it
          return <span key={index}>{part}</span>;
        }
      }

      // Inline math: $...$
      if (part.startsWith('$') && part.endsWith('$') && part.length > 1) {
        const latex = part.slice(1, -1).trim();
        try {
          const html = katex.renderToString(latex, {
            displayMode: false,
            throwOnError: false,
            strict: false,
          });
          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className="latex-inline"
            />
          );
        } catch {
          return <span key={index}>{part}</span>;
        }
      }

      // Plain text — preserve whitespace
      return <span key={index}>{part}</span>;
    });
  }, [text]);

  return <span className={className}>{rendered}</span>;
};

export default LatexRenderer;
