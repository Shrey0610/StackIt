# StackIt
- Team Name: SNaRledCoders (Team 0274)
- Team Members: Shrey (L), Razin, Niralee
- Occasion: Odoo Hackathon 2025

## Problem Statement 2: <br>
StackIt is a minimal question-and-answer platform that supports collaborative
learning and structured knowledge sharing. It’s designed to be simple, user-friendly,
and focused on the core experience of asking and answering questions within a community.

## Working Video

[![Watch the demo](https://img.youtube.com/vi/1XpwWSBeOBOnVVvguAdRkEzbtem8hGUaU/0.jpg)](https://drive.google.com/file/d/1XpwWSBeOBOnVVvguAdRkEzbtem8hGUaU/view?usp=sharing)

[Click here to watch the demo video](https://drive.google.com/file/d/1XpwWSBeOBOnVVvguAdRkEzbtem8hGUaU/view?usp=sharing)

## Progress:
![StackIt Screenshot](/SS/Screenshot%202025-07-12%20at%2012.51.22.png)
![StackIt Screenshot](/SS/Screenshot%202025-07-12%20at%2012.51.27.png)
![StackIt Screenshot](/SS/Screenshot%202025-07-12%20at%2012.51.31.png)

## Tech Stack:
| Layer         | Tech                                                            | Reason                                               |
| ------------- | --------------------------------------------------------------- | ---------------------------------------------------- |
| Frontend      | **React.js + Tailwind CSS**                                     | Modular, fast UI with reusable components            |
| Backend       | **Node.js + Express.js** OR **Django**                          | REST APIs, quick development with middleware support |
| Database      | **MongoDB** (if NoSQL) or **PostgreSQL** (if relational)        | Tags and posts are good fit for either               |
| Auth          | **JWT (JSON Web Tokens)**                                       | Secure login/signup                                  |
| Notifications | **WebSockets (Socket.io)** or **Polling**                       | Real-time alerts for mentions, comments              |
| NLP & AI      | **Python (Flask or FastAPI)** with **HuggingFace Transformers** | Handle auto-tagging, similarity, moderation          |
| DevOps        | **Render / Railway / Vercel**                                   | Free tier deploy for demo                            |
| Optional      | **Redis**                                                       | For notification queues or background AI jobs        |
 