## prompt you can give to your AI coding assistant to review and verify the conversation.
```diff

! Act as a senior MERN stack developer and AI integration engineer. Review the existing {file} logic in my {current_project_name} project and identify any bugs or logical issues. Do not rewrite the whole project or make unnecessary changes.

- Project context:
+ Backend: Node.js, Express.js, MongoDB, and Mongoose.
+ AI provider: OpenRouter API , Openai moderation  Api
+ Frontend: React, Tailwind CSS, and Axios.

- Current approach:
- Tasks:
- Required Output
- explain in steps
+ example:
- First, explain how the current code works.
- Second, list confirmed bugs and potential risks separately. Do not claim a bug exists unless the code supports that conclusion.
-important rules:
+ Keep explanations beginner-friendly and explain why each fix is necessary.
+ If the existing code is already correct in any area, say so instead of changing it.
```
## prompt Modify or Add Features in the project
```diff
!Act as a senior MERN stack developer and AI integration engineer. Help me modify and improve my existing chatbot project while preserving its current architecture, working features, and code quality.

-1. My Project Context:
Technology stack:
Frontend: React.js, Tailwind CSS, Axios, React Router.
Backend: Node.js and Express.js.
Database: MongoDB with Mongoose.
AI integration: OpenRouter Chat Completions API.
Input safety: OpenAI Moderation API.
AI context management: Token counting, conversation history, and summarization.

-2. Current Folder Structure
-3. Existing Functionality


-4. Rules for Every New Feature or Modification
Step 1: Understand before coding

Inspect the relevant files and trace how the existing functionality works from frontend to backend and database.

Identify:

Components and pages involved.
API helpers and service functions involved.
Backend routes and controllers involved.
Models and database fields involved.
Dependencies on existing features.

Do not start rewriting code before understanding the current implementation.

-Step 2: Check existing functionality

Determine whether the requested feature already exists fully, partially, or not at all.

If it already exists, improve the existing implementation instead of creating a duplicate.

If the feature is partially implemented, continue from the current code.

Step 3: Plan the smallest safe change

Before editing, briefly explain:

What needs to change.
Which files will be affected.
Whether a database schema change is needed.
Whether any API request or response format will change.
Whether existing features could be affected.

Avoid unnecessary refactoring.

```