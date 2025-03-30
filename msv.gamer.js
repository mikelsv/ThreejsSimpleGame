// Gamer JS - load, store, save game values.

// Set your name and versions
const gamer_project_name = "threejs_simple_game";

const gamer_project_vers = [ // New to up
    ["0.2", "30.03.2025 17:41", `Make github repository
Redesign of code and removal of unnecessary things
`],
    ["0.1", "23.03.2025 15:20", "Make project and main code"],
];


// Gamer:
// use gamer.loadGameData(); for load game data
// use gamer.gameData .value for get/set values
// use gamer.saveGameData() for save game data

// gamer.base: for base values
// gameg.init() for extended logic

let gamer = {
    base: {
        // Base values        
        speed: 5,
        range: 5
    },

    gameData: {
        new(){
            // Set base values
            for(var key in gamer.base)
                gamer.gameData[key] = gamer.base[key];

            this.shop = [];
        },

        init(){
            //this.fuel = this.fuel_max;
            //this.lives = this.lives_max;
            //this.state = STATES.LOAD;

            //this.shop = {test:123};
        }
    },
    
    loadGameData(){
        const savedData = localStorage.getItem(gamer_project_name + 'gameData');
        this.gameData.new();

        if (savedData){
            const gameData = JSON.parse(savedData); // Parsing data from a string           

            this.gameData = {
                ...this.gameData, // Existing data
                ...gameData     // New data from saved JSON
            };

            this.gameData.shop = {
                ...new Object(), // Existing data
                ...gameData.shop // New data from saved JSON
            };

            this.gameData.achieves = {
                ...new Object(), // Existing data
                ...gameData.achieves // New data from saved JSON
            };

        }

        this.gameData.init();
    },

    saveGameData(){
        localStorage.setItem(gamer_project_name + 'gameData', JSON.stringify(this.gameData));
    },

    resetGame(){
        this.gameData.new();
        this.gameData.init();
        //this.saveGameData(); <-- save after reset
    },

    mouse: {
        pressed: 0,
        pos: new KiVec2(),
        move: new KiVec2(),
        scroll: 10
    },

    tmp: [],
};