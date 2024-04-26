class PlayerInfoStore {
    constructor(numberOfPlayers) {
        this.players = {};
        for (let i = 0; i < numberOfPlayers; i++) {
            this.players[generateUUID()] = {
                score: 0,
                name: `P${i + 1}`,
            }
        }
    }

    getScores() {
        return Object.values(this.players).sort((a, b) => b.score - a.score);
    }

    getPlayerName(playerUuid) {
        return this.players[playerUuid].name;
    }

    getPlayers() {
        return Object.keys(this.players);
    }

    addScore(playerId, amount) {
        this.players[playerId].score += amount;
    }

    subtractScore(playerId, amount) {
        this.players[playerId].score -= amount;
        if (this.getScore(playerId) < 0) {
            this.setScore(playerId, 0)
        }
    }

    setScore(playerId, score) {
        this.players[playerId].score = score;
    }

    getScore(playerId) {
        return this.players[playerId].score;
    }

    getLeadingScorePlayers() {
        const playersInSorted = Object.values(this.players).sort((a, b) => b.score - a.score);
        const leadingPlayers = [playersInSorted[0]];
        for (let i = 1; i < playersInSorted.length; i++) {
            if (leadingPlayers[0].score !== playersInSorted[i].score) {
                break;
            }
            leadingPlayers.push(playersInSorted[i]);
        }
        return leadingPlayers;
    }
}