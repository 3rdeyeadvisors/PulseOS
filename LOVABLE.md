# LOVABLE.md Rulebook for Jules

Create a file in the root directory called LOVABLE.md. This is your manual for how to build on this platform. Every time you start a task, read this file first.

## Our Rules:

- **State Management**: Always verify that Supabase queries match the current schema.
- **Navigation**: Never break the main flow (Home > Dashboard > Settings).
- **Styling**: Use Tailwind CSS. Do not create new custom CSS files unless requested.
- **Error Handling**: If a Build Check fails, you are authorized to self-correct and push a new commit to the branch until it is Green.
- **Flow Integrity**: Before finishing a UI task, ensure all buttons have an 'onClick' or 'href'—no dead buttons.
