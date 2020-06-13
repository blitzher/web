//#region pieces

// load images
var __antImg = new Image;
__antImg.src = "assets/ant.png";

var __hopImg = new Image;
__hopImg.src = "assets/hop.png";

var __beeImg = new Image;
__beeImg.src = "assets/bee.png";

var __btlImg = new Image;
__btlImg.src = "assets/btl.png";

var __mosImg = new Image;
__mosImg.src = "assets/mos.png";

var __spiImg = new Image;
__spiImg.src = "assets/spi.png";

HIVEpiece = {
    antImg : __antImg,
    hopImg : __hopImg,
    beeImg : __beeImg,
    btlImg : __btlImg,
    mosImg : __mosImg,
    spiImg : __spiImg
};


//#endregion
//#region game
//#region setup
var canvas = document.getElementById("screen");

// disable default right click
canvas.oncontextmenu = function (e) {
    e.preventDefault();
};

var ctx = canvas.getContext("2d");
var gridRad = 3;
var hexSize = 0;
var tileMul = 1.3;
var allPositions = [];
var allIndex = 0;
var adjacencyMatrix = [];
var mpos = {x: 0, y: 0}

var selectedPiece = undefined;
var hovering = undefined;

var serverData = {
    clientId : 0,
    matchId : 0
};

var player = 0;

var occupied = [];
// debugging purposes
var occupied = [
    {
        'owner': 1,
        'type' : 'ant',
        'index': 0
    },
    {
        'owner': 2,
        'type' : 'hop',
        'index': 3
    },
    {
        'owner': 1,
        'type' : 'bee',
        'index': 1
    },
    {
        'owner': 2,
        'type' : 'ant',
        'index': 9
    }
];

const sin30 = 1/2;
const cos60 = sin30;
const sin60 = Math.sqrt(3)/2;
//#endregion
//#region init and termination
async function init() {
    
    params = getParams(window.location.href);

    // get client Id from server
    const response = await fetch("/api/getClientId")
    const clientId = await response.json();
    serverData.clientId = clientId.id;
    
    // if match id isn't supplied, initalise a new match
    if (!params.match) {
        
        // send client id to server
        const response = await fetch("/api/getNewMatch", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({id: serverData.clientId}) 
        });
        const match = await response.json();
        serverData.matchId = match.id
        player = 1;
    }
    else {
        // else, matchid is in parameters
        serverData.matchId = params.match
        player = 2;
    }
    
    // update <h1> to reflect current game
    head = document.getElementById('h1').textContent = "Hive #" + serverData.matchId;

    // TODO: update <link> tag to reflect the same
};

function terminate() {

};
//#endregion
//#region update functions
// sync with server
function sync() {
    
};

function update() {
    // update board size depending on til placements
    pieceIndices = []
    occupied.forEach(piece => {
        pieceIndices.push(piece.index);
    });
    maxIndex = Math.max(...pieceIndices);

    // increase grid size if a piece is on the edge
    gridRad = getSphereByIndex(maxIndex) + 1;
    
    // decrease hex size if grid size increases
    shortestSide = Math.min(canvas.width, canvas.height)
    hexSize = shortestSide / (gridRad * 3.5);

    // 
    allIndex = getAllIndex();
    allPositions = getAllPosition();
};

// handle mouse movement
canvas.addEventListener('mousemove', function(event) {
    var rect = canvas.getBoundingClientRect();
    mpos = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top + 0.875
    }

    hovering = getIndexByPos(mpos);

    if (typeof(hovering) == typeof(0)) {
        canvas.style.cursor = 'pointer'
    }
    else {
        canvas.style.cursor = 'default'
    }
});

function mouseDown(event) {    

    switch (event.button) {
        case (0): // left mouse
            // get all pieces in the index which is being hovered
            selectedNow = getPieceByIndex(getIndexByPos(mpos));
            
            // if selected something unoccupied and selected something
            if (movePiece()) {
                
            }
            else {
                selectedPiece = selectedNow;
            };
            break;
            

        case (2): // right mouse
            selectedPiece = undefined;
    };
};

canvas.addEventListener('mousedown', mouseDown); 
canvas.addEventListener('mouseup', (e) => {
    movePiece()
});

//#endregion
//#region helper functions
function rotateBy60(x, y, times = 1) {
    // rotate a vector by 60 degrees
    
    newX = x * cos60 - y * sin60;
    newY = x * sin60 + y * cos60;

    if ( times > 1 ) {
        return rotateBy60(newX, newY, times=times-1)
    }
    else {
        return [newX, newY]
    }
};

function distance(point1, point2) {
    // compute the euclidean distance between two points
    distSquared = (point2.x - point1.x)**2 + (point2.y - point1.y)**2;
    return Math.sqrt(distSquared);
};

function movePiece() {
    // attempt to move a piece, checking for stuff before
    selectedNow = getPieceByIndex(getIndexByPos(mpos));
            
    // if selected something unoccupied and selected something
    
    if (!selectedNow && selectedPiece) {
    
        if (getIndexByPos(mpos) === undefined) {
            return;
        }

        selectedPiece.index = getIndexByPos(mpos);
        selectedPiece = undefined;
        return true;
    };
};

var getParams = function (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

function getSphereByIndex(index) {

    getIndexForSphere = (index) => {
        amount = 0;
        for (let i = 1; i < index; i++) {
            amount += i * 6
        };
        return amount;
    };

    sphereIndex = 0;
    while (index > getIndexForSphere(sphereIndex)) {
        sphereIndex++;
    };
    return sphereIndex;
};

function getAllIndex() {
    
    amount = 0;
    for (let i = 1; i < gridRad; i++) {
        amount += i * 6
    };
    return amount;
};

function getAllPosition() {
    positions = [{
        x: canvas.width/2,
        y: canvas.height/2
    }];
    for (let sphere = 1; sphere < gridRad; sphere++) {
        amountOfHexes = 6*sphere

        // start by moving out, right
        hexX = canvas.width/2 + (sphere * hexSize * 1.7);
        hexY = canvas.height/2;

        // inital translation direction
        [translationX, translationY] = rotateBy60(1, 0, times=2);
        
        // keep count on how many hexes drawn in sphere
        count = 1;
        // draw hexes in sphere
        for (let hex = 0; hex < amountOfHexes; hex++) {
            // if index === hexIndex, return hexX, hexY
            positions.push({
                    'x': Math.round(hexX),
                    'y': Math.round(hexY)
                }
            );

            // translate acording to current translation vector
            hexX += translationX * hexSize * 1.7;
            hexY -= translationY * hexSize * 1.7;
            
            // if reached a corner, rotate translation vector
            if (count === sphere) {
                count = 0;

                [translationX, translationY] = rotateBy60(translationX, translationY);
            }
            count++;
        }
    }
    return positions;
};

function getPosByIndex(index) {
    // convert an index to a position in grid
    return allPositions[index];
};

function getIndexByPos(pos) {
    for (let i = 0; i < allPositions.length; i++) {
        hex = allPositions[i];
        if (distance(pos, hex) * tileMul <= hexSize) {
            return i;
        };
    };
};

function getPiecesByIndex(index) {
    inIndex = [];
    occupied.forEach(piece => {
        if (piece.index === index) {
            inIndex.push(piece);
        };
    });
    return inIndex;
};

function getPieceByIndex(index) {
    piecesInIndex = getPiecesByIndex(index)

    if (piecesInIndex.length === 1) {
        return piecesInIndex[0];
    };

    pieceInIndex = undefined;
    piecesInIndex.forEach(piece => {
        if (piece.owner !== player) {
            return;
        };
        if (piece.type != 'btl') {
            return
        };
        pieceInIndex = piece;
    });
};

//#endregion
//#region draw functions
function drawCircle(x, y, rad, color, fill) {
    fill = fill || true;

    ctx.fillStyle = color;
    ctx.beginPath();

    ctx.arc(x, y, rad, 0, Math.PI*2)

    ctx.closePath();

    if (fill) {
        ctx.fill();
    }
    else {
        ctx.stroke();
    }
}

function drawHex(x, y, fill = true) {

    var fill = fill || false;
    
    ctx.beginPath();

    ctx.arc(x, y, hexSize/tileMul, 0, Math.PI*2)

    ctx.closePath();
    ctx.stroke();
};

function drawGrid() {

    // draw each sphere
    for (let index = 0; index < allPositions.length; index++) {
        const hex = allPositions[index];
        drawHex(hex.x, hex.y)
        if (index === hovering) {
            drawCircle(hex.x, hex.y, hexSize / (tileMul * 1.5), "#909090")
        }
        if (selectedPiece && index === selectedPiece.index) {
            drawCircle(hex.x, hex.y, (hexSize/tileMul)+ 1, "#FF0000", false)
        }
    }
};

function drawPieces() {
    occupied.forEach(piece => {
        var image;
        switch (piece.type) {
            case ("ant"): image = HIVEpiece.antImg; break;
            case ("hop"): image = HIVEpiece.hopImg; break;
            case ("bee"): image = HIVEpiece.beeImg; break;
            case ("btl"): image = HIVEpiece.btlImg; break;
            case ("mos"): image = HIVEpiece.mosImg; break;
            case ("spi"): image = HIVEpiece.spiImg; break;
        }

        center = getPosByIndex(piece.index);
        scale = {
            x: hexSize / tileMul,
            y: hexSize / tileMul
        }

        pos = {
            x: center.x - scale.x / 2,
            y: center.y - scale.y / 2
        }

        if (piece.owner === 1) {
            drawCircle(center.x, center.y, ( hexSize / tileMul), "#e0e0e0")
        };
        if (piece.owner === 2) {
            drawCircle(center.x, center.y, ( hexSize / tileMul), "#404040")
        };

        ctx.drawImage(image, pos.x + 1, pos.y, scale.x, scale.y)

    });
}

function draw() {
    
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawGrid();
    drawPieces();
};

//#endregion
//#endregion
// main 
async function main() {
    await init();
    setInterval(sync,  100);
    setInterval(update, 20);
    setInterval(draw,   20);
};

main();
