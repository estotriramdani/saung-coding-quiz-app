# Question Import JSON Format

This document describes the JSON format for importing questions into quizzes.

## JSON Structure

The JSON file must contain a `questions` array with question objects. Each question object should have the following properties:

```json
{
  "questions": [
    {
      "question": "string",
      "type": "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "options": ["string"] (optional, only for MULTIPLE_CHOICE),
      "correctAnswer": "string",
      "explanation": "string" (optional),
      "points": number
    }
  ]
}
```

## Field Descriptions

- **question** (required): The question text
- **type** (required): The type of question. Must be one of:
  - `MULTIPLE_CHOICE` - Multiple choice question with options
  - `TRUE_FALSE` - True/False question
  - `SHORT_ANSWER` - Short answer question
- **options** (optional): Array of answer choices. Only required for `MULTIPLE_CHOICE` questions
- **correctAnswer** (required): The correct answer
- **explanation** (optional): Explanation of the correct answer
- **points** (required): Number of points the question is worth (minimum 1)

## Examples

### Multiple Choice Question
```json
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "type": "MULTIPLE_CHOICE",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital and most populous city of France.",
      "points": 1
    }
  ]
}
```

### True/False Question
```json
{
  "questions": [
    {
      "question": "JavaScript is a compiled language",
      "type": "TRUE_FALSE",
      "correctAnswer": "False",
      "explanation": "JavaScript is an interpreted language, not compiled.",
      "points": 1
    }
  ]
}
```

### Short Answer Question
```json
{
  "questions": [
    {
      "question": "What is the output of 2 + 2?",
      "type": "SHORT_ANSWER",
      "correctAnswer": "4",
      "explanation": "Basic arithmetic: 2 plus 2 equals 4.",
      "points": 1
    }
  ]
}
```

### Multiple Questions Example
```json
{
  "questions": [
    {
      "question": "What is the capital of France?",
      "type": "MULTIPLE_CHOICE",
      "options": ["London", "Berlin", "Paris", "Madrid"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital and most populous city of France.",
      "points": 2
    },
    {
      "question": "JavaScript is a compiled language",
      "type": "TRUE_FALSE",
      "correctAnswer": "False",
      "explanation": "JavaScript is an interpreted language, not compiled.",
      "points": 1
    },
    {
      "question": "What does HTML stand for?",
      "type": "SHORT_ANSWER",
      "correctAnswer": "HyperText Markup Language",
      "explanation": "HTML stands for HyperText Markup Language.",
      "points": 1
    }
  ]
}
```

## Validation Rules

1. The JSON must have a root `questions` array
2. Each question must have all required fields
3. `type` must be one of the valid enum values
4. `points` must be a positive integer (minimum 1)
5. `options` is required for `MULTIPLE_CHOICE` questions and should be an array of strings
6. `options` should not be provided for `TRUE_FALSE` or `SHORT_ANSWER` questions

## Error Handling

If the JSON format is invalid, the import will fail with specific error messages indicating:
- Missing required fields
- Invalid field types
- Invalid enum values
- Validation errors

## Usage

1. Create a JSON file following the format above
2. Go to the quiz detail page
3. Navigate to the "Questions" tab
4. Use the "Import Questions from JSON" section
5. Upload your JSON file
6. Preview the questions
7. Click "Import" to add them to your quiz
