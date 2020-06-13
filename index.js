const express = require("express");
const bodyParser = require("body-parser")

const app = express();
const port = 8080;

var allGames = {}
var allClients = []

// initalise and listen on port
app.listen(port, () => console.log('listening at ' + port));

// publicise files in /public/
app.use(express.static(__dirname + "/public/"));

// use body parser
app.use(bodyParser.json());

const api = require("./api")
api(app);

app.get("/{match}", (req, res) => {
    res.send(app.get("/"));
});


app.get('/api/getClientId', (req, res) => {
    body = {id : getClientId() }
    res.status(200).send(body);

    console.log('[?] Got new client: ' + body.id)

});

app.post('/api/getNewMatch', (req, res) => {
    clientId = req.body.id;
    matchId = getMatchId();

    match = {
        id : matchId,
        p1Id : clientId,
        p2Id : -1,
        boardState : []
    };
    allGames[id] = match;
    res.status(200).send(match);
});

app.post('/api/getMatch', (req, res) => {
    matchId = req.body.matchId;
    match = getMatchById(matchId);
    res.status(200).send(match);
});

function getMatchById(id) {
    return allGames[id];
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

    allGameIds = Object.keys(allGames);

    while (id in allGames) {
        id = Math.round(Math.random() * 100);
    };

    return id
};