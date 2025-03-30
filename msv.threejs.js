import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {GLTFLoader} from  'three/addons/loaders/GLTFLoader.js';

const MGL_DEBUG = 1;

const mglModelsState = Object.freeze({
    NONE: 0,
//    INIT: 1,
    LOADING: 2,
    READY: 3
});

// Models loader (stl, gltf, glb)
export class mglModelsLoader{
    state = mglModelsState.READY;
    load = [];
    models = [];
    error = undefined;

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
        else{
            this.error = "mglModelsClass.loadModelNext(): Unsupported file extension.";
            this.state = mglModelsState.READY;
            return ;
        }

        const loaderClass = this;

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
    flashTime = 1000;

    constructor() {
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
        //this.flasher.material.opacity = 1;
        console.log("redFlashBorder");
    }

    update(camera, deltaTime){
        if(!this.state)
            return ;

        //

        //this.flasher.rotation.x += 0.01; // Вращаем куб
        //this.flasher.rotation.y += 0.01;


        this.time += deltaTime;
        if(this.time >= this.flashTime){
            //this.state = 0;
            //this.flasher.visible = false;
            //this.flasher.material.opacity = 0;
        }

        //this.flasher.lookAt(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3())));

        this.flasher.position.copy(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()))); // Позиционируем плоскость на месте камеры

        //this.flasher.position.copy(camera.position);

        //this.flasher.position.y -= 1.1 -.1;
        //this.flasher.position.z -= .5;
        //console.log(this.flasher.position);

        this.flasher.lookAt(camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()))); // Поворачиваем плоскость к камере

        this.flasher.material.uniforms.opacity.value = Math.abs(Math.sin(Date.now() * 0.001));

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
        const dx = unitPos.x - heroPos.x;
        const dy = unitPos.y - heroPos.y;
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
            if(spawn.count < spawn.countMax){
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