# Project migrated to MyGL Core!
https://github.com/mikelsv/mglcore - new library for web development

# ThreejsSimpleGame

This is a simple game project to understand the basic mechanics of ThreeJS

_My brain was spinning while I was trying to figure it all out, but it was worth it._

Run this game: https://mikelsv.github.io/ThreejsSimpleGame/

## Build 0.3
[x] Added loading screen, now you see the loading process instead of a blank screen. This is the work of the mglLoadingScreen class.

[x] New class mglHealthBar displays a health bar in the upper left corner. God mode is no longer active. You may die. Sorry.

[x] The new class mglSingleItems allows you to add single objects with which the player interacts. Units, enemies, items.

[x] Mines have been added to the game. When colliding, they take away one life.

[!] _Mines! Johnny, they're in the t~h~rees!_

[x] Text messages were also implemented.

_Goodbye, cruel world of programming. Dobby is free. For today._

## Bugs
[ ] mglFlashBorder not work correctly yet.
[ ] mglTextControls class has problems.

## Todo
[ ] Spawn fishes.
[ ] Base and sale of fish.
[ ] Shop.

## main.js
Main game file. Loading engine modules. Loading models. Waiting and starting the game. Keyboard interception. Looping animation.

## msv.gamer.js
Load, store and save game values

use gamer.loadGameData(); for load game data

use gamer.gameData .value for get/set value

use gamer.saveGameData() for save game data

## msv.threejs.js
Extension classes.

mglModelsLoader - Loading stl, gltf, glb models. [+] And font in json.

mglFlashBorder - Flash on screen. Not working yet.

mglAreaRing - Creates a ring around the player.

mglGameSpawnClass - Spawn constrol. Areas and units.
