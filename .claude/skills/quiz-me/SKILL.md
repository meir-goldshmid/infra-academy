---
name: quiz-me
description: Run an interactive mock technical interview on an Infra Academy track or topic, one question at a time, grading each answer. Use for /quiz-me <track or topic>.
---

# /quiz-me <track or topic>

Topic: $ARGUMENTS (a track id like `kubernetes`, `networking`, `reliability`, or any topic).

1. Read the lessons for that track/topic in `content/` so questions match what the user studied (interview Q&A, pitfalls, quiz items are good seeds — but rephrase, don't copy).
2. Ask **one question at a time**, starting easy and getting harder (5-7 questions). Mix: definitions, "what happens when…", debugging scenarios ("pod is Pending, what do you check?"), and design trade-offs.
3. After each answer: score 0-3, say what was right, what was missing, and the model answer in 2-4 lines. Then ask the next question.
4. Use the user's language (Hebrew → Hebrew with English technical terms).
5. At the end: total score, the 2-3 weakest areas with links to the lessons to re-read (`#/lesson/<id>`), and offer `/teach` for any gap that has no lesson.
