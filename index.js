const express = require("express");

const app = express();
const port = 8080;

// initalise and listen on port
app.listen(port, () => console.log('listening at ' + port));

// publicise files in /public/
app.use(express.static(__dirname + "/public/"));

const api = require("./api")
api(app);

app.post('/api/get_identifyer', (req, res) => {
    console.log(req.body);
    req.body.identifyer = getIdentifyer();
    res.status(200).send(req.body);
});

function getIdentifyer() {
    return 1000;
}