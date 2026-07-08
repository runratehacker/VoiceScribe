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
  const findField = (formFields, label) => {
    if (!formFields || !label) return null;
    const labelLower = String(label).toLowerCase().trim();
    
    // 1. Try matching the exact ID
    for (const key of Object.keys(formFields)) {
      if (key.toLowerCase().trim() === labelLower) {
        return { key, field: formFields[key] };
      }
    }
    
    // 2. Try matching the exact title (like "Question 1")
    for (const key of Object.keys(formFields)) {
      const fieldLabelLower = (formFields[key]?.label || "").toLowerCase().trim();
      if (fieldLabelLower === labelLower) {
        return { key, field: formFields[key] };
      }
    }

    // 3. If Gemini just said "1", see if it matches "Question 1"
    for (const key of Object.keys(formFields)) {
      const fieldLabelLower = (formFields[key]?.label || "").toLowerCase().trim();
      if (fieldLabelLower === `question ${labelLower}` || fieldLabelLower === `q${labelLower}`) {
        return { key, field: formFields[key] };
      }
    }

    return null;
  };

  for (const call of functionCalls) {
    if (call?.name === "get_current_screen_question") {
      // Get the absolute latest data so Gemini doesn't read old answers
      const { currentKey, formFields } = stateRef.current;
      let outputMsg = "No question is currently visible.";

      if (currentKey && formFields && formFields[currentKey]) {
        const field = formFields[currentKey];
        const heading = field.heading || "No heading";
        const question = field.question || "No question text";
        const label = field.label || currentKey;
        const answerStatus = field.filled ? `Already answered: "${field.value}"` : "Not yet answered";
        
        let optionsText = "";
        if (field.options && Array.isArray(field.options)) {
            const formattedOptions = field.options.map(opt => `[${opt.label}] ${opt.text}`).join(' | ');
            optionsText = `\n- Options: ${formattedOptions}`;
        }
        
        outputMsg = `Current question on screen:\n- Heading: ${heading}\n- Label: ${label}\n- Question: ${question}${optionsText}\n- Status: ${answerStatus}`;
      }
      
      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: outputMsg },
      });

    } else if (call?.name === "fill_form_field") {
      const args = call?.args || {};
      const label = args.label;
      const value = args.value;
      const overwrite = args.overwrite || false;

      const { formFields } = stateRef.current;
      const found = findField(formFields, label);

      if (!found) {
        toolResponses.push({
          id: call.id,
          name: call.name,
          response: { output: `ERROR: Could not find any question with exact label "${label}". Call "get_current_screen_question" to see the correct valid labels on screen.` },
        });
        continue;
      }

      // Get the very latest answer so we don't accidentally overwrite anything
      const existingValue = found.field.value || "";
      const finalValue = overwrite ? value : (existingValue ? `${existingValue} ${value}` : value);

      if (typeof onFieldFilled === "function") {
        onFieldFilled(found.key, value, overwrite); // Pass the exact key so we update the right one
      }

      setMessages((prev) => [
        ...prev,
        { role: "SYS", text: `Filled: ${found.field.label} = ${finalValue}` },
      ]);

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully filled. The exact recorded answer for "${found.field.label}" is now: ${finalValue}` },
      });

    } else if (call?.name === "reset_form_field") {
      const args = call?.args || {};
      const label = args.label;

      const { formFields } = stateRef.current;
      const found = findField(formFields, label);

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

      toolResponses.push({
        id: call.id,
        name: call.name,
        response: { output: `Successfully reset "${found.field.label}"` },
      });

    } else if (call?.name === "next_question") {
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

    } else if (call?.name === "prev_question") {
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

    } else if (call?.name === "goto_question") {
      const args = call?.args || {};
      const label = args.label;

      const { formFields } = stateRef.current;
      const found = findField(formFields, label);

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

    } else if (call?.name === "read_recorded_answer") {
      const args = call?.args || {};
      const label = args.label;

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
