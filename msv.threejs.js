import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from  'three/addons/loaders/GLTFLoader.js';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js' 

const MGL_DEBUG = 1;

export class mglLoadingScreen{
    updateScreen(perc, file){
        document.getElementById('loadingPercentage').innerText = `Loading: ${perc}%`;
        document.getElementById('loadingFiles').innerText = file;
    }

    hideScreen() {
        document.getElementById('loadingScreen').style.display = 'none'; // Hide loading screen
    }
};


const mglModelsState = Object.freeze({
    NONE: 0,
//    INIT: 1,
    LOADING: 2,
    READY: 3
});

// Models loader (stl, gltf, glb, font)
export class mglModelsLoader{
    state = mglModelsState.READY;
    load = [];
    models = [];
    error = undefined;

    setScreen(screen){
        this.screen = screen;
    }

    // Loading ready: bool
    isReady(){
        if(this.state == mglModelsState.READY){
            if(this.load.length){
                this.state = mglModelsState.LOADING;
                this.#loadModelNext();
                return 0;
            }

            return 1;
        }        

        return 0;
    }

    // Load model
    loadModel(name, url){
        let model = {
            name: name,
            url: url
        };

        this.load.push(model);

        this.isReady();
    }

    getFileExtension(filename) {
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop() : ''; // Returns the file extension or an empty string.
    }

    #loadModelNext(){
        const model = this.load.shift();
        const ext = this.getFileExtension(model.url);
        var loader;

        if(MGL_DEBUG)
            console.log('mglModelsClass.loadModelNext(): ' + model.name + '(' + model.url + ')');
        
        // Loader
        if(ext == 'stl')
            loader = new STLLoader();
        else if(ext == 'gltf' || ext == 'glb')
            loader = new GLTFLoader();
        else if(ext == 'json')
            loader = new FontLoader();
        else{
            this.error = "mglModelsClass.loadModelNext(): Unsupported file extension.";
            this.state = mglModelsState.READY;
            return ;
        }

        const loaderClass = this;

        if(this.screen){
            let perc = this.models.length / (this.models.length + this.load.length) * 100;
            if(!perc)
                perc = 0;

            this.screen.updateScreen(perc, model.name);
        }

        // Load
        loader.load(model.url, function(object){
            model.model = object; //gltf.scene;
            loaderClass.models.push(model);

            if(MGL_DEBUG)
                console.log(model);

            loaderClass.state = mglModelsState.READY;

        }, undefined, function (error) {
            loaderClass.state = mglModelsState.READY;
            loaderClass.error = "mglModelsClass.loadModelNext(): "+ error;
            console.error(loaderClass.error);
        });
    }

    // Get model data
    getModel(name){
        const model = this.models.find(model => model.name === name);

        console.log(model);

        if(model)
            return model.model;
        return undefined;
    }
};

// Flash screen. HAVE BUGS NEDD REPAIR
export class mglFlashBorder{
    constructor() {
        this.flashTime = 2;
        this.flasher = undefined;
        this.state = 1;
        this.time = 0;
        this.again = 0;
    }

    init(scene){
        let g = new THREE.PlaneGeometry(1., 1.);
        let m = new THREE.ShaderMaterial({
            uniforms: {
                color1: { value: new THREE.Vector4(0.0, 0.0, 0.0, 0.2)},
                color2: { value: new THREE.Vector4(1.0, 0.0, 0.0, 1.5)},
                opacity: { value: 0.5 },
                ratio: {value: innerWidth / innerHeight}
            },
            vertexShader: `varying vec2 vUv;
              void main(){
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }`,
                  fragmentShader: `varying vec2 vUv;
                uniform vec4 color1;
                uniform vec4 color2;
                uniform float opacity;
                uniform float ratio;
                void main(){
                    vec2 uv = (vUv - 0.5) * 1.0;// * vec2(ratio, 1.);
                  gl_FragColor = mix(color1, color2, length(uv));
                  gl_FragColor.a *= opacity;
                  //gl_FragColor = mix(color1, color2, vUv.x);
                }`,
                transparent: true
            });
        //this.flasher = new THREE.Mesh(g, m);

        //const geometry = new THREE.BoxGeometry();
        //this.material = m;//new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true });
        this.flasher = new THREE.Mesh(g, m);
        //this.flasher.scale.set(2, .5, 1);
//        this.flasher.material.opacity = 0.0;
        this.flasher.visible = false;

        scene.add(this.flasher);
    }

    alert(){
        this.state = 1;
        this.time = 0;
        this.flasher.visible = true;

        if(MGL_DEBUG)
            console.log("redFlashBorder alert!");
    }

    getOpacity(currentTime, maxTime){        
        if (currentTime < 0 || currentTime > maxTime) {
            return 0;
        }
    
        const halfTime = maxTime / 2;
    
        if (currentTime <= halfTime){
            // Increase transparency from 0 to 1
            return currentTime / halfTime;
        } else {
            // Decrease transparency from 1 to 0
            return (maxTime - currentTime) / halfTime;
        }
    }

    update(camera, deltaTime){
        if(!this.state)
            return ;

        this.time += deltaTime;
        if(this.time >= this.flashTime){
            this.state = 0;
            this.flasher.visible = false;
            return ;
        }

        this.flasher.position.copy(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3())));
        this.flasher.lookAt(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3())));
        this.flasher.material.uniforms.opacity.value = this.getOpacity(this.time, this.flashTime);
    }

};

// Stick
export class mglStickObject{
    constructor(){}

    init(scene){
        // Create a circle
        const geometry = new THREE.CircleGeometry(1, 64);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        this.circle = new THREE.Mesh(geometry, material);
        scene.add(this.circle);
        
        // Create ring
        const geometry2 = new THREE.RingGeometry(2, 1.95, 64);
        const material2 = new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide });
        this.ring = new THREE.Mesh(geometry2, material2);
        scene.add(this.ring);

        // Add mouse event handlers
        window.addEventListener('mousedown', this.onMouseDown, false);
        window.addEventListener('mouseup', this.onMouseUp, false);
        window.addEventListener('mousemove', this.onMouseMove, false);
        window.addEventListener('wheel', this.onMouseScroll);
    }

    // Mouse button click handler
    onMouseDown(event) {
        gamer.mouse.pressed = 1;
        gamer.mouse.pos.x = event.clientX;
        gamer.mouse.pos.y = event.clientY;
        gamer.mouse.move.reset();

        if(MGL_DEBUG)
            console.log('Mouse button pressed:', event);
    }

    // Mouse button release handler
    onMouseUp(event) {
        gamer.mouse.pressed = 0;
        gamer.mouse.move.reset();

        if(MGL_DEBUG)
            console.log('Mouse button released:', event.button);
    }

    // Mouse movement handler
    onMouseMove(event) {
        if(gamer.mouse.pressed){
            const maxLen = Math.min(window.innerWidth, window.innerHeight) / 3;
            var move = new KiVec2((event.clientX - gamer.mouse.pos.x) / maxLen, (event.clientY - gamer.mouse.pos.y) / maxLen);
            move.crop(-1, 1);

            if(move.length() > 1){
                gamer.mouse.move = move.normalize();
            } else
                gamer.mouse.move = move;
        }
    }

    // Function for handling scroll event
     onMouseScroll(event) {
        event.preventDefault(); // Prevent the default page scrolling behavior
        const delta = event.deltaY;
        
        if(delta < 0)
            gamer.mouse.scroll --;
        else
            gamer.mouse.scroll ++;
    }

    update(camera, hero, deltaTime){
        if(!hero)
            return ;

        this.ring.position.copy(hero.position).add(new THREE.Vector3(0, 0, 3));
        this.circle.position.copy(hero.position).add(new THREE.Vector3(gamer.mouse.move.x, 0, 3 + gamer.mouse.move.y));
        this.circle.lookAt(camera.position);
        this.ring.lookAt(camera.position);
    }

};

// Unit area ring
export class mglAreaRing{

    // Use init() on change radius
    init(scene, radius){
        if(this.area){
            scene.remove(this.area);
        }

        // Create a ring
        const ringGeometry = new THREE.RingGeometry(radius, radius + .5, 64);

        // Create a shader material
        const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                opacity: { value: 0.5 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float opacity;
                varying vec2 vUv;

                void main() {
                    // Color fades to center
                    float dist = length(vUv - vec2(0.5));
                    float c1 = smoothstep(.5, 0.47, dist);
                    float c2 = smoothstep(0.39, 0.47, dist);

                    //gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * opacity);
                    gl_FragColor = vec4(1.0, dist / 2. , 0.0, c1 * c2);
                    
                    //gl_FragColor = vec4(1., 1., 1., 1.); // White ring
                }
            `,
            transparent: true // Enable transparency support
        });

        // Create a ring mesh
        this.area = new THREE.Mesh(ringGeometry, ringMaterial);
        this.area.rotation.set(-Math.PI / 2, 0, 0);
        this.area.position.y += .01;

        this.area.material.uniforms.opacity.value = 1;

        scene.add(this.area);
    }

    update(camera, hero, deltaTime){
        if(hero){
            this.area.position.x = hero.position.x;
            this.area.position.z = hero.position.z;
        }

        this.area.material.uniforms.opacity.value = Math.abs(Math.sin(Date.now() * 0.001));
    }

};


// Single Items: enemy, units, items...
export class mglSingleItems{
    items = []

    init(scene){
        this.scene = scene;
    }

    addItem(item){
        if(!item.pos2)
            item.pos2 = new THREE.Vector3(0, 0, 0);

        item.model.position.copy(item.pos).add(item.pos2);

        this.items.push(item);
        this.scene.add(item.model);
    }

    update(time, heroPos){
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];

            

            if(this.InRange(item.model.position, heroPos, item.range)){
                console.log("INRANGE");
                if(item.callback(item)){
                    this.scene.remove(item.model);
                    this.items.splice(i, 1);
                }
            }
        }
    }

    // Helpers
    InRange(unitPos, heroPos, range) {
        // Calculate the square of the distance between the unit and the hero
        const dx = unitPos.x - heroPos.x;
        const dy = unitPos.y - heroPos.y;
        const dz = unitPos.z - heroPos.z;
    
        const distanceSquared = dx * dx + dy * dy + dz * dz;// Square of distance
        const rangeSquared = range * range;// Square of radius
    
        // Check if the unit is within the radius
        return distanceSquared <= rangeSquared;
    }


    getRandomPosition(center, radius) {
        // Generate a random angle for the spherical coordinates
        const theta = Math.random() * 2 * Math.PI; // Random angle around the Y-axis
        const phi = Math.acos(2 * Math.random() - 1); // Random angle from the Y-axis
    
        // Calculate the Cartesian coordinates
        const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
        const y = center.y + 0;
        const z = center.z + radius * Math.sin(phi) * Math.sin(theta);
    
        return new THREE.Vector3(x, y, z); // Return the random position as a Vector3
    }

};

// Spawn 
const gameSpawnUnitsState = Object.freeze({
    SPAWN: 0, FREE: 0, PICKUP: 1
});

export class mglGameSpawnClass{
    init(scene){
        this.time = 0;
        this.spawns = [];        
        this.scene = scene;        
    }

    setSpawnModel(model){
        this.spawnModel = model;
    }

    setUnitModel(model){
        this.unitModel = model;
    }

    addSpawn(pos, count, radius, time){
        let spawn = {
            pos: pos, count: 0, countMax: count, radius: radius, workTime: 0, spawnTime: time, units: []
        };

        if(this.spawnModel){
            let clone = this.spawnModel.clone();
            clone.position.set(pos.x, 0, pos.y);
            clone.scale.clone(this.spawnModel.scale);

            spawn.spawnModel = clone;
            this.scene.add(clone);
        }

        this.spawns.push(spawn);
    }

    InRange(unitPos, heroPos, heroRange) {
        // Calculate the square of the distance between the unit and the hero
        const dy = unitPos.y - heroPos.y;
        const dx = unitPos.x - heroPos.x;
        const dz = unitPos.z - heroPos.z;
    
        const distanceSquared = dx * dx + dy * dy + dz * dz;// Square of distance
        const rangeSquared = heroRange * heroRange;// Square of radius
    
        // Check if the unit is within the radius
        return distanceSquared <= rangeSquared;
    }

    update(scene, time, heroPos, heroRange){
        let rTime = Date.now() * 0.001; // Current time
        let r05 = rTime * 0.05;

        this.spawns.map((spawn) => {
            // Update spawn model
            if(spawn.spawnModel){
                const model = spawn.spawnModel;

                // Change the position of the float along the Y and X axis
                model.position.y = Math.sin(rTime) * 0.2;
                //model.position.x = Math.sin(rTime * 0.5) * 0.3;

                // Float turns
                model.rotation.z = Math.sin(rTime) * 0.5;
                model.rotation.x = Math.sin(rTime * 0.5) * 0.1;

                // Time offset
                rTime += Math.PI + r05;
            }

            // Hero
            for (let i = spawn.units.length - 1; i >= 0; i--){
                const unit = spawn.units[i];

                // onSpawn
                if(unit.state == gameSpawnUnitsState.SPAWN){
                    const deltaTime = time - unit.workTime;
                    
                    if(deltaTime < 1000){
                        unit.mesh.position.y = deltaTime / 1000 * 5 - 5;
                    } else
                        unit.state = gameSpawnUnitsState.FREE;
                }
            
                // onFree
                if(unit.state == gameSpawnUnitsState.FREE){
                    if(this.InRange(unit.mesh.position, heroPos, heroRange)){
                        unit.state = gameSpawnUnitsState.PICKUP;
                        
                        // Pickup & jump
                        unit.deadTime = time;
                        unit.startPos = unit.mesh.position;
                        unit.midPos = new THREE.Vector3(
                            (unit.startPos.x + heroPos.x) / 2,
                            Math.max(unit.startPos.y, heroPos.y) + 2, // Height in the middle
                            (unit.startPos.z + heroPos.z) / 2
                        );

                        unit.durationTime = 1 * 1000;

                        if(MGL_DEBUG)
                            console.log("Pickup!", unit);
                    }
                }

                // onPickup
                if(unit.state == gameSpawnUnitsState.PICKUP){
                    const elapsedTime = time - unit.deadTime;
                    const t = Math.min(elapsedTime / unit.durationTime, 1); // Normalized time

                    // Bezier Curve Interpolation
                    const position = new THREE.Vector3().lerpVectors(unit.startPos, unit.midPos, t);
                    const position2 = new THREE.Vector3().lerpVectors(unit.midPos, heroPos, t);
                    unit.mesh.position.lerpVectors(position, position2, t);

                    if(unit.deadTime + unit.durationTime < time){
                        scene.remove(unit.mesh);
                        spawn.units.splice(i, 1);
                        spawn.count --;
                    }
                }
            }

            // Spawn units
            if(spawn.units.length < spawn.countMax){
                if(spawn.workTime + spawn.spawnTime < time){
                    // Generate random angles and distances
                    const randomAngle = Math.random() * 2 * Math.PI;
                    const randomDistance = Math.random() * spawn.radius;

                    let unit = {
                        state: gameSpawnUnitsState.SPAWN, 
                        workTime: time,
                        mesh:  this.unitModel.clone()
                    };

                    // Calculate coordinates
                    const x = spawn.pos.x + randomDistance * Math.cos(randomAngle);
                    const z = spawn.pos.y + randomDistance * Math.sin(randomAngle);

                    // Setting the position
                    unit.mesh.position.set(x, -5, z);

                    spawn.units.push(unit);
                    scene.add(unit.mesh);

                    if(MGL_DEBUG)
                        console.log('Spawn Unit!', x, z, unit.mesh);

                    spawn.count ++;
                    spawn.workTime = time;
                }

            }
        });
    }
};


export class mglHealthBar{
    init(){
        const canvas = document.getElementById('mglHealthBar');
        const ctx = canvas.getContext('2d');

        // Set the canvas size to match the window size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Health bar configuration parameters
        const config = {
            x: 20, // X position of the health bar
            y: 20, // Y position of the health bar
            width: 200, // Width of the health bar
            height: 20, // Height of the health bar
            borderRadius: 10, // Radius for rounded corners
            health: 100,  // Current health value
            maxHealth: 100, // Maximum health value
            backgroundColor: '#333', // Background color of the health bar
            healthColor: '#00ff00' // Color of the health portion
        };

         // Function to draw a rounded rectangle
         ctx.roundRect = function (x, y, width, height, radius) {
            ctx.beginPath(); // Start a new path
            ctx.moveTo(x + radius, y); // Move to the starting point
            ctx.lineTo(x + width - radius, y); // Draw the top edge
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius); // Draw the top right corner
            ctx.lineTo(x + width, y + height - radius); // Draw the right edge
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); // Draw the bottom right corner
            ctx.lineTo(x + radius, y + height); // Draw the bottom edge
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius); // Draw the bottom left corner
            ctx.lineTo(x, y + radius); // Draw the left edge
            ctx.quadraticCurveTo(x, y, x + radius, y); // Draw the top left corner
            ctx.closePath(); // Close the path
        };

        this.canvas = canvas;
        this.ctx = ctx;
        this.config = config;

        this.drawHealthBar();
    }

    // Function to draw the health bar
    drawHealthBar() {
        const { canvas, ctx, config } = this;

        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

        // Draw the background of the health bar
        ctx.fillStyle = config.backgroundColor; // Set the fill color
        ctx.roundRect(
            config.x, 
            config.y, 
            config.width, 
            config.height, 
            config.borderRadius
        );
        ctx.fill(); // Fill the background

        // Draw the health portion of the bar
        ctx.fillStyle = config.healthColor; // Set the fill color for health
        ctx.roundRect(
            config.x, 
            config.y, 
            (config.width * config.health) / config.healthMax, 
            config.height, 
            config.borderRadius
        );
        ctx.fill(); // Fill the health portion

        // Draw the health percentage text
        ctx.fillStyle = 'white'; // Set the text color
        ctx.font = '16px Arial'; // Set the font style
        ctx.textAlign = 'center'; // Center the text
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Set the shadow color to a semi-transparent black
        ctx.shadowBlur = 4; // Set the blur radius for the shadow
        //ctx.shadowOffsetX = 2; // Set the horizontal offset of the shadow
        //ctx.shadowOffsetY = 2; // Set the vertical offset of the shadow
        ctx.fillText(
            `${Math.round(config.health)} / ${Math.round(config.healthMax)}`, // Display the current health percentage
            config.x + config.width / 2, // Center the text horizontally
            config.y + config.height / 2 + 5 // Center the text vertically
        );
    }

    // Function to change the health value
    changeHealth(value, max) {
        let config = this.config;

        config.health = value; // Update the current health
        config.healthMax = max; //Math.max(0, Math.min(max, config.health)); // Ensure health stays within bounds
        this.drawHealthBar(); // Redraw the health bar
    }

        // Example of changing health every 2 seconds
        // setInterval(() => {
        //     changeHealth(-10); // Decrease health by 10
        // }, 2000);
    //}
};

// Text controls class
export class mglTextControls{
    init(scene, camera, font){
        this.items = [];
        this.scene = scene;
        this.camera = camera;
        this.font = font;

        this.raycaster = new THREE.Raycaster();

        // Add event listener for mouse movement
        window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
        window.addEventListener('click', this.onMouseClick.bind(this), false);
    }

    addText(id, pos, text, callback){
            //let gameOverText, continueText;
            //let font = mglModels.getModel('helvetiker_regular');
            const geometry = new TextGeometry(text, {
                font: this.font,
                 size: 2,
                 depth: 1,
                // curveSegments: 12,
                 //bevelEnabled: true,
                // bevelThickness: 10,
                // bevelSize: 1,
                // bevelOffset: 0,
                // bevelSegments: 5

                // font: this.font,
                // size: 1,
                // depth: 1,
                 height: 0.5,
                 //curveSegments: 12,
                 //bevelEnabled: false
            });            
            
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            //const material = new THREE.MeshLambertMaterial({
            //    color: 0x686868
            //});
            geometry.center();

            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.y += 2;
            mesh.position.x = pos.x;
            mesh.position.z = pos.z;
            
            // Position & camera
            mesh.lookAt(this.camera.position);

            console.log("Text pos" + mesh.position);

            let item = {
                id: id,
                mesh: mesh,
                callback: callback
            };

            this.items.push(item);        
            this.scene.add(mesh);

            return mesh;
    }

    update(){ }

    testIntersect(event, click){
        if(!this.items.length)
            return undefined;

        const mouse = new THREE.Vector2();

        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update the raycaster with the camera and mouse position
        this.raycaster.setFromCamera(mouse, this.camera);

        for(let i = this.items.length - 1; i >= 0; i--){
            let item = this.items[i];

            // Calculate objects intersecting the picking ray
            const intersects = this.raycaster.intersectObjects([item.mesh]);

        if(!item.callback)
            continue;

            if (intersects.length > 0){                
                if(item.callback(item, 1, click))
                    this.removeItem(i, item);
                else
                    this.items[i].hover = true;
            } else
                if(item.hover)
                    if(item.callback(item, 0, click))
                        this.removeItem(i, item);
                    else
                        this.items[i].hover = false;
        }

        return undefined;
    }

    removeItem(i, item){
        this.scene.remove(item.mesh);
        this.items.splice(i, 1);
    }

    onMouseMove(event) {
        this.testIntersect(event, 0);
    }

    onMouseClick(event){
        this.testIntersect(event, 1);
    }

};


/* Interesting lonks
https://www.shadertoy.com/view/cdBXRc - GLSL ring

*/