import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Normalizes the response from /api/questions/:paperid (array of DB rows from Supabase)
 * into the keyed formFields dictionary expected across the voice assistant and UI components.
 */
export const normalizeQuestionsData = (rawData, formid) => {
  if (!rawData) return {};

  // If the backend returned an array of question rows from the Supabase `questions` table
  if (Array.isArray(rawData)) {
    const normalized = {};

    // Filter only valid question rows (rows that have a question or question_number)
    const questionRows = rawData.filter(
      (row) => row && (row.question !== undefined || row.question_number !== undefined)
    );

    // Sort by question_number ascending
    const sortedRows = [...questionRows].sort(
      (a, b) => (Number(a.question_number) || 0) - (Number(b.question_number) || 0)
    );

    sortedRows.forEach((row, index) => {
      const qNum = row.question_number ?? index + 1;
      const key = row.key || `answer_${qNum}`;

      // Safely parse `options` (jsonb column may come as an array or JSON string)
      let parsedOptions = [];
      if (Array.isArray(row.options)) {
        parsedOptions = row.options;
      } else if (typeof row.options === 'string' && row.options.trim().length > 0) {
        try {
          const parsed = JSON.parse(row.options);
          if (Array.isArray(parsed)) parsedOptions = parsed;
        } catch (e) {
          parsedOptions = [];
        }
      }

      // Normalize option items to { label, text }
      parsedOptions = parsedOptions.map((opt, idx) => {
        if (opt && typeof opt === 'object') {
          return {
            label: opt.label || String.fromCharCode(65 + idx),
            text: opt.text ?? opt.value ?? String(opt)
          };
        }
        return {
          label: String.fromCharCode(65 + idx),
          text: String(opt)
        };
      });

      // Extract sub-label if question starts with e.g. "1a. " while keeping question_number
      const rawQuestionText = row.question || '';
      const subLabelMatch = rawQuestionText.match(/^([0-9]+[a-zA-Z]+)\.\s+(.*)$/s);
      const displayLabel = row.label
        ? String(row.label)
        : subLabelMatch
          ? subLabelMatch[1]
          : String(qNum);

      const normalizedType = String(row.type || 'subjective').toLowerCase().trim();

      normalized[key] = {
        id: row.id,
        paper_id: row.paper_id ?? (formid ? Number(formid) : undefined),
        question_number: Number(qNum),
        label: displayLabel,
        type: normalizedType,
        heading: row.heading || '',
        question: rawQuestionText,
        options: parsedOptions,
        marks: row.marks !== undefined && row.marks !== null ? Number(row.marks) : null,
        filled: Boolean(row.filled),
        value: row.value ?? row.student_answer ?? ''
      };
    });

    return normalized;
  }

  // Fallback if backend returned an already-keyed object
  if (typeof rawData === 'object') {
    return { ...rawData };
  }

  return {};
};

const matchesQuestionField = (field, key, targetLabel) => {
  if (!field || !targetLabel) return false;

  const labelLower = String(targetLabel).toLowerCase().trim();
  const fieldLabelLower = String(field.label || '').toLowerCase().trim();
  const keyLower = String(key || '').toLowerCase().trim();
  const qNumStr = field.question_number !== undefined ? String(field.question_number).toLowerCase().trim() : '';

  return (
    fieldLabelLower === labelLower ||
    keyLower === labelLower ||
    qNumStr === labelLower ||
    labelLower === `question ${qNumStr}` ||
    labelLower === `q${qNumStr}` ||
    labelLower === `question ${fieldLabelLower}` ||
    (fieldLabelLower && labelLower.includes(fieldLabelLower)) ||
    (fieldLabelLower && fieldLabelLower.includes(labelLower))
  );
};

export const useFormFields = (formid) => {
  const [formFields, setFormFields] = useState({});

  const getFields = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/questions/${formid}`);
      const newFields = normalizeQuestionsData(response.data, formid);

      // Merge any saved answers from localStorage
      const savedData = localStorage.getItem(`formFields_${formid}`);
      if (savedData) {
        try {
          const parsedSavedData = JSON.parse(savedData);
          Object.keys(newFields).forEach((key) => {
            if (parsedSavedData[key] && newFields[key].type === parsedSavedData[key].type) {
              newFields[key].filled = Boolean(parsedSavedData[key].filled);
              newFields[key].value = parsedSavedData[key].value || '';
            }
          });
        } catch (e) {
          console.error('Error parsing localStorage data', e);
        }
      }

      setFormFields(newFields);
      if (Object.keys(newFields).length > 0) {
        localStorage.setItem(`formFields_${formid}`, JSON.stringify(newFields));
      }
    } catch (error) {
      console.log(error.message);
      return [];
    }
  };

  const onFieldFilled = (label, value, overwrite = false) => {
    setFormFields((prev) => {
      const next = { ...prev };

      for (const key of Object.keys(next)) {
        if (!next[key]?.label && next[key]?.question_number === undefined) continue;

        if (matchesQuestionField(next[key], key, label)) {
          if (next[key].type === 'checkbox') {
            if (String(value).toLowerCase() === 'true') {
              next[key] = { ...next[key], filled: true };
            } else if (String(value).toLowerCase() === 'false') {
              next[key] = { ...next[key], filled: false };
            }
          } else if (
            next[key].type === 'objective' ||
            (next[key].options && next[key].options.length > 0)
          ) {
            let selectedOption = String(value).trim();
            if (next[key].options && Array.isArray(next[key].options)) {
              const match = next[key].options.find(
                (opt) =>
                  opt.label.toLowerCase() === selectedOption.toLowerCase() ||
                  selectedOption.toLowerCase().startsWith(opt.label.toLowerCase() + '.') ||
                  selectedOption.toLowerCase().startsWith(opt.label.toLowerCase() + ')') ||
                  selectedOption.toLowerCase() === `option ${opt.label.toLowerCase()}`
              );
              if (match) {
                selectedOption = match.label;
              }
            }
            next[key] = {
              ...next[key],
              filled: selectedOption.length > 0,
              value: selectedOption
            };
          } else {
            const existingValue = overwrite ? '' : next[key].value || '';
            const appendedValue = existingValue ? `${existingValue} ${value}` : value;
            next[key] = {
              ...next[key],
              filled: appendedValue.trim().length > 0,
              value: appendedValue
            };
          }
          break;
        }
      }

      localStorage.setItem(`formFields_${formid}`, JSON.stringify(next));
      return next;
    });
  };

  const onFieldReset = (label) => {
    setFormFields((prev) => {
      const next = { ...prev };

      for (const key of Object.keys(next)) {
        if (!next[key]?.label && next[key]?.question_number === undefined) continue;

        if (matchesQuestionField(next[key], key, label)) {
          next[key] = { ...next[key], filled: false, value: '' };
          break;
        }
      }

      localStorage.setItem(`formFields_${formid}`, JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    if (formid) {
      getFields();
    }
  }, [formid]);

  return { formFields, onFieldFilled, onFieldReset };
};
