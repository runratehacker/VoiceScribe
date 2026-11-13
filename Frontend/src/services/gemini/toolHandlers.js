// Finds the question using the question number

const findField = (formFields, questionNumber) => {

  const key = Object.keys(formFields).find((k) =>

    String(formFields[k].question_number) === String(questionNumber)
  );

  if (key) return { key, field: formFields[key] };

  return null;
};

// JSON schema to be followed by all the functions

const buildResponse = (call, status, data = null, error = null) => ({

  id: call.id,
  name: call.name,
  response: {
    status,
    action: call.name,
    data,
    error,

  },
});

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

  for (const call of functionCalls) {

    const { currentKey, formFields } = stateRef.current;

    // switch to handle the tool calls 

    switch (call.name) {

      case "get_current_screen_question": {

        const field = formFields?.[currentKey];

        if (!field) {

          toolResponses.push(

            buildResponse(call, "error", null, {

              code: "NO_ACTIVE_QUESTION",
              message: "No question is currently visible.",

            })
          );
          break;
        }

        toolResponses.push(

          buildResponse(call, "success", {

            question_number: field.question_number,
            type: field.type,
            heading: field.heading,
            question: field.question,
            options: field.options,
            marks: field.marks,
            filled: field.filled,
            recorded_answer: field.value || null,

          })
        );
        break;
      }

      case "fill_objective_answer": {

        const found = findField(formFields, call.args.question_number);

        if (found.field.type !== "objective") {

          toolResponses.push(

            buildResponse(call, "error", null, {

              code: "WRONG_TOOL_TYPE",
              message: "Question is subjective. Use fill_subjective_answer.",

            })
          );
          break;
        }

        onFieldFilled(found.key, call.args.option_label, true);

        // add this message to the array

        setMessages((prev) => [
          ...prev,
          { role: "SYS", text: `Filled: Q${found.field.question_number} = ${call.args.option_label}` },
        ]);

        toolResponses.push(

          buildResponse(call, "success", {

            question_number: found.field.question_number,
            type: "objective",
            recorded_answer: call.args.option_label,
            overwrite: true,

          })
        );
        break;
      }

      case "fill_subjective_answer": {

        const found = findField(formFields, call.args.question_number);

        if (found.field.type !== "subjective") {

          toolResponses.push(

            buildResponse(call, "error", null, {

              code: "WRONG_TOOL_TYPE",
              message: "Question is objective. Use fill_objective_answer.",

            })
          );
          break;
        }

        const overwrite = Boolean(call.args.overwrite);
        const value = call.args.value;

        let finalValue;

        if (overwrite) {
          finalValue = value;
        }
        else {
          if (found.field.value) {
            finalValue = `${found.field.value} ${value}`;
          }
          else {
            finalValue = value;
          }
        }

        onFieldFilled(found.key, finalValue, overwrite);

        setMessages((prev) => [
          ...prev,
          { role: "SYS", text: `Filled: Q${found.field.question_number} = ${finalValue}` },
        ]);

        toolResponses.push(

          buildResponse(call, "success", {

            question_number: found.field.question_number,
            type: "subjective",
            recorded_answer: finalValue,
            overwrite,

          })
        );
        break;
      }

      case "reset_answer": {

        const found = findField(formFields, call.args.question_number);

        onFieldReset(found.key);

        setMessages((prev) => [
          ...prev,
          { role: "SYS", text: `Reset: Q${found.field.question_number}` },
        ]);

        toolResponses.push(

          buildResponse(call, "success", {

            question_number: found.field.question_number,
            cleared: true,

          })
        );
        break;
      }

      case "next_question": {

        onNextQuestion();

        setMessages((prev) => [
          ...prev,
          { role: "SYS", text: "Moved to next question" },
        ]);

        toolResponses.push(buildResponse(call, "success", { navigated: "next" }));
        break;
      }

      case "prev_question": {

        onPrevQuestion();

        setMessages((prev) => [
          ...prev,
          { role: "SYS", text: "Moved to previous question" },
        ]);

        toolResponses.push(buildResponse(call, "success", { navigated: "previous" }));
        break;
      }

      case "goto_question": {

        const found = findField(formFields, call.args.question_number);

        onGoToQuestion(found.key);

        setMessages((prev) => [
          ...prev,
          { role: "SYS", text: `Moved to Q${found.field.question_number}` },
        ]);

        toolResponses.push(

          buildResponse(call, "success", {

            navigated: "goto",
            question_number: found.field.question_number,

          })
        );
        break;
      }

      case "read_recorded_answer": {

        const found = findField(formFields, call.args.question_number);

        toolResponses.push(

          buildResponse(call, "success", {

            question_number: found.field.question_number,
            filled: Boolean(found.field.value),
            recorded_answer: found.field.value || null,

          })
        );
        break;
      }
    }
  }

  return toolResponses;
};
