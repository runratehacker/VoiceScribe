import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';


// converts into a dict of keys -- {answer_question_number}

export const alterQuestionsData = (questions = []) => {

  const altered = {};

  for (const row of questions) {

    const key = `answer_${row.question_number}`;

    altered[key] = {

      id: row.id,
      paper_id: row.paper_id,
      question_number: row.question_number,
      label: String(row.question_number),
      type: row.type,
      heading: row.heading,
      question: row.question,
      options: row.options,
      marks: row.marks,
      filled: false,
      value: '',

    };
  }

  return altered;

};

export const usePaperQuestions = (formid) => {

  const [formFields, setFormFields] = useState({});

  const getFields = async () => {

    try {

      const response = await axios.get(`${API_BASE_URL}/api/questions/${formid}`);

      const newFields = alterQuestionsData(response.data);

      // if answers are recorded for few questions fetch it from local storage

      const savedData = localStorage.getItem(`formFields_${formid}`);

      if (savedData) {

        try {

          const parsed = JSON.parse(savedData);

          Object.keys(newFields).forEach((key) => {

            if (parsed[key] && newFields[key].type === parsed[key].type) {

              newFields[key].filled = Boolean(parsed[key].filled);
              newFields[key].value = parsed[key].value || '';

            }

          });

        } catch (e) {
          console.error('Error while parsing localStorage data', e);
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

  // fills the answer for the given question number

  const onFieldFilled = (key, value) => {

    setFormFields((prev) => {

      const field = prev[key];

      if (!field) return prev;

      const next = {
        ...prev,
        [key]: { ...field, filled: value.trim().length > 0, value },

      };

      localStorage.setItem(`formFields_${formid}`, JSON.stringify(next));
      return next;

    });
  };

  // resets the answer for the given question number

  const onFieldReset = (key) => {

    setFormFields((prev) => {

      const field = prev[key];

      if (!field) return prev;

      const next = {
        ...prev,
        [key]: { ...field, filled: false, value: '' },
      };

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

