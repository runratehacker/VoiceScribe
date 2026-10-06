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

// Science Annual Examination (Class V - DPS Bangalore North)
const scienceFormFields = {
  // Section I: Multiple Choice Questions (1-10)
  answer_1: {
    type: "objective",
    label: "1",
    question: "Ravi wants to load a heavy box into a truck. Instead of lifting it straight up, he uses a ramp. Why does using the ramp makes his work easier?",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "It increases the weight of the box." },
      { label: "B", text: "It reduces the distance moved." },
      { label: "C", text: "It reduces the force needed." },
      { label: "D", text: "It changes the shape of the box." }
    ],
    filled: false,
    value: ""
  },
  answer_2: {
    type: "objective",
    label: "2",
    question: "A student pulls a rope to hoist a flag upward using a wheel and rope system. Which simple machine is used?",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "Pulley" },
      { label: "B", text: "wedge" },
      { label: "C", text: "wheel and axle" },
      { label: "D", text: "lever" }
    ],
    filled: false,
    value: ""
  },
  answer_3: {
    type: "objective",
    label: "3",
    question: "The force responsible for the paper pieces moving towards the plastic comb after rubbing on the head is called ________________",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "magnetic force" },
      { label: "B", text: "frictional force" },
      { label: "C", text: "electrostatic force" },
      { label: "D", text: "gravitational force" }
    ],
    filled: false,
    value: ""
  },
  answer_4: {
    type: "objective",
    label: "4",
    question: "Which of the following is NOT an example of energy transformation?",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "Speaking" },
      { label: "B", text: "Television" },
      { label: "C", text: "Radio" },
      { label: "D", text: "Candle" }
    ],
    filled: false,
    value: ""
  },
  answer_5: {
    type: "objective",
    label: "5",
    question: "An empty farm near a village is used for dumping garbage. After a few months, the area smells bad, plants stop growing and animals often fall sick. This is caused due to ____________",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "Noise pollution" },
      { label: "B", text: "Air pollution" },
      { label: "C", text: "Land pollution" },
      { label: "D", text: "Water pollution" }
    ],
    filled: false,
    value: ""
  },
  answer_6: {
    type: "objective",
    label: "6",
    question: "Animal dung, especially that of cattle such as cows and buffaloes is used to produce a fuel called ______________",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "petroleum" },
      { label: "B", text: "biogas" },
      { label: "C", text: "coal" },
      { label: "D", text: "LPG" }
    ],
    filled: false,
    value: ""
  },
  answer_7: {
    type: "objective",
    label: "7",
    question: "Even when a person is sleeping or resting, the heart continues to beat and pump blood throughout the body without stopping. This action is carried out by ______________",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "voluntary muscles" },
      { label: "B", text: "skeletal muscles" },
      { label: "C", text: "cardiac muscles" },
      { label: "D", text: "striated muscles" }
    ],
    filled: false,
    value: ""
  },
  answer_8: {
    type: "objective",
    label: "8",
    question: "While playing, Tina rotates her arm in a circle at the shoulder and bends her elbow to throw a ball. Which joint is present in the shoulder?",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "Hinge joint" },
      { label: "B", text: "Ball and socket joint" },
      { label: "C", text: "Gliding joint" },
      { label: "D", text: "Pivot joint" }
    ],
    filled: false,
    value: ""
  },
  answer_9: {
    type: "objective",
    label: "9",
    question: "Ravi accidentally touches a hot vessel. His hand is pulled back immediately before he feels the pain and only after a moment does he realize what happened. This shows that the response was first controlled by the _________.",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "brain only" },
      { label: "B", text: "heart" },
      { label: "C", text: "muscles" },
      { label: "D", text: "spinal cord" }
    ],
    filled: false,
    value: ""
  },
  answer_10: {
    type: "objective",
    label: "10",
    question: "Involuntary actions such as breathing, heartbeat, digestion are controlled by the ________.",
    heading: "I. MULTIPLE CHOICE QUESTIONS",
    options: [
      { label: "A", text: "cerebrum" },
      { label: "B", text: "cerebellum" },
      { label: "C", text: "brainstem" },
      { label: "D", text: "spinal cord" }
    ],
    filled: false,
    value: ""
  },

  // Section II: Name the Following (1X4=4M)
  answer_11: {
    type: "subjective",
    label: "II.1",
    question: "Name the following: The substance that causes pollution.",
    heading: "II. NAME THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_12: {
    type: "subjective",
    label: "II.2",
    question: "Name the following: The fixed point around which a lever turns.",
    heading: "II. NAME THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_13: {
    type: "subjective",
    label: "II.3",
    question: "Name the following: A push or pull that makes an object move.",
    heading: "II. NAME THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_14: {
    type: "subjective",
    label: "II.4",
    question: "Name the following: Strong bands of tissues that attach one bone to another.",
    heading: "II. NAME THE FOLLOWING",
    filled: false,
    value: ""
  },

  // Section III: Answer the Following (2X5=10M)
  answer_15: {
    type: "subjective",
    label: "III.1",
    question: "Give the difference between biodegradable waste and non-biodegradable waste along with an example.",
    heading: "III. ANSWER THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_16: {
    type: "subjective",
    label: "III.2",
    question: "Why is a screw better than a nail?",
    heading: "III. ANSWER THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_17: {
    type: "subjective",
    label: "III.3",
    question: "What are the different functions of the skeletal system?",
    heading: "III. ANSWER THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_18: {
    type: "subjective",
    label: "III.4",
    question: "With the help of a mind map mention any two types of simple machines with their advantage.",
    heading: "III. ANSWER THE FOLLOWING",
    filled: false,
    value: ""
  },
  answer_19: {
    type: "subjective",
    label: "III.5",
    question: "How many pairs of ribs are present in the human body? To which bones the ribs are attached at the front and the back? Why are the last two pairs of ribs called as floating ribs?",
    heading: "III. ANSWER THE FOLLOWING",
    filled: false,
    value: ""
  },

  Instruction: {
    1: "For objective questions (answer_1 to answer_10), record the selected option label only (e.g., 'A', 'B', 'C', or 'D').",
    2: "For Section II questions (answer_11 to answer_14), record the exact term or phrase named by the student.",
    3: "For Section III questions (answer_15 to answer_19), record the full answer dictated by the student.",
    4: "If the student says to skip a question, leave the value empty."
  }
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
},
{
  id: '3',
  name: "Science Annual Examination (Class V)",
  formFields: scienceFormFields,
  description: 'DPS Bangalore North Science Annual Examination 2025-2026',
  tag: 'Science',
  filename: 'Science_Annual_Exam.pdf'
}
]

export default forms;


// To add a new form
// 1. Create template pdf in filled_templatePDFs folder with filename xx-template.pdf
// 2. Add the formFields in formFields.js with id and filename xx.pdf
// 3. Add the controller in controllers/downloadControllers.js with id and and filename xx.pdf
// 4. Add the form in forms array with id and filename xx.pdf