export const processToolCalls = (functionCalls, stateRef, callbacks) => {
  const {
    onFieldFilled,
    onFieldReset,
    onNextQuestion,
    onPrevQuestion,
    onGoToQuestion,
    setMessages,
  } = callbacks;

  const toolResponses = [];

  // Helper to find a specific question in the form based on what Gemini asks for

  // Feedback loop - if gemini sends the correct parameter, it will return the fromfield 
  // else will send back Gemini to send the corrrect parameters

  const findField = (formFields, label) => {

    if (!formFields || !label) return null;
    const labelLower = String(label).toLowerCase().trim();

    // 1. Try matching the exact ID (key of a formfield matching) 

    for (const key of Object.keys(formFields)) {
      if (key.toLowerCase().trim() === labelLower) {
        return { key, field: formFields[key] };
      }
    }

    // ex- answer_1: {type:"subjective" , label:"answer_1", question: "What is the answer to the first question?", options:[], filled:false}
    // formfield example

    // 2. Try matching the exact title (like "Question 1")
    for (const key of Object.keys(formFields)) {
      const fieldLabelLower = (formFields[key]?.label || "").toLowerCase().trim();
      if (fieldLabelLower === labelLower) {
        return { key, field: formFields[key] };
      }
    }

    // matching label ----> of answer_1 object

    // 3. If Gemini just said "1", see if it matches "Question 1" or question_number
    for (const key of Object.keys(formFields)) {
      const field = formFields[key];
      const fieldLabelLower = (field?.label || "").toLowerCase().trim();
      const qNumStr = field?.question_number !== undefined ? String(field.question_number).toLowerCase().trim() : "";
      if (
        fieldLabelLower === `question ${labelLower}` ||
        fieldLabelLower === `q${labelLower}` ||
        qNumStr === labelLower ||
        labelLower === `question ${qNumStr}` ||
        labelLower === `q${qNumStr}`
      ) {
        return { key, field };
      }
    }

    // Matching just the number -----> if gemini said "1" we will match it with "1a" label

    return null;
  };

  for (const call of functionCalls) {

    // 1. Function 1
    // Response from Gemini to call get_current_screen_question

    if (call?.name === "get_current_screen_question") {

      // Get the latest data so Gemini doesn't read old answers
      const { currentKey, formFields } = stateRef.current;
      // stateref return the current screen data along with the formfields

      let outputMsg = "No question is currently visible.";

      if (currentKey && formFields && formFields[currentKey]) {

        // formfields contain the data of current screen 
        // these values are extracted and sent to Gemini to get the context for the curretn question 
        // and it can answer accurately based on the context we provided 

        const field = formFields[currentKey];
        const heading = field.heading || "No heading";
        const question = field.question || "No question text";
        const label = field.label || (field.question_number !== undefined ? String(field.question_number) : currentKey);
        const marksText = field.marks !== undefined && field.marks !== null ? `\n- Marks: ${field.marks}` : "";
        const answerStatus = field.filled ? `Already answered: "${field.value}"` : "Not yet answered";

        let optionsText = "";

        if (field.options && Array.isArray(field.options) && field.options.length > 0) {
          const formattedOptions = field.options.map(opt => `[${opt.label}] ${opt.text}`).join(' | ');
          optionsText = `\n- Options: ${formattedOptions}`;
        }

        outputMsg = `Current question on screen:\n- Heading: ${heading}\n- Label: ${label}${marksText}\n- Question: ${question}${optionsText}\n- Status: ${answerStatus}`;
      }

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: outputMsg },
      });

      // toolsresponses is an array which contains all the responses given after calling functions 
      // and it is passed to Gemini back.

    }

    else if (call?.name === "fill_objective_answer" || call?.name === "fill_subjective_answer") {

      const isMcq = call.name === "fill_objective_answer";
      const args = call?.args || {};
      const label = args.question_number;

      let effectiveValue = isMcq ? args.option_label : args.value;
      const effectiveOverwrite = isMcq ? true : (args.overwrite || false);

      const { formFields } = stateRef.current;
      const found = findField(formFields, label);


      if (!found) {
        toolResponses.push({
          id: call.id,
          name: call.name,
          response: { output: `ERROR: Could not find question number "${label}". Call "get_current_screen_question" to see the current question.` },
        });
        continue;
      }


      const isObjectiveQuestion = found.field.type === 'objective';
      if (isMcq !== isObjectiveQuestion) {
        toolResponses.push({
          id: call.id,
          name: call.name,
          response: { output: `ERROR: Question ${found.field.question_number} is ${isObjectiveQuestion ? 'objective. Use "fill_objective_answer"' : 'subjective. Use "fill_subjective_answer"'}.` },
        });
        continue;
      }

      if (effectiveValue === undefined || effectiveValue === null || String(effectiveValue).trim() === "") {
        toolResponses.push({
          id: call.id,
          name: call.name,
          response: { output: `ERROR: Missing answer. Pass ${isMcq ? '"option_label"' : '"value"'}.` },
        });
        continue;
      }

      const existingValue = found.field.value || "";
      const finalValue = effectiveOverwrite ? effectiveValue : (existingValue ? `${existingValue} ${effectiveValue}` : effectiveValue);

      if (typeof onFieldFilled === "function") {
        onFieldFilled(found.key, effectiveValue, effectiveOverwrite); // Pass the exact key so we update the right one
      }

      setMessages((prev) => [
        ...prev,
        { role: "SYS", text: `Filled: ${found.field.label} = ${finalValue}` },
      ]);

      // response sent back to gemini
      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully filled. The exact recorded answer for "${found.field.label}" is now: ${finalValue}` },
      });

    }


    else if (call?.name === "reset_answer") {

      const args = call?.args || {};
      const label = args.question_number;

      const { formFields } = stateRef.current;
      // if found returns the form fields . If not found it returns null
      const found = findField(formFields, label);

      // if found== null --> go back to gemini sending error message
      if (!found) {
        toolResponses.push({
          id: call.id,
          name: call.name,
          response: { output: `ERROR: Could not find any question with label "${label}". Call "get_current_screen_question" to see the valid labels.` },
        });
        continue;
      }

      if (typeof onFieldReset === "function") {
        onFieldReset(found.key); // Use the exact key
      }

      setMessages((prev) => [
        ...prev,
        { role: "SYS", text: `Reset: ${found.field.label}` },
      ]);

      // response sent back to gemini
      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully reset "${found.field.label}"` },
      });

    }

    // 4. Function 4
    // Response from Gemini to call next_question

    else if (call?.name === "next_question") {
      if (typeof onNextQuestion === "function") {
        onNextQuestion();
      }

      setMessages((prev) => [
        ...prev,
        { role: "SYS", text: `Moved to next question` },
      ]);

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully moved to next question` },
      });

    }

    // 5. Function 5
    // Response from Gemini to call prev_question

    else if (call?.name === "prev_question") {
      if (typeof onPrevQuestion === "function") {
        onPrevQuestion();
      }

      setMessages((prev) => [
        ...prev,
        { role: "SYS", text: `Moved to previous question` },
      ]);

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully moved to previous question` },
      });

    }

    // 6. Function 6
    // Response from Gemini to call goto_question    

    else if (call?.name === "goto_question") {

      const args = call?.args || {};
      const label = args.question_number;

      const { formFields } = stateRef.current;
      const found = findField(formFields, label);

      // if found == null --> sending error message back to gemini 
      if (!found) {
        toolResponses.push({
          id: call.id,
          name: call.name,
          response: { output: `ERROR: Could not find any question with label "${label}". Call "get_current_screen_question" to see the valid labels.` },
        });
        continue;
      }

      if (typeof onGoToQuestion === "function") {
        onGoToQuestion(found.key);
      }

      setMessages((prev) => [
        ...prev,
        { role: "SYS", text: `Moved to question ${found.field.label}` },
      ]);

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully jumped to question "${found.field.label}"` },
      });

    }

    // 7. Function 7
    // Response from Gemini to call read_recorded_answer    

    else if (call?.name === "read_recorded_answer") {

      const args = call?.args || {};
      const label = args.question_number;

      const { formFields } = stateRef.current;
      const found = findField(formFields, label);

      const outputMsg = found
        ? (found.field.value ? `The recorded answer for ${found.field.label} is: ${found.field.value}` : `No answer has been recorded for ${found.field.label} yet.`)
        : `ERROR: Could not find any question with label "${label}". Call "get_current_screen_question" to see the valid labels.`;

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: outputMsg },
      });
    }
  }

  return toolResponses;
};
