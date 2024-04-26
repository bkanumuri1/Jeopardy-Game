class JeopardyDelivery {
    constructor(numberOfPlayers, numberOfCategories, numberOfQuestions) {
        this.jeopardyService = new JeopardyService(numberOfPlayers, numberOfCategories, numberOfQuestions);
        this.game = document.getElementById('game');
        this.points = document.getElementById('points');
        this.scoreDisplay = document.getElementById('score');
        this.players = document.getElementById('playersInput');
        this.categoriesInput = document.getElementById('categoriesInput');
        this.questionsInput = document.getElementById('questionsInput');
    }

    async init() {
        this.jeopardyService.registerOnGameChange(this.renderUI.bind(this));
        await this.jeopardyService.init();
    }

    createColumn(cateogryName) {
        const column = document.createElement('div');
        column.classList.add('genre-column');
        column.innerHTML = cateogryName;
        this.game.append(column);
        return column;
    }

    getInitCard(question) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('init');
        card.innerHTML = `$${question.score}`;
        card.setAttribute('data-question-uuid', question.uuid);
        card.addEventListener('click', this.onInitCardClick.bind(this));
        return card;
    }

    getOpenCard(question) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('open');
        const textDisplay = document.createElement('div');
        const buttonContainer = document.createElement('div');
        const trueButton = document.createElement('button')
        const falseButton = document.createElement('button')
        trueButton.setAttribute('question-uuid', question.uuid);
        trueButton.setAttribute('value', 'True');
        falseButton.setAttribute('question-uuid', question.uuid);
        falseButton.setAttribute('value', 'False');
        trueButton.innerHTML = 'True'
        falseButton.innerHTML = 'False'
        trueButton.classList.add('true-button')
        falseButton.classList.add('false-button')
        buttonContainer.classList.add('button-container')
        trueButton.addEventListener('click', this.onAnswerSelect.bind(this))
        falseButton.addEventListener('click', this.onAnswerSelect.bind(this))
        textDisplay.innerHTML = question.question;
        card.append(textDisplay)
        if (question.isDoubleJeopardy) {
            const doubleJeopardyInput = document.createElement('input');
            doubleJeopardyInput.placeholder = 'wager'
            buttonContainer.append(doubleJeopardyInput)
            const doubleJeopardyText = document.createElement('div');
            doubleJeopardyText.classList.add('dj');
            doubleJeopardyText.innerHTML = 'Double Jeopardy!';
            card.append(doubleJeopardyText);
        }
        buttonContainer.append(trueButton, falseButton)
        card.append(buttonContainer)
        return card;
    }

    getAnsweredCard(question) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.classList.add('answered');
        const textDisplay = document.createElement('div');
        const playerNameDisplay = document.createElement('span');
        const pointsDisplay = document.createElement('span');
        textDisplay.innerHTML = question.question;
        playerNameDisplay.innerHTML = question.playerName;
        pointsDisplay.innerHTML = `$${question.score}${question.isDoubleJeopardy ? ' + $' + question.doubleJeopardyAmount : ''}`;
        if (question.isAnsweredCorrectly) {
            playerNameDisplay.classList.add('correct');
        }
        else {
            playerNameDisplay.classList.add('wrong');
        }
        card.append(textDisplay, playerNameDisplay, pointsDisplay);
        return card;
    }

    onAnswerSelect(ev) {
        const button = ev.target || ev.srcElement;
        const answer = button.getAttribute('value');
        let amount = 0;
        if (this.jeopardyService.isDoubleJeopardy()) {
            amount = button.parentNode.getElementsByTagName('input')[0].value;
            if (amount.toString().length === 0) {
                amount = 0;
            }
            else {
                amount = parseInt(amount);
                if (Number.isNaN(amount)) {
                    alert('invalid input');
                    return;
                }
            }

            const canMakeDoubleJeopard = this.jeopardyService.canMakeDoubleJeopard(amount);
            if (!canMakeDoubleJeopard) {
                alert('Insufficient balance');
                return;
            }
        }
        const isAnswerCorrect = this.jeopardyService.onPlayerAnswer(answer, amount);
        button.parentNode.innerHTML = isAnswerCorrect ? 'Correct!' : 'Incorrect :(';
    }

    appendQuestionToColumn(column, question) {
        let card = null;
        if (question.status === QUESTION_STATUS.OPEN) {
            card = this.getOpenCard(question);
        }
        else if (question.status === QUESTION_STATUS.INIT) {
            card = this.getInitCard(question);
        }
        else if (question.status === QUESTION_STATUS.ANSWERED) {
            card = this.getAnsweredCard(question);
        }

        column.append(card);
    }

    onInitCardClick(ev) {
        const card = ev.target || ev.srcElement;
        const questionUuid = card.getAttribute('data-question-uuid');
        this.jeopardyService.onPlayerQuestionSelect(questionUuid);
    }

    renderPlayingUI() {
        const categories = this.jeopardyService.getCategories();
        categories.map(category => {
            const questions = this.jeopardyService.getQuestions(category);
            const column = this.createColumn(category);
            questions.map(question => {
                this.appendQuestionToColumn(column, question);
            });
        });
    }

    renderGameOverUI() {
        const winners = this.jeopardyService.getWinners();
        const winnerNames = winners.map(x => x.name).join(',');
        this.game.innerHTML = `${winnerNames} has won the game!`
    }

    clearGame() {
        this.game.innerHTML = '';
        this.points.innerHTML = '';
    }

    getPointsRow(pointsEntry) {
        const tr = document.createElement('tr');
        const nameTd = document.createElement('td');
        const pointsTd = document.createElement('td');
        nameTd.innerHTML = pointsEntry.name;
        pointsTd.innerHTML = `$${pointsEntry.score}`;
        tr.appendChild(nameTd)
        tr.appendChild(pointsTd)
        return tr;
    }

    getPointsHeader() {
        const th = document.createElement('th');
        const nameTd = document.createElement('td');
        const pointsTd = document.createElement('td');
        nameTd.innerHTML = 'Player';
        pointsTd.innerHTML = 'Score';
        th.appendChild(nameTd)
        th.appendChild(pointsTd)
        return th;
    }

    renderPoints() {
        const pointsArr = this.jeopardyService.getScores();
        this.points.append(this.getPointsHeader(), ...pointsArr.map(this.getPointsRow))
    }

    renderLoadingUI() {
        this.game.innerHTML = 'Loading...'
    }

    renderUI(gameStatus) {
        if (gameStatus === GAME_STATUS.LOADING) {
            return this.renderLoadingUI();
        }
        this.clearGame();
        this.renderPoints();
        switch (gameStatus) {
            case GAME_STATUS.PLAYER_SELECTION:
            case GAME_STATUS.PLAYER_ANSWERING:
                return this.renderPlayingUI();
            case GAME_STATUS.GAME_OVER:
                return this.renderGameOverUI();
        }
    }
}

async function init(numberOfPlayers, numberOfCategories, numberOfQuestions) {
    numberOfPlayers = numberOfPlayers || 3;
    numberOfCategories = numberOfCategories || 6;
    numberOfQuestions = numberOfQuestions || 5;
    const jeopardyDelivery = new JeopardyDelivery(numberOfPlayers, numberOfCategories, numberOfQuestions);
    await jeopardyDelivery.init()
};

document.getElementById('start').addEventListener('click', async () => {
    const numberOfPlayers = document.getElementById('playersInput').value;
    const numberOfCategories = document.getElementById('categoriesInput').value;
    const numberOfQuestions = document.getElementById('questionsInput').value;
    await init(numberOfPlayers, numberOfCategories, numberOfQuestions);
});

const urlParams = new URLSearchParams(window.location.search);
let numberOfPlayers = urlParams.get('numberOfPlayers');
let numberOfCategories = urlParams.get('numberOfCategories');
let numberOfQuestions = urlParams.get('numberOfQuestions');
if (numberOfPlayers && numberOfCategories && numberOfQuestions) {
    numberOfPlayers = parseInt(numberOfPlayers)
    numberOfCategories = parseInt(numberOfCategories)
    numberOfQuestions = parseInt(numberOfQuestions)
    init(numberOfPlayers, numberOfCategories, numberOfQuestions)
}