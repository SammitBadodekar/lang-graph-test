import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, BaseMessage, AIMessage } from "@langchain/core/messages";
import { END, MessageGraph } from "@langchain/langgraph";
import readline from 'node:readline';
import { question_pool } from "./questionPool.js";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { topic } from "./topic.js";
import { stdin as input, stdout as output } from 'node:process'
import { studentAttempt } from "./studentAttempts.js";
import { prompts } from "./prompts.js";

const rl = readline.createInterface({ input, output });
const model = new ChatOpenAI({ model: "gpt-4", temperature: 0, streaming: true });
const graph = new MessageGraph();
const chitChatHistory = new ChatMessageHistory();
const questionsHistory = new ChatMessageHistory();

const greetUser = (question, callback) => {
    rl.question(question + "\n\n", async (resp) => {
        await chitChatHistory.addMessage(new HumanMessage(resp))
        callback && callback("done greeting")
    });
}

const askQuestion = (question, callback) => {
    rl.question(question + "\n\n", async (resp) => {
        studentAttempt.push({ question, studentResponse: resp })
        await questionsHistory.addMessage(new AIMessage(question))
        await questionsHistory.addMessage(new HumanMessage(resp))

        console.log("\n\n Getting feedback... \n\n")
        const feedback = await getFeedback()
        console.log(feedback + "\n\n")

        callback && callback("done questioning")
    });
}

const getQuestion = async () => {
    const question = await model.invoke([
        new AIMessage(prompts.getQuestion(topic, question_pool, studentAttempt))
    ]);
    return question
}

const getFeedback = async () => {
    const currentQuestion = studentAttempt[studentAttempt.length - 1]
    const feedback = await model.invoke([
        new AIMessage(prompts.getFeedback(topic, currentQuestion.question, currentQuestion.studentResponse)),
    ]);
    return feedback.content
}

graph.addNode("chit-chat", async (state) => {
    console.log("\n\n Getting AI message... \n\n")
    const initialMessage = await model.invoke(state)
    await chitChatHistory.addMessage(initialMessage)
    await new Promise((resolve) => {
        greetUser(initialMessage.content, resolve)
    })
    return await chitChatHistory.getMessages()
});

graph.addNode("question-answer", async (state) => {
    console.log("\n\n Getting Questions... \n\n")
    const initialQuestion = await getQuestion()

    await questionsHistory.addMessage(initialQuestion)
    await new Promise((resolve) => {
        askQuestion(initialQuestion.content, resolve)
    })

    return state
})

const isReady = async (state) => {
    console.log("\nloading...")
    const chats = await chitChatHistory.getMessages()
    const moveToNext = await model.invoke([
        new AIMessage(prompts.isReady(chats[chats.length - 1].content))
    ])
    if (["true", "yes"].includes(moveToNext.content.toLowerCase())) {
        return "questionAnswer"
    }
    return "chatChat"
};

const isDone = async (state) => {
    console.log("loading...")
    const chats = await questionsHistory.getMessages()
    const moveToNext = await model.invoke([
        new AIMessage(prompts.isDone(chats[chats.length - 1].content))
    ])
    if (["true", "yes"].includes(moveToNext.content.toLowerCase())) {
        rl.close()
        return "end"
    }
    return "questionAnswer"
};

graph.addConditionalEdges("chit-chat", isReady, {
    chatChat: "chit-chat",
    questionAnswer: "question-answer",
});
graph.addConditionalEdges("question-answer", isDone, {
    end: END,
    questionAnswer: "question-answer",
});

graph.setEntryPoint("chit-chat");


const runnable = graph.compile();
await runnable.invoke(new AIMessage(prompts.chitChat(topic)));