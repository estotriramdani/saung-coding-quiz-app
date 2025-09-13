# Programming Quiz App

## Overview

Application name: Saung Coding Quiz App
Target: Students and educators

Create a quiz app.

## Tech stacks:

- Next.js (app directory)
- Prisma+PostgreSQL
- Auth.js authentication
- Tailwind CSS
- DaisyUI
- React Hook Form
- Zod validation
- swr for data fetching


## Roles

1. Admin
2. Educator
3. Student

## Features

1. Registration
  1. Admin - seeded from .env
  2. Educator - can register themselves, admin approval needed
  3. Student - can register themselves
2. Dashboard (admin, user, and educator have different dashboard view)
3. Approval system for educator

## User Story
1. Both user and admin should login to the system
2. Admin and educator can create new quiz. A quiz can insert link to the material (so user can read it before start quiz). It is generate a unique code for user to enroll the quiz.
3. User can register to quiz.
4. User can take quiz
5. User can view their work summary (score, speed of completion) in dashboard
6. Educator can view their quiz performance (average score, completion rate) in dashboard
7. Admin can view overall performance in dashboard
8. Admin can approve educator registration
9. Admin can manage (CRUD) quiz, questions, users, and educators
10. Educator can manage (CRUD) their quiz and questions

## Use-case Diagram
```plaintext
@startuml
actor Admin
actor Educator
actor Student

Admin -> (Login)
Educator -> (Login)
Student -> (Login)

Admin -> (Create Quiz)
Educator -> (Create Quiz)
Student -> (Register for Quiz)
Student -> (Take Quiz)
Student -> (View Work Summary)
Educator -> (View Quiz Performance)
Admin -> (View Overall Performance)
Admin -> (Approve Educator Registration)
Admin -> (Manage Users)
Educator -> (Manage Quiz)

@enduml