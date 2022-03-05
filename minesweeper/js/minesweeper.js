//Author: Matthew Robinson 
//email: matthew.robinson4123@gmail.com


var time = 0;
var intervalID;                                                 //create global variable in order to clear interval at game end

function buildGrid() {

    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    var board = getBoard();                                     //get board size and number of mines based on difficulty
    document.getElementById("flagCount").innerHTML = board.mines;

    // Build DOM Grid
    var tile;
    for (var y = 0; y < board.rows; y++) {
        for (var x = 0; x < board.columns; x++) {
            tile = createTile(x,y);
            grid.appendChild(tile);
        }
    }
    
    var style = window.getComputedStyle(tile);

    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));
    
    grid.style.width = (board.columns * width) + "px";
    grid.style.height = (board.rows * height) + "px";

    populateMines(board);                                       //add mines to blank board
    setTileValues(board);                                       //set number value of tiles after mines added
}



function createTile(x,y) {
    var tile = document.createElement("div");
    
    tile.setAttribute("id", `${x},${y}`);                       //create a unique coord id

    tile.classList.add("tile");
    tile.classList.add("hidden");

    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mousedown", smileyLimbo ); //any click changes smiley
    tile.addEventListener("mouseup", handleTileClick ); // All Clicks

    return tile;
}



function startGame() {
    buildGrid();
    var smiley = document.getElementById("smiley");
    if(smiley.classList.contains("face_win"))
        smiley.classList.remove("face_win");
    else if(smiley.classList.contains("face_lose"))
        smiley.classList.remove("face_lose");
}



function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}



function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}



function smileyLimbo(){
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_limbo"); 
}



function handleTileClick(event) {

    var tile = event.currentTarget;                                 //get tile clicked on
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_limbo");                          //return smiley to normal
    
    if(!firstClick()){                                              //first click is not on mine or numbered tile
        // Left Click
        if (event.which === 1) {
            //reveal the tile
            if(!tile.classList.contains("flag")){                   //no flag
                tile.classList.remove("hidden");                    //reveal tile
                if(checkRegularTile(tile))                          //check for blank tile
                    revealTiles(tile);                              //reveal tiles around blank tile
                else if(tile.classList.contains("mine")){        
                    tile.classList.add("mine_hit");                 //reveal mine, lose game
                    loseGame();
                }
            }
        }

        // Middle Click
        else if (event.which === 2) {
            //try to reveal adjacent tiles
            if(!tile.classList.contains("hidden")){                 //clicked on revealed number tile
                if(tile.hasAttribute("numbered")){
                    middleClickReveal(tile);
                }
            }
        }

        // Right Click
        else if (event.which === 3) { 
            //place or remove flag
            let count = parseInt(document.getElementById("flagCount").innerHTML);
            if(tile.classList.contains("hidden"))                       //places flag only if tile is still hidden
                if(tile.classList.contains("flag")){
                        tile.classList.remove("flag");
                        document.getElementById("flagCount").innerHTML = count + 1;         //update remaining mines count on page
                }
                else{
                    if(count > 0){
                        tile.classList.add("flag");
                        document.getElementById("flagCount").innerHTML = count - 1;
                    }
                }
            
        }
    }
    else{
        if(checkRegularTile(tile)){                                        //first click on blank tile
            startTimer();
            tile.classList.remove("hidden");
            revealTiles(tile);
        }
    }
    checkWin();      
}



function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;

    return difficulty;
}




function startTimer() {
    window.clearInterval(intervalID);                                       //resets timer interval
    timeValue = 0;
    intervalID = window.setInterval(onTimerTick, 1000);
}

function onTimerTick() {
    timeValue++;
    updateTimer();
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}

function stopTimer(){
    window.clearInterval(intervalID);
}



//Change the game layout based on the difficulty rating selected by the player
function getBoard() {                                                       
    var difficulty = setDifficulty();

    const board = {
        rows: 1,
        columns: 1,
        mines: 0
    };

    switch(difficulty){
        case 0:
            board.rows = 9;
            board.columns = 9;
            board.mines = 10;
            break;
        case 1:
            board.rows = 16;
            board.columns = 16;
            board.mines = 40;
            break;
        case 2:
            board.rows = 16;
            board.columns = 30;
            board.mines = 99;
            break;
    }

    return board;
}



function revealTiles(tile){
    var board = getBoard();
    const coord = tile.id.split(",");                                   //get x and y values of tile in order to check adjacency
    let x = parseInt(coord[0]);
    let y = parseInt(coord[1]);
    for(var i = y-1; i <= y+1; i++){                                        //looping through adjacent tiles
        for(var j = x-1; j <= x+1; j++){
            if(j >= 0 && j < board.columns && i >= 0 && i < board.rows){    //tiles are within the play area
                if(!(j === x && i ===y)){                                   //not the current tile
                    var newTile = document.getElementById(`${j},${i}`);     
                    if(newTile.classList.contains("hidden") && !newTile.classList.contains("flag")){
                        newTile.classList.remove("hidden");                 //reveal adjacent tile
                        if(newTile.classList.contains("mine") && !newTile.classList.contains("flag")){
                            newTile.classList.add("mine_hit");              //for middleclick purposes if flag is placed incorrectly and a mine is revealed
                            loseGame();
                        }
                        if(checkRegularTile(newTile)){                       //if adjacent tile is also blank, reveal its adjacent tiles
                            revealTiles(newTile);
                        }
                    }
                }
            }
        }
    }
}


//similar to revealTiles but only for the purpose of counting adjacent flags
function middleClickReveal(tile){
    var board = getBoard();
    var flagCount = 0;
    const coord = tile.id.split(",");
    let x = parseInt(coord[0]);
    let y = parseInt(coord[1]);
    for(var i = y-1; i <= y+1; i++){
        for(var j = x-1; j <= x+1; j++){
            if(j >= 0 && j < board.columns && i >= 0 && i < board.rows){
                if(!(j === x && i ===y)){
                    var newTile = document.getElementById(`${j},${i}`);
                    if(newTile.classList.contains("flag")){
                        flagCount++;
                    }
                }
            }
        }
    }
    if(flagCount === tileValue(tile)){                              //number of adjacent flags matches number on tile
        revealTiles(tile);                                          //reveal adjacent numbered tiles
    }
}


//add mines to the blank board
function populateMines(board){
    for(let i=0; i<board.mines; i++){
        let x = Math.floor(Math.random() * board.columns);          
        let y = Math.floor(Math.random() * board.rows);
        var tile = document.getElementById(`${x},${y}`);            //get tile at random coords
        if(!tile.classList.contains("mine")){
            tile.classList.add("mine");
        }
        else
            i--;                                                    //if tile already contained a mine, decrement counter by 1
    }
}


//set the tiles to numbered tiles based on adjacency to mines
function setTileValues(board){
    for (var y = 0; y < board.rows; y++) {
        for (var x = 0; x < board.columns; x++) {
            let mineCount = 0;
            var tile = document.getElementById(`${x},${y}`);
            if(!tile.classList.contains("mine")){
                for(var i = y-1; i <= y+1; i++){
                    for(var j = x-1; j <= x+1; j++){
                        mineCount += checkMine(j,i,board);
                    }
                }
                changeTile(tile, mineCount)
            }
        }
    }
}



function tileValue(tile){
    if(tile.classList.contains("tile_1"))
        return 1; 
    else if(tile.classList.contains("tile_2"))
        return 2; 
    else if(tile.classList.contains("tile_3"))
        return 3; 
    else if(tile.classList.contains("tile_4"))
        return 4; 
    else if(tile.classList.contains("tile_5"))
        return 5; 
    else if(tile.classList.contains("tile_6"))
        return 6;
    else if(tile.classList.contains("tile_7"))
        return 7; 
    else if(tile.classList.contains("tile_8"))
        return 8; 
    else
        return 0;
}



function changeTile(tile, count){
    if(!tile.classList.contains("mine")){
        switch(count){
            case 1:
                tile.classList.add("tile_1");
                break;
            case 2:
                tile.classList.add("tile_2");
                break;
            case 3:
                tile.classList.add("tile_3");
                break;
            case 4:
                tile.classList.add("tile_4");
                break;
            case 5:
                tile.classList.add("tile_5");
                break;
            case 6:
                tile.classList.add("tile_6");
                break;
            case 7:
                tile.classList.add("tile_7");
                break;
            case 8:
                tile.classList.add("tile_8");
                break;
        }
        tile.setAttribute("numbered", true);
    }
}



function checkMine(x, y, board){
    if(x >= 0 && x < board.columns && y >= 0 && y < board.rows){
        var tile = document.getElementById(`${x},${y}`);
        if(tile.classList.contains("mine"))
            return 1;
    }
    return 0;
}


//determines whether or not the game has begun with a valid first click on a blank tile
function firstClick(){
    var board = getBoard();
    for(var y = 0; y < board.rows; y++){
        for(var x = 0; x < board.columns; x++){
            var tile = document.getElementById(`${x},${y}`);
            if(!tile.classList.contains("hidden")){
                return false;
            }
        }
    }
    return true;
}


//checks if the tile is blank
function checkRegularTile(tile){
    return (!tile.classList.contains("flag") && !tile.classList.contains("mine") && !tile.classList.contains("tile_1") && !tile.classList.contains("tile_2") && !tile.classList.contains("tile_3") && !tile.classList.contains("tile_4") && !tile.classList.contains("tile_5") && !tile.classList.contains("tile_6") && !tile.classList.contains("tile_7") && !tile.classList.contains("tile_8"))
}


//ends the game and removes event listeners so tiles can no longer be clicked. Reveals all bomb locations and incorrect flag placements
function endGame(){
    var board = getBoard();
    stopTimer();
    for(var y = 0; y < board.rows; y++){
        for(var x = 0; x < board.columns; x++){
            var tile = document.getElementById(`${x},${y}`);
            tile.removeEventListener("mouseup", handleTileClick);
            tile.removeEventListener("mousedown", smileyLimbo);
            if(tile.classList.contains("mine") && tile.classList.contains("hidden")){
                tile.classList.remove("hidden");
            }
            if(tile.classList.contains("flag") && !tile.classList.contains("mine")){
                tile.classList.remove("flag");
                tile.classList.add("mine_marked");
                tile.classList.remove("hidden");
            }
        }
    }
}



function loseGame(){
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_lose");
    alert("KABOOM!!!!");
    alert("Thanks for playing!");
    endGame();
}


//checks to see if there are only mines left hidden
function checkWin(){
    var board = getBoard();
    var count = 0;
    for(var y = 0; y < board.rows; y++){
        for(var x = 0; x < board.columns; x++){
            var tile = document.getElementById(`${x},${y}`);
            if(tile.classList.contains("hidden")){
                count++;
            }
        }
    }
    if(count === board.mines){                          
        alert("YOU WIN!!");
        var score = document.getElementById("timer").innerHTML;
        alert(`Thanks for playing! Your time was ${score} seconds`);
        var smiley = document.getElementById("smiley");
        smiley.classList.add("face_win");
        endGame();
    }
}