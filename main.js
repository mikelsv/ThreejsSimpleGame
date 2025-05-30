// ThreeJS
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from  'three/addons/loaders/GLTFLoader.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js' 
//import {SkeletonUnits} from 'three/addons/utils/SkeletonUnits.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import Stats from 'three/addons/libs/stats.module.js';
import * as YUKA from 'yuka';

// msvcore
import {mglLoadingScreen, mglFlashBorder, mglStickObject, mglAreaRing, mglSingleItems, mglGameSpawnClass, mglModelsLoader, mglHealthBar, mglTextControls} from './msv.threejs.js';

// Hero
let hero;
let cube;

// Variables
let lastTime = 0;
let gameStarted = 0;

// Loading screen
var loadingScreen = new mglLoadingScreen();

// Loader
var mglModels = new mglModelsLoader();
mglModels.setScreen(loadingScreen);

//"Pirate Ship" (https://skfb.ly/6Ez7W) by IoannSergeich is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
mglModels.loadModel('pirate_ship', './models/pirate_ship.glb');

// "Buoy" (https://skfb.ly/6XLpS) by Tyler Jorgensen is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
mglModels.loadModel('buoy', './models/buoy.glb');

// "Clown fish" (https://skfb.ly/PXsC) by rubykamen is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
mglModels.loadModel('clown_fish', './models/clown_fish.glb');

// "Sea Mine" (https://skfb.ly/o8RI7) by Bora Özakaltun is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).
mglModels.loadModel('sea_mine', './models/sea_mine.glb');

// Font
mglModels.loadModel('helvetiker_regular', 'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json');

// Single items
let singleItems = new mglSingleItems();
const singleItemsType = {
    UNKNOWN: 0,
    ENEMY: 1,
};

// Spawn
let gameSpawn = new mglGameSpawnClass();

// Text
let textControls = new mglTextControls();

// Make scene
const scene = new THREE.Scene();

// Make camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Set the initial position of the camera
//camera.position.set(3, 0.15, 10);

// Make render
//const renderer = new THREE.WebGLRenderer({ alpha: true });
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threejs') });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0x000000, 1);

// Launch the game when the models are loaded
gameStartTest();

function gameStartTest(){
    if(mglModels.isReady()){
        gameStart();
        return 1;
    }

    setTimeout(() => {
        gameStartTest();
    }, 100);
}

function gameStart(){
    console.log("Start game!", gamer_project_name, gamer_project_vers[0]);

    // Test cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
    cube = new THREE.Mesh(geometry, material);
    //scene.add(cube);

    // Hero
    const heroModel = mglModels.getModel('pirate_ship');
    if(heroModel){
        hero = heroModel.scene;
        hero.scale.set(2., 2., 2.);
        scene.add(hero);
    } else {
        const geometry = new THREE.ConeGeometry(1, 2, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5 });
        hero = new THREE.Mesh(geometry, material);
        hero.rotation.set(-Math.PI / 2, 0, 0);
        scene.add(hero);
    }

    // Text
    textControls.init(scene, camera, mglModels.getModel('helvetiker_regular'));    

    // Single Item
    singleItems.init(scene);
    
    gameReStart();

    // Spawn
    gameSpawn.init(scene);

    // Spawn area model
    const buoyModel = mglModels.getModel('buoy');
    if(buoyModel){
        buoyModel.scene.scale.set(.02, .02, .02);
        gameSpawn.setSpawnModel(buoyModel.scene);
    }

    // Spawn unit
    const unitModel = mglModels.getModel('clown_fish');
    if(unitModel){
        unitModel.scene.scale.set(.1, .1, .1);
        
        // BUG: clone model reset scale. Code name: fat fish
        gameSpawn.setUnitModel(unitModel.scene);

        //let clone = unitModel.scene.clone();

        //scene.add(unitModel.scene);
        //scene.add(clone);
    }

    gameSpawn.setUnitModel(cube);

    // Spawns
    gameSpawn.addSpawn(new KiVec2(0, 0), 5, 10, 1000);
    gameSpawn.addSpawn(new KiVec2(20, 0), 5, 10, 1000);

    // Ground
    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(1000, 1000),
        //new THREE.BoxGeometry(5, 5, 5),
        //new THREE.MeshPhongMaterial( { color: 0xcbcbcb, specular: 0x474747 } )
        new THREE.MeshBasicMaterial({ color: 0x1E90FF, transparent: false, opacity: .5, side: THREE.DoubleSide})
    );
    plane.rotation.x = - Math.PI / 2;
    scene.add( plane );


    // Lights //
    scene.add( new THREE.HemisphereLight( 0x8d7c7c, 0x494966, 3 ) );

    addShadowedLight( 1, 1, 1, 0xffffff, 3.5 );
    addShadowedLight( 0.5, 1, - 1, 0xffd500, 3 );

    // Adding display of coordinate sector
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Game started
    gameStarted = 1;

    setTimeout(() => textControls.addText("1", hero.position, "Hello world!"), 1000);

    // Hide screen
    loadingScreen.hideScreen();
}

function gameReStart(){
    gamer.gameData.health = gamer.gameData.health_max;
    gamer.gameData.dead = 0;
    hero.position.set(0, 0, 0);

    // Enemies //
    const sea_mine = mglModels.getModel('sea_mine');

    // Death callback
    let deathCall = function(item, hover, click){

        if(hover)
            item.mesh.material.color.set(0xffa500); // Change color to orange on hover
        else
            item.mesh.material.color.set(0x00ff00); // Reset to original color

        if(click){
            gameReStart();
            return true;
        }

        return false;
    };

    // Enemies callback
    let callback = function(item){
        console.log("Item " + item.id + " action!");

        gamer.gameData.health --;
        healthBar.changeHealth(gamer.gameData.health, gamer.gameData.health_max);

        if(gamer.gameData.health <= 0){
            gamer.gameData.health = 0;
            gamer.gameData.dead = 1;
            
            textControls.addText(0, hero.position, "You are dead!", deathCall);
        }

        redFlashBorder.alert();

        return true;
    };

    // Add 10 enemies //
    for (let i = 0; i <= 10; i++) {
        singleItems.addItem({
            id: i,
            group: singleItemsType.ENEMY,
            pos: singleItems.getRandomPosition(new THREE.Vector3(0, 0, 0), 10),
            pos2: new THREE.Vector3(0, -2, 0),
            range: 3,
            model: sea_mine.scene.clone(),
            callback: callback
        });
    }

}

function addShadowedLight( x, y, z, color, intensity ) {
    const directionalLight = new THREE.DirectionalLight( color, intensity );
    directionalLight.position.set( x, y, z );
    scene.add( directionalLight );

    directionalLight.castShadow = true;

    const d = 1;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;

    directionalLight.shadow.camera.near = 1;
    directionalLight.shadow.camera.far = 4;

    directionalLight.shadow.bias = - 0.002;
}


// Keyboard //
// Variables for storing key state
const keys = {
    KeyW: 0, KeyA: 0, KeyS: 0, KeyD: 0, // WASD
    ArrowLeft: 0, ArrowRight: 0, ArrowUp: 0, ArrowDown: 0// Arrows
};

// Keystroke handler
window.addEventListener('keydown', (event) => {
    keys[event.code] = true;
});

// Key release handler
window.addEventListener('keyup', (event) => {
    keys[event.code] = false;
});

// Load game values
gamer.loadGameData();

// Hero area
let heroArea = new mglAreaRing();
heroArea.init(scene, gamer.gameData.range);

let healthBar = new mglHealthBar();
healthBar.init();
healthBar.changeHealth(gamer.gameData.health, gamer.gameData.health_max);

// Controls
let stickControl = new mglStickObject();
stickControl.init(scene);

// Flasher
let redFlashBorder = new mglFlashBorder();
redFlashBorder.init(scene);

// Animation function
function animate(time) {
    requestAnimationFrame(animate);

    if(!gameStarted)
        return ;

    // Calculate the time elapsed since the last frame
    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;
    
    if(hero && !gamer.gameData.dead){
        // Movement of the object depending on the keys pressed
        let move = new KiVec2(-keys['ArrowLeft'] - keys['KeyA'] + keys['ArrowRight'] + keys['KeyD'],
            -keys['ArrowUp'] - keys['KeyW'] + keys['ArrowDown'] + keys['KeyS'])        

        // Mouse movement
        if(!move.length())
            move = gamer.mouse.move;

        // Limit maximum speed to 1
        if(move.length() > 1)
            move = move.normalize();
        
        // Multiply by the player's speed
        move = move.multiply(gamer.gameData.speed * deltaTime);
        
        // Turn the player in the direction of movement
        if(move.length())
            hero.rotation.y = Math.atan2(move.x, move.y) - Math.PI;
        
        // Move the player in the direction of movement
        hero.position.x += move.x;
        hero.position.z += move.y;

        // Camera
        camera.position.x = hero.position.x;
        camera.position.z = hero.position.z + 5;
        camera.position.y = hero.position.y + 10;
        camera.lookAt(hero.position); // Look at hero
    }

    // Controls
    redFlashBorder.update(camera, deltaTime);
    stickControl.update(camera, hero, time);
    heroArea.update(camera, hero, time, gamer.gameData.range);
    singleItems.update(time, hero.position, gamer.gameData.range);
    gameSpawn.update(scene, time, hero.position, gamer.gameData.range);

    // Cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    cube.material.opacity = Math.abs(Math.sin(Date.now() * 0.001));

    renderer.render(scene, camera);
}

// Let's start the animation
animate();


// Test Area
function handleClick(event) {
    console.log("Test click", event);

    textControls.addText("1", hero.position, "Hello world!");

    redFlashBorder.alert();
}

//document.addEventListener('click', handleClick);