// Factorization worksheet
const formFields = {
  // 1. Factorize using identities
  answer_1: { type: "subjective", label: "1a", question: "$81p^2 q^2 - 49$", heading: "Factorize using identities", filled: false, value: "" },
  answer_2: { type: "subjective", label: "1b", question: "$16a^2 - \\frac{25}{4}a^2$", heading: "Factorize using identities", filled: false, value: "" },

  // 2. Factorize using identities
  answer_3: { type: "subjective", label: "2a", question: "$h^2 - 13h - 30$", heading: "Factorize using identities", filled: false, value: "" },
  answer_4: { type: "subjective", label: "2b", question: "$x^2 - 8xy - 48y^2$", heading: "Factorize using identities", filled: false, value: "" },
  answer_5: { type: "subjective", label: "2c", question: "$p^2 + p - 72$", heading: "Factorize using identities", filled: false, value: "" },

  // 3. Factorize and divide
  answer_6: { type: "subjective", label: "3a", question: "$\\frac{p^2 + 11p + 28}{p + 4}$", heading: "Factorize and divide", filled: false, value: "" },
  answer_7: { type: "subjective", label: "3b", question: "$\\frac{4yz(z^2 + 6z - 16)}{2y(z + 8)}$", heading: "Factorize and divide", filled: false, value: "" },

  // 4. Divide using long division
  answer_8: { type: "subjective", label: "4a", question: "$6x^2 + 7x - 20$ by $2x + 5$", heading: "Divide using long division", filled: false, value: "" },
  answer_9: { type: "subjective", label: "4b", question: "$3x^3 + 4x^2 + 5x + 18$ by $x + 2$", heading: "Divide using long division", filled: false, value: "" },

  // 5. Solve using identity
  answer_10: { type: "subjective", label: "5a", question: "$51^2 - 49^2$", heading: "Solve using identity", filled: false, value: "" },
  answer_11: { type: "subjective", label: "5b", question: "$(1.02)^2 - (0.98)^2$", heading: "Solve using identity", filled: false, value: "" },

  // 6. Solve:
  answer_12: { type: "subjective", label: "6", question: "$\\frac{x^4 - 1}{x - 1}$", heading: "Solve", filled: false, value: "" },

  // 7. Verify whether the following equations are correct. Rewrite correctly.
  answer_13: { type: "subjective", label: "7a", question: "$(a + 6)^2 = a^2 + 12a + 36$", heading: "Verify whether the following equations are correct. Rewrite correctly.", filled: false, value: "" },
  answer_14: { type: "subjective", label: "7b", question: "$(2a)^2 + 5a = 4a + 5a$", heading: "Verify whether the following equations are correct. Rewrite correctly.", filled: false, value: "" },

  // 8. Solve for:
  answer_15: { type: "subjective", label: "8", question: "$\\frac{4x^2 - 100}{6(x + 5)}$", heading: "Solve for", filled: false, value: "" },

  // 9. Factorize each of the following by regrouping:
  answer_16: { type: "subjective", label: "9a", question: "$x^2 + xy + 9x + 9y$", heading: "Factorize each of the following by regrouping", filled: false, value: "" },
  answer_17: { type: "subjective", label: "9b", question: "$6xy - 4y + 6 - 9x$", heading: "Factorize each of the following by regrouping", filled: false, value: "" },

  // 10. State True(T) Or False(F):
  answer_18: { type: "subjective", label: "10a", question: "$\\frac{2x - 5}{2x} = -5$", heading: "State True(T) Or False(F)", filled: false, value: "" },
  answer_19: { type: "subjective", label: "10b", question: "$3(y - 2) = 3y - 2$", heading: "State True(T) Or False(F)", filled: false, value: "" },
  answer_20: { type: "subjective", label: "10c", question: "$4x + 3y = 7xy$", heading: "State True(T) Or False(F)", filled: false, value: "" },
  answer_21: { type: "subjective", label: "10d", question: "$(3x)^2 + 4(3x) + 5 = 3x^2 + 12x + 5$", heading: "State True(T) Or False(F)", filled: false, value: "" },
  answer_22: { type: "subjective", label: "10e", question: "$a(5a + 2) = 5a^2 + 2a$", heading: "State True(T) Or False(F)", filled: false, value: "" },

  Instruction: {
    1: "For each question, provide the step-by-step factorization or the final solved equation depending on what the user dictates.",
    2: "For True/False questions (answer_18 to answer_22), only fill in 'True' or 'False'.",
    3: "If the user says to skip a question, leave the value empty."
  },


};

// Social Science WS
const sstFormFields = {
  // Q1: Assertion & Reasoning
  question_1: {
    type: "objective",
    label: "1",
    question: "Assertion: Brahman Pandits gave different interpretations of local laws. Reasoning: There were different schools of dharmashastra and hence it caused misinterpretation.",
    heading: "Choose the appropriate option",
    options: [
      { label: "A", text: "Both A and R are true, and R is the correct explanation of A." },
      { label: "B", text: "Both A and R are true, but R is not the correct explanation of A" },
      { label: "C", text: "A is true but R is false" },
      { label: "D", text: "A is false but R is true" }
    ],
    filled: false,
    value: ""
  },

  // Q2: Soil Profile
  question_2: {
    type: "objective",
    label: "2",
    question: "In a soil profile, this layer is found as the second topmost layer. It mainly consists of sand, silt and clay. In the upper part of this layer, some humus and vegetation materials are found. Which of the following layer of the soil profile is described above?",
    heading: "Choose the appropriate option",
    options: [
      { label: "A", text: "Sub soil" },
      { label: "B", text: "Weathered rock" },
      { label: "C", text: "Top soil" },
      { label: "D", text: "Parent rock" }
    ],
    filled: false,
    value: ""
  },

  // Q3: Short Answer
  answer_9: { type: "subjective", label: "3", question: "List any 4 ways in which the Right to Equality is ensured for all citizens.", heading: "Short Answer", filled: false, value: "" },

  // Q4: Short Answer
  answer_10: { type: "subjective", label: "4", question: "What role does a constitution play in a democratic nation?", heading: "Short Answer", filled: false, value: "" },

  Instruction: {
    1: "For objective questions, set the value to the selected option label (e.g., 'A', 'B').",
    2: "For subjective questions, provide the step-by-step or final answer depending on what the user dictates.",
    3: "If the user says to skip a question, leave the value empty."
  },
};

// Array of object that stores all the forms
const forms = [{

  id: '1',
  name: "Factoization",
  formFields: formFields,
  description: 'Factoization WS',
  tag: 'Mathematics',
  filename: 'filled_factoization.pdf'

},
{
  id: '2',
  name: "Social Science WS",
  formFields: sstFormFields,
  description: 'Social Science WS',
  tag: 'Social Science',
  filename: 'SST_Worksheet_Generated.pdf'
}
]

export default forms;


// To add a new form
// 1. Create template pdf in filled_templatePDFs folder with filename xx-template.pdf
// 2. Add the formFields in formFields.js with id and filename xx.pdf
// 3. Add the controller in controllers/downloadControllers.js with id and and filename xx.pdf
// 4. Add the form in forms array with id and filename xx.pdf