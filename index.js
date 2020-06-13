const express = require("express");
const bodyParser = require("body-parser")

const app = express();
const port = process.env.PORT || 8080;

var allMatches = {}
var allClients = []

// initalise and listen on port
app.listen(port, () => console.log('listening at ' + port));

// publicise files in /public/
app.use(express.static(__dirname + "/public/"));

// use body parser for json
app.use(bodyParser.json());

app.get("/{match}", (req, res) => {
    res.send(app.get("/"));
});

app.get('/api/getClientId/', (req, res) => {
    body = {id : getClientId() }
    res.status(200).send(body);

    console.log('[?] Got new client: ' + body.id)

});

app.post('/api/getNewMatch/', (req, res) => {
    clientId = req.body.id;
    matchId = getMatchId();

    console.log("[?] Starting new match for: " + clientId + ", matchId: " + matchId)

    match = {
        id : matchId,
        p1Id : clientId,
        p2Id : -1,
        boardState : []
    };
    allMatches[id] = match;
    res.status(200).send(match);
});

app.post('/api/getBoardState/', (req, res) => {
    matchId = req.body.matchId;
    match = getMatchById(matchId);
    res.status(200).send(match.boardState);
});

app.post('/api/updateBoardState/', (req, res) => {
    matchId = req.body.matchId;
    match = getMatchById(matchId);
    match.boardState = req.body.boardState;
    res.status(200).send({id:matchId});
});

function getMatchById(id) {
    id = id.toString();
    return allMatches[id];
};

function getClientId() {
    id = Math.round(Math.random() * 100);

    while (id in allClients) {
        id = Math.round(Math.random() * 100);
    };

    allClients.push(id);

    return id
};

function getMatchId() {
    id = Math.round(Math.random() * 100);

    allGameIds = Object.keys(allMatches);

    while (id in allMatches) {
        id = Math.round(Math.random() * 100);
    };

    return id
};