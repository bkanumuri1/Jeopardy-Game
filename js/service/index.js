const probability = function (n) {
    return !!n && Math.random() <= n;
};

const DOUBLE_JEOPARDY_PROBABILTY = 0.15;

class JeopardyService {

    constructor(numberOfPlayers, numberOfCategories, numberOfQuestions) {
        this.numberOfPlayers = numberOfPlayers;
        const difficultyLevelStratergy = this.getDifficultyLevelSratergy(numberOfQuestions);
        this.difficultyLevels = [DIFFICULTY_LEVELS.EASY, DIFFICULTY_LEVELS.MEDIUM, DIFFICULTY_LEVELS.HARD];
        this.questionsProvider = new QuestionsProvider(numberOfCategories, this.difficultyLevels, difficultyLevelStratergy);
        this.questionsStore = new QuestionsStore();
        this.playerInfoStore = new PlayerInfoStore(this.numberOfPlayers);
        this.gameStatus = GAME_STATUS.LOADING;
        this.currentQuestionUuid = null;
    }

    questionScoreStratergy(question) {
        switch (question.difficulty) {
            case DIFFICULTY_LEVELS.EASY: return probability(0.5) ? 200 : 400;
            case DIFFICULTY_LEVELS.MEDIUM: return probability(0.5) ? 600 : 800;
            case DIFFICULTY_LEVELS.HARD: return 1000;
        }
        return 0;
    }

    getScores() {
        return this.playerInfoStore.getScores();
    }

    canMakeDoubleJeopard(amount) {
        return this.playerInfoStore.getScore(this.getActivePlayerId()) >= amount;
    }

    isDoubleJeopardy() {
        return this.questionsStore.isDoubleJeopardy(this.currentQuestionUuid);
    }

    getDifficultyLevelSratergy(numberOfQuestions) {
        return {
            [DIFFICULTY_LEVELS.EASY]: Math.floor(numberOfQuestions / 3) + Math.floor(((numberOfQuestions % 3) + 2) / 3),
            [DIFFICULTY_LEVELS.MEDIUM]: Math.floor(numberOfQuestions / 3) + Math.floor(((numberOfQuestions % 3) + 1) / 3),
            [DIFFICULTY_LEVELS.HARD]: Math.floor(numberOfQuestions / 3)
        }
    }

    async init() {
        const questions = await this.questionsProvider.getQuestions(2);
        this.questionsStore.store(questions, this.questionScoreStratergy);
        this.players = this.playerInfoStore.getPlayers();
        this.activePlayerIndex = 0;
        this.setGameStatus(GAME_STATUS.PLAYER_SELECTION);
        this.gameChanged();
    }

    getNextPlayerIndex() {
        return (this.activePlayerIndex + 1) % this.numberOfPlayers;
    }

    getActivePlayerId() {
        return this.players[this.activePlayerIndex];
    }

    setNextPlayerActive() {
        this.activePlayerIndex = this.getNextPlayerIndex();
    }

    setGameStatus(status) {
        this.gameStatus = status;
    }

    onPlayerQuestionSelect(questionUuid) {
        if (this.gameStatus === GAME_STATUS.PLAYER_ANSWERING) {
            return;
        }
        const questionStatus = this.questionsStore.getQuestionStatus(questionUuid);
        if (questionStatus !== QUESTION_STATUS.INIT) {
            return;
        }
        const isDoubleJeopardy = probability(DOUBLE_JEOPARDY_PROBABILTY);
        this.questionsStore.setQuestionStatus(questionUuid, QUESTION_STATUS.OPEN);
        if (isDoubleJeopardy) {
            this.questionsStore.setDoubleJeopardy(questionUuid);
        }
        this.setGameStatus(GAME_STATUS.PLAYER_ANSWERING);
        this.currentQuestionUuid = questionUuid;
        this.gameChanged();
    }

    isAnswerValid(questionUuid, answer) {
        return this.questionsStore.getQuestionAnswer(questionUuid) === answer;
    }

    incrementActivePlayerScore(points) {
        const playerId = this.getActivePlayerId();
        this.playerInfoStore.addScore(playerId, points);
    }

    decrementActivePlayerScore(points) {
        const playerId = this.getActivePlayerId();
        this.playerInfoStore.subtractScore(playerId, points);
    }

    getActivePlayerName() {
        return this.playerInfoStore.getPlayerName(this.getActivePlayerId());
    }

    areAllTheQuestionsAnswered() {
        return this.questionsStore.getTotalNumberOfQuestions() === this.questionsStore.getNumberOfQuestionsAnswered();
    }

    onPlayerAnswer(answer, doubleJeopardyAmount = 0) {
        const questionStatus = this.questionsStore.getQuestionStatus(this.currentQuestionUuid);
        if (questionStatus !== QUESTION_STATUS.OPEN) {
            return;
        }
        let points = this.questionsStore.getQuestionScore(this.currentQuestionUuid);
        if (this.questionsStore.isDoubleJeopardy(this.currentQuestionUuid)) {
            points += doubleJeopardyAmount;
        }
        else {
            doubleJeopardyAmount = 0;
        }
        const isAnswerCorrect = this.isAnswerValid(this.currentQuestionUuid, answer);
        if (isAnswerCorrect) {
            this.incrementActivePlayerScore(points)
        }
        else {
            this.decrementActivePlayerScore(points)
        }
        this.questionsStore.setQuestionAnswered(this.currentQuestionUuid, this.getActivePlayerName(), isAnswerCorrect, doubleJeopardyAmount)
        const isGameOver = this.areAllTheQuestionsAnswered();
        if (isGameOver) {
            this.setGameStatus(GAME_STATUS.GAME_OVER);
        }
        else {
            this.setGameStatus(GAME_STATUS.PLAYER_SELECTION);
            this.setNextPlayerActive();
        }
        this.currentQuestionUuid = null;
        setTimeout(() => this.gameChanged(), 1000);
        return isAnswerCorrect;
    }

    getCurrentQuestion() {
        if (!this.currentQuestionUuid) {
            return;
        }
        return this.questionsStore.get(this.currentQuestionUuid);
    }

    registerOnGameChange(callback) {
        this.callback = callback;
        this.gameChanged();
    }

    gameChanged() {
        this.callback(this.gameStatus);
    }

    getCategories() {
        return this.questionsProvider.getCategories();
    }

    getDifficultyLevels() {
        return this.difficultyLevels;
    }

    getWinners() {
        return this.playerInfoStore.getLeadingScorePlayers()
    }

    getQuestions(category) {
        const questions = [
            ...this.questionsStore.getQuestions(category, this.difficultyLevels[0]),
            ...this.questionsStore.getQuestions(category, this.difficultyLevels[1]),
            ...this.questionsStore.getQuestions(category, this.difficultyLevels[2]),
        ]

        return questions;
    }
}