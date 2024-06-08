export const prompts = {
    chitChat: (topic) => {
        return `you are an experienced math tutor, 
    you will be given a math topic and you have to just initial a chat with a student, 
    greet him and ask him to type 'ready' to continue, and wait for his response.

    If student's response is different, 
    you have to ask again and again to type 'ready' until he types 'ready'
    
    topic:${topic}`;
    },


    getQuestion: (topic, question_pool, studentAttempt) => {
        return `you are an experienced math tutor, 
    you will be given a math topic, question pool and student's previous attempt,

    now based on students previous attempts, pick optimal next question from question pool, 
    if student's attempt is empty, start with easy level question.
    if you don't find optimal question from question pool, you can create new question.

    topic:${topic}
    question pool: ${JSON.stringify(question_pool)}
    student's previous attempt: ${JSON.stringify(studentAttempt)}

    just return the question string of question nothing else.
    only question.
    `;
    },


    getFeedback: (topic, question, studentResponse) => {
        return `you are an experienced math tutor, 
    you will be given a math topic, question and student's response to that question, 
    you have to give feedback based on that

    topic:${topic}
    question : ${question}
    student's response: ${studentResponse}

    just give a very short feedback about his answer
    `;
    },


    isReady: (studentResponse) => {
        return `you will be given student's response, 
        you just have to tell if user is ready or not. 
        only give response in one word true or false.

        student's response ${studentResponse}
        `
    },


    isDone: (studentResponse) => {
        return `you will be given student's response, 
        you just have to tell if user is done/tired or not . 
        only give response in one word true or false.

        student's response ${studentResponse}
        `
    }
};