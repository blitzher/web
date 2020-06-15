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

var __crsImg = new Image;
__crsImg.src = "assets/crs.png"

HIVEpiece = {
    antImg : __antImg,
    hopImg : __hopImg,
    beeImg : __beeImg,
    btlImg : __btlImg,
    mosImg : __mosImg,
    spiImg : __spiImg,
    crsImg : __crsImg,

    all : [
        __antImg,
        __hopImg,
        __beeImg,
        __btlImg,
        __mosImg,
        __spiImg,
        __crsImg
    ]
};

getPieceImgByName = (name) => {
    var img;
    switch (name) {
        case 'ant': img = __antImg; break;
        case 'hop': img = __hopImg; break;
        case 'bee': img = __beeImg; break;
        case 'btl': img = __btlImg; break;
        case 'mos': img = __mosImg; break;
        case 'spi': img = __spiImg; break;
        case 'crs': img = __crsImg; break;
    };
    return img;
};

getPieceNameByImg = (img) => {
    var name;
    switch (img) {
        case __antImg: name = 'ant' ; break;
        case __hopImg: name = 'hop' ; break;
        case __beeImg: name = 'bee' ; break;
        case __btlImg: name = 'btl' ; break;
        case __mosImg: name = 'mos' ; break;
        case __spiImg: name = 'spi' ; break;
        case __crsImg: name = 'crs' ; break;
    };
    return name;
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

var menuWidth = 200;
var gridRad = 3;
var hexSize = 0;
var menuHexSize = 35;
var tileMul = 1.3;
var allPositions = [];
var allIndex = 0;
var adjacencyMatrix = [];
var mpos = {x: 0, y: 0}
var menuCoordinates = [];

var selectedPiece = undefined;
var hovering = undefined;
var placing = undefined;

var serverData = {
    clientId : 0,
    matchId : 0
};

var player = 0;

var boardState = [];
// debugging purposes
var boardState = [];

const sin30 = 1/2;
const cos60 = sin30;
const sin60 = Math.sqrt(3)/2;
//#endregion
//#region init and termination
async function init() {
    
    params = getParams(window.location.href);

    // get client Id from server
    const response = await fetch("/api/getClientId/")
    const clientId = await response.json();
    serverData.clientId = clientId.id;
    
    // if match id isn't supplied, initalise a new match
    if (!params.match) {
        
        // send client id to server
        const match = await post("/api/getNewMatch/", 
                {id: serverData.clientId});
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
    link = document.getElementById('link').textContent = window.location.host + "?match=" + serverData.matchId
};

function terminate() {

};
//#endregion
//#region update functions
// sync with server
async function sync() {
    serverBoardState = await post("/api/getBoardState", {matchId: serverData.matchId});
    boardState = serverBoardState;
};

function update() {
    // update board size depending on til placements
    pieceIndices = []
    boardState.forEach(piece => {
        pieceIndices.push(piece.index);
    });
    maxIndex = Math.max(...pieceIndices);

    // increase grid size if a piece is on the edge
    gridRad = getSphereByIndex(maxIndex) + 1;
    // but limit it to 2
    gridRad = Math.max(gridRad, 2)
    
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

function mouseClick(event) {    

    switch (event.button) {
        case (0): // left mouse
            // get all pieces in the index which is being hovered
            selectedNow = getPieceIndexByIndex(getIndexByPos(mpos));
            
            // figure out if hovering an option in the menu
            for (let i = 0; i < menuCoordinates.length; i++) {
                const pos = menuCoordinates[i];
                if (distance(pos, mpos) <= menuHexSize) {
                    selectedPiece = true;
                    placing = HIVEpiece.all[i]
                };
            };
            

            // if hovering something unoccupied and selected something
            if (movePiece()) {
            }
            else { // if nothing is selected, or 
                selectedPiece = selectedNow;
            };
            break;
            

        case (2): // right mouse
            selectedPiece = undefined;
            placing = undefined;
    };
};

canvas.addEventListener('mousedown', mouseClick); 
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

    // get the tile being hovered
    selectedNow = getPieceIndexByIndex(getIndexByPos(mpos));
            
    // if selected something unoccupied and selected something
    
    if (selectedPiece !== undefined || placing !== undefined) {
    
        if (getIndexByPos(mpos) === undefined) {
            return;
        }

        if (placing !== undefined) {
            // if trying to place a new piece
            
            if (getPieceNameByImg(placing) === "crs") {
                
                if (selectedNow !== undefined) {
                    boardState = boardState.filter(item => item !== boardState[selectedNow])
                    placing = undefined;
                }
            }
            else {
                piece = {
                    owner:player,
                    type: getPieceNameByImg(placing),
                    index:getIndexByPos(mpos)
                };
                boardState.push(piece);
            }

        } else {
            // if moving a piece
            if (selectedNow === undefined) {
                boardState[selectedPiece].index = getIndexByPos(mpos);
            }
        } 
        
        selectedPiece = undefined;

        // update the server boardState
        post("/api/updateBoardState/", 
        {matchId: serverData.matchId, boardState: boardState});
        return true;
    };
};

async function post(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return await response.json() // parses JSON response into native JavaScript objects
}

function getParams (url) {
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
        x: (canvas.width-menuWidth)/2,
        y: canvas.height/2
    }];
    for (let sphere = 1; sphere < gridRad; sphere++) {
        amountOfHexes = 6*sphere

        // start by moving out, right
        hexX = (canvas.width-menuWidth)/2 + (sphere * hexSize * 1.7);
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

// return all pieces in at an index
function getPiecesByIndex(index) {
    inIndex = [];
    boardState.forEach(piece => {
        if (piece.index === index) {
            inIndex.push(piece);
        };
    });
    return inIndex;
};

// return one piece at an index
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

// return the index in the "boardState" array from a board index
function getPieceIndexByIndex(boardIndex) {
    for (let index = 0; index < boardState.length; index++) {
        const piece = boardState[index];
        if (piece.index === boardIndex) {
            return index
        };
    };
};

//#endregion
//#region draw functions
function drawLine(srt, end, color, fill) {
    fill = fill === undefined ? true : false;

    if (color !== undefined) {
        ctx.fillStyle = color;
    }

    ctx.beginPath();

    ctx.moveTo(srt.x, srt.y);
    ctx.lineTo(end.x, end.y);

    ctx.closePath();

    ctx.stroke();
}

function drawCircle(x, y, rad, color, fill) {
    fill = fill === undefined ? true : false;

    if (color !== undefined) {
        ctx.fillStyle = color;
    }

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

function drawImage(img, x, y, sx, sy) {
    pos = {
        x: x - sx / 2,
        y: y - sy / 2
    }
    ctx.drawImage(img, pos.x + 1, pos.y, scale.x, scale.y)
};

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
        if (selectedPiece !== undefined && index === boardState[selectedPiece].index) {
            drawCircle(hex.x, hex.y, (hexSize/tileMul)+ 1, "#FF0000", false)
        }
    }
};

function drawPieces() {
    for (let i = 0; i < boardState.length; i++) {
        const piece = boardState[i];

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
        if (selectedPiece === i) {
            center = mpos;
        }

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

    };
};

function drawMenu() {
    evenlySpace = (srt, end, amount) => {
        var output = [];
        const range = end - srt;
        const step = (range) / (amount + 1);

        for (let i = 0; i < amount; i++) {
            output.push(srt + (i+1) * step);
        };
        return output;
    };

    menuCoordinates = [];
    evenlySpace(0, canvas.height, HIVEpiece.all.length).forEach( (yPos) => {
        menuCoordinates.push( {x:canvas.width - (menuWidth / 2), y: yPos});
    });

    for (i = 0; i < HIVEpiece.all.length; i++) {
        image = HIVEpiece.all[i]

        scale = {
            x: menuHexSize * 1.3,
            y: menuHexSize * 1.3
        }

        pos = {
            x: menuCoordinates[i].x - scale.x / 2,
            y: menuCoordinates[i].y - scale.y / 2
        }
        
        
        // the raw draw calls
        drawLine({x:canvas.width - menuWidth, y:0}, {x:canvas.width - menuWidth, y:canvas.height});
        drawCircle(menuCoordinates[i].x - 1, menuCoordinates[i].y, menuHexSize, 0, false)
        ctx.drawImage(image, pos.x, pos.y, scale.x, scale.y);
    };
    if (placing !== undefined) {
        
        ctx.drawImage(placing, mpos.x-scale.x/2, mpos.y-scale.y/2, scale.x, scale.y)
    }
};

function draw() {
    
    ctx.clearRect(0,0, canvas.width, canvas.height);
    drawCircle(900, 200, 30, "#FF0000");
    drawGrid();
    drawPieces();
    drawMenu();
};

//#endregion
//#endregion


// main game loop
async function mainLoop() {
    update()
    draw()
};

async function main() {
    await init();
    setInterval(sync);
    setInterval(mainLoop, 20);
};

main();