class QuestionsStore {
    constructor() {
        this.questionsById = {};
        this.questions = {};
        this.numberOfQuestionsAnswered = 0;
        this.totalNumberOfQuestions = 0;
    }

    store(questions, questionScoreStratergy) {
        this.questions = {};
        for (let categoryName in questions) {
            this.questions[categoryName] = {};
            for (let difficulty in questions[categoryName]) {
                this.questions[categoryName][difficulty] = [];
                for (let i = 0; i < questions[categoryName][difficulty].length; i++) {
                    const question = questions[categoryName][difficulty][i];
                    question.status = QUESTION_STATUS.INIT;
                    question.score = questionScoreStratergy(question);
                    question.isDoubleJeopardy = false;
                    question.doubleJeopardyAmount = 0;
                    this.questionsById[question.uuid] = question;
                    this.questions[categoryName][difficulty].push(question.uuid);
                    this.totalNumberOfQuestions++;
                }
            }
        }
    }

    setDoubleJeopardy(questionUuid) {
        this.questionsById[questionUuid].isDoubleJeopardy = true;
    }

    isDoubleJeopardy(questionUuid) {
        return this.questionsById[questionUuid].isDoubleJeopardy === true;
    }

    getTotalNumberOfQuestions() {
        return this.totalNumberOfQuestions;
    }

    getNumberOfQuestionsAnswered() {
        return this.numberOfQuestionsAnswered;
    }

    get(questionUuid) {
        return this.questionsById[questionUuid];
    }

    getQuestions(category, difficulty) {
        if (!this.questions[category][difficulty]) {
            return [];
        }
        return this.questions[category][difficulty].map(this.get.bind(this)).sort((a, b) => a.score - b.score);
    }

    getQuestionStatus(questionUuid) {
        return this.questionsById[questionUuid].status;
    }

    setQuestionStatus(questionUuid, status) {
        return this.questionsById[questionUuid].status = status;
    }

    getQuestionAnswer(questionUuid) {
        return this.questionsById[questionUuid].correct_answer;
    }

    getQuestionScore(questionUuid) {
        return this.questionsById[questionUuid].score;
    }

    setQuestionAnswered(questionUuid, playerName, isAnsweredCorrectly, doubleJeopardyAmount = 0) {
        this.questionsById[questionUuid].playerName = playerName;
        this.questionsById[questionUuid].isAnsweredCorrectly = isAnsweredCorrectly;
        this.questionsById[questionUuid].status = QUESTION_STATUS.ANSWERED;
        this.questionsById[questionUuid].doubleJeopardyAmount = doubleJeopardyAmount;
        this.numberOfQuestionsAnswered++;
    }
}