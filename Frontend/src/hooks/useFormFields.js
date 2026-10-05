import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export const useFormFields = (formid) => {
  // intilized formFields as an empty object
  const [formFields, setFormFields] = useState({});
  // Form fields obtained from the backend is stored in this 
  // state variable

  // Getting response from the Backend 

  const getFields = async () => {
    try {      
      // Always fetch from backend to get the latest schema
      const response = await axios.get(`${API_BASE_URL}/api/fields/${formid}`);
      let newFields = response.data;

      // Check if we have saved data in localStorage to merge answers
      const savedData = localStorage.getItem(`formFields_${formid}`);
      if (savedData) {
        try {
          const parsedSavedData = JSON.parse(savedData);
          Object.keys(newFields).forEach(key => {
            if (parsedSavedData[key] && newFields[key].type === parsedSavedData[key].type) {
              newFields[key].filled = parsedSavedData[key].filled;
              newFields[key].value = parsedSavedData[key].value;
            }
          });
          console.log("Merged form fields with localStorage data");
        } catch (e) {
          console.error("Error parsing localStorage data", e);
        }
      }

      console.log(newFields);
      setFormFields(newFields);
      localStorage.setItem(`formFields_${formid}`, JSON.stringify(newFields));

    } catch (error) {
      // if there is an error
      console.log(error.message);
      return [];
    }
  };


  // Function to update formFields

  // label - Student's Name // value - Yogesh
  // filled - true // and sets value to Yogesh
  const onFieldFilled = (label, value, overwrite = false) => {
    // take the previous filled details upadted in 
    // formFields (state variable) and pass it on 
    setFormFields((prev) => {
      // make a copy of prev (formFields)
      const next = { ...prev };

      // goes through each key and checks if the label matches
      // Supports: exact label match, key match (e.g. "answer_1"), or fuzzy match
      for (const key of Object.keys(next)) {
        if (!next[key]?.label) continue;
        
        const fieldLabel = next[key].label;
        const labelLower = label?.toLowerCase().trim() || "";
        const fieldLabelLower = fieldLabel.toLowerCase().trim();
        const keyLower = key.toLowerCase().trim();

        const isMatch = 
          fieldLabelLower === labelLower ||              // exact label match
          keyLower === labelLower ||                     // key match (e.g. "answer_1")
          labelLower.includes(fieldLabelLower) ||        // Gemini sent "[key] label" 
          fieldLabelLower.includes(labelLower);          // partial match

        if (isMatch) {
          // if the label matches
          // ...next[key] // keep the previous values 

          // Logic for checkbox --- Gemini sends true or false 
          // based on that but a checkmark if filled : true
          if (next[key].type === 'checkbox') {
            if (String(value).toLowerCase() === 'true') {
              next[key] = { ...next[key], filled: true };
            }
            else if (String(value).toLowerCase() === 'false') {
              next[key] = { ...next[key], filled: false };
            }
          }
          else if (next[key].type === 'objective' || (next[key].options && next[key].options.length > 0)) {
            // Single option maximum for MCQ: always overwrite and extract single option
            let selectedOption = String(value).trim();
            if (next[key].options && Array.isArray(next[key].options)) {
              const match = next[key].options.find(opt => 
                opt.label.toLowerCase() === selectedOption.toLowerCase() ||
                selectedOption.toLowerCase().startsWith(opt.label.toLowerCase() + '.') ||
                selectedOption.toLowerCase().startsWith(opt.label.toLowerCase() + ')') ||
                selectedOption.toLowerCase() === `option ${opt.label.toLowerCase()}`
              );
              if (match) {
                selectedOption = match.label;
              }
            }
            next[key] = { ...next[key], filled: selectedOption.length > 0, value: selectedOption };
          }
          else {
            // Append new value to existing value unless overwrite is true
            const existingValue = overwrite ? "" : (next[key].value || "");
            const appendedValue = existingValue ? `${existingValue} ${value}` : value;
            next[key] = { ...next[key], filled: appendedValue.trim().length > 0, value: appendedValue };
          }
          // mark filled true and set value as Yogesh
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
        if (!next[key]?.label) continue;
        
        const fieldLabel = next[key].label;
        const labelLower = label?.toLowerCase().trim() || "";
        const fieldLabelLower = fieldLabel.toLowerCase().trim();
        const keyLower = key.toLowerCase().trim();

        const isMatch = 
          fieldLabelLower === labelLower ||
          keyLower === labelLower ||
          labelLower.includes(fieldLabelLower) ||
          fieldLabelLower.includes(labelLower);

        if (isMatch) {
          next[key] = { ...next[key], filled: false, value: "" };
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
  // when the hook is runned for the first time run the getFields function
  // to get the formFields from the backend

  return { formFields, onFieldFilled, onFieldReset };
  // return the formFields and onFieldFilled function
  // onFieldFilled function is used to update the formFields
  // this function is used in useGeminiLive.js to update the formFields
};


