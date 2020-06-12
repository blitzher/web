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

class HIVEpiece {

    static antImg = __antImg;
    static hopImg = __hopImg;
    static beeImg = __beeImg;
    static btlImg = __btlImg;
    static mosImg = __mosImg;
    static spiImg = __spiImg;

    constructor(index, owner) {
        this.index = index;
        this.owner = owner;
    };

    static fromName(pieceName) {
        switch (pieceName) {
            case ("ant"): return Ant;
        };
    };
};

class Ant extends HIVEpiece {

    static get name() {
        return "ant";
    };

    static get image() {
        return ant;
    };
};

//#endregion

//#region game

//#region setup
var canvas = document.getElementById("screen");

var ctx = canvas.getContext("2d");
var gridRad = 3;
var hexSize = 0;
var tileMul = 1.5;
var allPositions = [];
var allIndex = 0;
var adjacencyMatrix = [];

var selected = -1;
var hovering = -1;
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
function init() {

};

function terminate() {

};
//#endregion
//#region update functions
// sync with server
function sync() {

};

function update() {
    // update hex sizes to fit screen
    shortestSide = Math.min(canvas.width, canvas.height)
    hexSize = shortestSide / (gridRad * 3.5);

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

function getAllIndex() {
    amount = 0;
    for (let i = 1; i < gridRad; i++) {
        amount += i * 6
    };
    return amount;
};

// function getAllCombinations(...numbers) {
//     output = []
//     numbers.forEach(num1 => {
//         numbers.forEach(num2 => {
//             output.push([num1, num2])
//         });
//     });
// }

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

//#endregion
//#region draw functions
function drawCircle(x, y, rad, color) {
    ctx.fillStyle = color;
    ctx.beginPath();

    ctx.arc(x, y, rad, 0, Math.PI*2)

    ctx.closePath();
    ctx.fill();
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
            ctx.fillStyle = "#909090";
            ctx.beginPath();

            ctx.arc(hex.x, hex.y, hexSize / (tileMul * 1.5), 0, Math.PI*2)

            ctx.closePath();
            ctx.fill();
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

        }

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
init();
setInterval(sync,  100);
setInterval(update, 20);
setInterval(draw,   20);
terminate();
