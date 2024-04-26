const supportedCategories = {
    "General Knowledge": "9",
    "Entertainment: Books": "10",
    "Entertainment: Film": "11",
    "Entertainment: Music": "12",
    "Entertainment: Musicals &amp; Theatres": "13",
    "Entertainment: Television": "14",
    "Entertainment: Video Games": "15",
    "Entertainment: Board Games": "16",
    "Science &amp; Nature": "17",
    "Science: Computers": "18",
    "Science: Mathematics": "19",
    "Mythology": "20",
    "Sports": "21",
    "Geography": "22",
    "History": "23",
    "Politics": "24",
    "Art": "25",
    "Celebrities": "26",
    "Animals": "27",
    "Vehicles": "28",
    "Entertainment: Comics": "29",
    "Science: Gadgets": "30",
    "Entertainment: Japanese Anime &amp; Manga": "31",
    "Entertainment: Cartoon &amp; Animations": "32",
};

function getRandomSupportedCategories(numberOfCategories) {
    const randomCategoriesKeys = Object.keys(supportedCategories).sort(() => .5 - Math.random()).slice(0, numberOfCategories);
    let randomSupportedCategories = {};
    for (let i = 0; i < randomCategoriesKeys.length; i++) {
        const category = randomCategoriesKeys[i];
        randomSupportedCategories[category] = supportedCategories[category];
    }
    return randomSupportedCategories;
}

class QuestionsProvider {

    constructor(numberOfCategories, difficultyLevels, numberOfQuestionsPerDifficulty) {
        this.categories = getRandomSupportedCategories(numberOfCategories);
        this.difficultyLevels = difficultyLevels;
        this.numberOfQuestionsPerDifficulty = numberOfQuestionsPerDifficulty;
    }


    async getQuestionForGenreAndDifficulty(amount, genreId, difficulty) {
        // return myFetch(genreId, difficulty)
        return fetch(`https://opentdb.com/api.php?amount=${amount}&category=${genreId}&difficulty=${difficulty}&type=boolean`)
            .then(response => response.json())
            .then(data => {
                return data.results ? data.results : [];
            });
    }

    getCategories() {
        return Object.keys(this.categories);
    }

    async getQuestions() {
        const questions = {};
        const questionsPromises = [];
        const questionsCategoriesRequestArr = [];
        const questionsDifficultyRequestArr = [];
        for (let categoryName in this.categories) {
            const categoryId = this.categories[categoryName];
            questions[categoryName] = {};
            for (let difficultyIdx in this.difficultyLevels) {
                const difficulty = this.difficultyLevels[difficultyIdx];
                const numberOfQuestions = this.numberOfQuestionsPerDifficulty[difficulty];
                if (numberOfQuestions === 0) {
                    continue;
                }

                questionsCategoriesRequestArr.push(categoryName);
                questionsDifficultyRequestArr.push(difficulty);
                questionsPromises.push(this.getQuestionForGenreAndDifficulty(numberOfQuestions, categoryId, difficulty))
            }
        }
        const results = await Promise.all(questionsPromises);

        for (let i = 0; i < results.length; i++) {
            const categoryName = questionsCategoriesRequestArr[i];
            const difficulty = questionsDifficultyRequestArr[i];
            questions[categoryName][difficulty] = results[i].map(question => {
                question.uuid = generateUUID();
                question.categoryId = this.categories[categoryName];
                return question;
            });
        }

        return questions;
    }
}