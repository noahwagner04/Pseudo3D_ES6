# Pseudo3D_ES6
A simple pseudo 3d engine software renderer written in JS.

## Features
* advanced raycaster
	* textured walls
	* textured floors and ceilings
	* sprite rendering
	* higher walls
	* camera pitch
	* camera height variability
	* depth lighting
	* skybox
* voxelspace renderer (soon)

## Project Structure
* `assets` contains files such as images for textures
* `examples` provides examples of how to use the engine
* `src` holds the core of the engine
	* `src/math` contains general math utilities 
	* `src/resources` contains pseudo3d asset types such as texture and color
	* `src/core` contains the main js files that provides main functionality of the engine
* `pseudo_3d.js` the main file to import, aggregates all sub modules into one module
* `index.html` main html file to be used

## Referencess
* https://lodev.org/cgtutor/raycasting.html
* https://docs.google.com/document/d/1efgJuqZp1GQ1a_TrpnY2Sj50h_5ntfFEcyX8-aR0GE0/edit#heading=h.5pw5j9ip5ics
* https://www.youtube.com/playlist?list=PLCtGghEtHgGPL4v8WIk9xEx5Pj_tHT7eG
* https://github.com/s-macke/VoxelSpace