export const geminiTools = [
  {
    functionDeclarations: [
      {
        name: "fill_form_field",
        description: "Fill exactly one form field by label.",
        parameters: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING", description: "Exact field label" },
            value: { type: "STRING", description: "User provided value" },
            overwrite: { type: "BOOLEAN", description: "Set to true ONLY if the student explicitly wants to replace or correct their entire previous answer. Otherwise, default is false (appends to existing answer)." },
          },
          required: ["label", "value"],
        },
      },
      {
        name: "reset_form_field",
        description: "Clear and reset the filled answer for a specific form field.",
        parameters: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING", description: "Exact field label to reset" },
          },
          required: ["label"],
        },
      },
      {
        name: "next_question",
        description: "Move to the next question. Call this ONLY after the user has successfully provided an answer for the current question and explicitly asks you to go to the next question or if the user wants to skip the current question.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "prev_question",
        description: "Move back to the previous question. Call this ONLY when the user explicitly asks to go back to the previous question.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "get_current_screen_question",
        description: "Returns the full details of the question currently visible on the student's screen: heading, question text, label, and current answer status. You MUST call this every time a new question appears (after next_question, prev_question, goto_question, or on session start) so you know exactly what to read aloud.Even before reading any question on the screen call this function and only then start reading the question.",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "goto_question",
        description: "Jump to a specific question on the screen. Call this ONLY when the user explicitly asks to go to a specific question (e.g. 'go to question 2b').",
        parameters: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING", description: "Exact field label to navigate to" },
          },
          required: ["label"],
        },
      },
      {
        name: "read_recorded_answer",
        description: "Fetch the currently recorded answer for a specific question. Call this when the user asks what they have recorded for a specific question.",
        parameters: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING", description: "Exact field label to read the answer for" },
          },
          required: ["label"],
        },
      }
    ]
  }
];
