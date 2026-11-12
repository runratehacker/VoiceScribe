// These tools are sent to Gemini once per session at the beginning of the WebSocket
// connection along with the initial setup message.

// schema for question numbers

const schema = (questionNumbers, description) => ({
  type: "STRING",
  description,
  enum: questionNumbers,
});

export const GeminiTools = (formFields) => {

  const questionNumbers = Object.values(formFields).map((field) => String(field.question_number));

  return [
    {
      functionDeclarations: [

        // Function 1 - fill_objective_answer
        {
          name: "fill_objective_answer",
          description:
            "Chooses a option for a multiple-choice question (objective). Can be used to replace already filled choice as well.",
          parameters: {
            type: "OBJECT",
            properties: {
              question_number: schema(questionNumbers, "The objective question number to answer."),
              option_label: {
                type: "STRING",
                enum: ["A", "B", "C", "D"],
                description: "The single option letter the student chooses (e.g. 'A').",
              },
            },
            required: ["question_number", "option_label"],
          },
        },

        // Function 2 - fill_subjective_answer
        {
          name: "fill_subjective_answer",
          description:
            "Fills the answer for a subjective (written) question.",
          parameters: {
            type: "OBJECT",
            properties: {
              question_number: schema(questionNumbers, "The subjective question number to answer."),
              value: {
                type: "STRING",
                description: "The answer spoken by the student (or 'NULL' if skipped).",
              },
              overwrite: {
                type: "BOOLEAN",
                description:
                  "Set to true only if the student explicitly wants to replace their entire previous answer. Otherwise leave false (appends to the existing answer).",
              },
            },
            required: ["question_number", "value"],
          },
        },

        // Function 3 - reset_answer
        {
          name: "reset_answer",
          description:
            "Clears the recorded answer for a question. Use it only when the student asks to clear the answer or start over.",
          parameters: {
            type: "OBJECT",
            properties: {
              question_number: schema(questionNumbers, "The question number whose answer should be cleared."),
            },
            required: ["question_number"],
          },
        },

        // Function 4 - next_question
        {
          name: "next_question",
          description:
            "Moves to the next question. Use it when the student explicitly asks to move to the next question.",
          parameters: {
            type: "OBJECT",
            properties: {},
          },
        },

        // Function 5 - prev_question
        {
          name: "prev_question",
          description:
            "Moves to the previous question. Use it when the student explicitly asks to go back to the previous question.",
          parameters: {
            type: "OBJECT",
            properties: {},
          },
        },

        // Function 6 - get_current_screen_question
        {
          name: "get_current_screen_question",
          description:
            "Returns the question currently visible on the student's screen: its section heading, question number, marks, question text, answer options (A-D, only for objective questions) and whether it is already answered. Call this at the start of the session and after EVERY navigation (next_question, prev_question, goto_question). Always call it BEFORE reading anything aloud, and read only what it returns. Do not guess the current question from memory.",
          parameters: {
            type: "OBJECT",
            properties: {},
          },
        },

        // Function 7 - goto_question
        {
          name: "goto_question",
          description:
            "Jumps to a specific question on the screen. Call this only when the student explicitly asks to go to a specific question number (e.g. 'go to question 2').",
          parameters: {
            type: "OBJECT",
            properties: {
              question_number: schema(questionNumbers, "The question number to jump to."),
            },
            required: ["question_number"],
          },
        },

        // Function 8 - read_recorded_answer
        {
          name: "read_recorded_answer",
          description:
            "Fetches the currently recorded answer for a question. Call this when the student asks what they have recorded for a specific question number.",
          parameters: {
            type: "OBJECT",
            properties: {
              question_number: schema(questionNumbers, "The question number to read the answer for."),
            },
            required: ["question_number"],
          },
        },
      ],
    },
  ];
};
