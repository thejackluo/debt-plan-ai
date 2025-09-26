# CollectWise Technical Take-Home Assignment

## Overview

At CollectWise, we are redefining how individuals manage and resolve their financial obligations through AI-powered automation. We are building intelligent solutions that empower users to navigate their debts with flexibility. This take-home assignment is designed to evaluate your ability to develop an AI-driven chatbot that engages with users, understands their financial situation, and negotiates payment terms in a user-friendly and empathetic manner.

## Context

Many individuals communicate their financial challenges over text or email, seeking flexible solutions to manage their obligations. The goal of this assignment is to design an AI-driven chatbot that can dynamically engage with users, assess their financial constraints, and personalize solutions to help them resolve their debts effectively. The chatbot should be intuitive, responsive, and capable of handling real-world negotiation scenarios to create a seamless and constructive experience for users.

## Objective

Your task is to build a chatbot that:

- Engages users in a conversation when they state that they cannot afford to pay their debt
- Negotiates payment terms by determining a reasonable payment plan that aligns with the user's financial situation
- Includes a frontend interface where users can interact with the chatbot. The chat UI/UX should be user-friendly and accessible

## Payment Negotiation Guidelines

### Payment Plan Structure

- Payment plans can be structured as **monthly**, **biweekly**, or **weekly** installments
- The chatbot should suggest realistic payment options based on the total debt amount and the user's ability to pay
- Unrealistic payment terms proposed by debtors should not be accepted

### Examples

- **Reasonable Plan**: If a user owes $3000 and cannot afford to pay it all at once, propose breaking it down into $1000 per month for 3 months instead
- **Unrealistic Plan**: If a user owes $3000 and says they can pay $5 a month for 600 months, the chatbot should continue negotiating until something more reasonable is reached

### Payment URL Format

Once an agreement is reached, the chatbot should send a (mock) URL in the following format:

```
collectwise.com/payments?termLength={termLength}&totalDebtAmount={totalDebtAmount}&termPaymentAmount={termPaymentAmount}
```

## Sample Negotiation

```
Chatbot: "Hello! Our records show that you currently owe $2400. Are you able to resolve this debt today?"

User: "I just got laid off and can't afford to pay that right now."

Chatbot: "I understand. We can break this into smaller payments. Would $800 every month for the next 3 months be manageable for you?"

User: "That's still a bit too high for me."

Chatbot: "No worries! If we extend it to six months, your payment would be $400 per month. How does that sound?"

User: "That works!"

Chatbot: "Great! Here's your payment link to get started: collectwise.com/payments?termLength=6&totalDebtAmount=2400&termPaymentAmount=400"

User: "Thanks!"

Chatbot: "You're welcome! Let us know if you need any adjustments. Have a great day!"
```

## Technical Requirements

### Core Requirements

- For the sake of simplicity, have your chatbot begin with a message stating that the user owes **$2400** to which they can respond with any objections
- The solution must be built using **Next.js** and **TypeScript** and deployed to **Vercel** with a live hosted link
- If you prefer to use a slightly different tech stack, please email `sean@collectwise.com` before proceeding

### AI Framework Options

- You are free to use any Agentic AI framework or build a custom solution from scratch
- We highly recommend using **BAML (BoundaryML)** - [boundaryml.com](https://boundaryml.com), but this is not required
- **OpenAI's Assistants API** is also a good option

### Functionality Requirements

- The chatbot should be able to intelligently guide the conversation and handle different user inputs effectively
- **Frontend**: Create a simple yet engaging chat interface where users can interact with the bot. UI/UX is a key factor in this assignment
- The bot should be capable of handling different negotiation scenarios, such as adjusting term lengths or breaking down payments into manageable amounts

### Additional Notes

- **Compensation**: You will be compensated for OpenAI API credit usage, so feel free to utilize OpenAI models to power your chatbot
- **AI Code Generation Policy**: Feel free to leverage AI code generation tools as you normally would. We believe in using the best tools available to solve real-world problems, and you are encouraged to utilize any resources you would typically rely on in a professional setting

## Submission Details

1. Once completed, a GitHub repository with your code should be shared with **OBrien1107**
2. The hosted Vercel link along with the GitHub project link should be emailed to `sean@collectwise.com`
3. Email `sean@collectwise.com` with any questions or clarifications

## Evaluation Criteria

Your submission will be evaluated based on:

- ✅ **Chatbot Intelligence & Negotiation Strategy** – Does the bot effectively guide users toward a reasonable payment plan?
- ✅ **Frontend & UI/UX** – Is the chat interface appealing, intuitive, and user-friendly?
- ✅ **Technical Implementation** – Is the solution well-structured, maintainable, and scalable?
- ✅ **Creativity & Problem-Solving** – How well does the chatbot handle different user inputs and responses?
- ✅ **Use of AI Frameworks** – While BAML is recommended, we will evaluate how effectively you use your chosen framework or how effective your custom solution is
- ✅ **Deployment & Hosting** – Is the project successfully deployed on Vercel with a working live link?
