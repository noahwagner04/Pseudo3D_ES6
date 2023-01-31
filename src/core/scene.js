/*
The scene class is meant to store world data, such as the world map, face 
texture settings, objects in the scene, skybox texture, and lighting 
information
*/

import { Color } from "/src/resources/color.js";
import { Texture } from "/src/resources/texture.js";
import { Entity } from "/src/core/entity.js";

class Scene {
	/*
	config holds sub config objects which include: floor, ceiling, worldMap,
	gameObject, skybox, lighting
	NOTE: config object does get modified, scene attributes are referenced
	to the config object
	*/
	constructor(config) {
		// check if we recieved a config object
		if (typeof config !== "object") {
			throw new Error(
				"Scene constructor must recieve a config object"
			);
		}

		// a list of all the sub config objects
		let subConfigs = [
			"floor",
			"ceiling",
			"worldMap",
			"gameObject",
			"skybox",
			"lighting"
		];

		// check if any of the sub config objects are valid
		for (let i = 0; i < subConfigs.length; i++) {
			let obj = config[subConfigs[i]];
			if (obj !== undefined && typeof obj !== "object") {
				throw new Error(
					"Scene config." + subConfigs[i] + " must be an object"
				);
			}
			// if the sub config wasn't provided, make it equal an empty object
			config[subConfigs[i]] = obj || {};
		}

		// -----check all user input, sets all sub configs to be valid-----

		checkWorldMap(config.worldMap);
		checkFloorCeiling(config.floor, config.ceiling);
		checkGameObject(config.gameObject);
		checkSkybox(config.skybox);
		checkLighting(config.lighting);

		// assign this scenes attributes to sub configs which are now valid
		this.worldMap = config.worldMap;
		this.floor = config.floor;
		this.ceiling = config.ceiling;
		this.gameObject = config.gameObject;
		this.skybox = config.skybox;
		this.lighting = config.lighting;
	}

	/*
	for now this function is used to add game objects to the scene (entities), 
	but later it will be used for adding more cellInfo attributes, lighting 
	options, floor and ceiling options, fog, or any physical thing that
	could be added durring runtime that affects the game world
	*/
	add(object) {
		// if the object is an entity, add it to the entities array
		if (object instanceof Entity) {
			this.gameObject.entities.push(object);
		}

		// add more if checks here for different object inputs

		return this;
	}

	/*
	same idea as add, but now removes the specified object (again, right now I 
	only handle the case when the object is an entity)
	*/
	remove(object) {
		// if the object is an entity remove it from the array
		if (object instanceof Entity) {
			let index = this.gameObject.entities.indexOf(object);
			this.gameObject.entities.splice(index, 1);
		}

		// add more if checks here for different object inputs

		return this;
	}

}

export { Scene };

// ----input handling functions, each modify the given object to be valid-----

// checks worldMap object
function checkWorldMap(worldMap) {
	// check if worldMap.width is valid
	if (worldMap.width !== undefined &&
		(!Number.isInteger(worldMap.width) || worldMap.width < 0)
	) {
		throw new Error("Scene worldMap.width must be a positive integer");
	}

	// check if worldMap.height is valid
	if (worldMap.height !== undefined &&
		(!Number.isInteger(worldMap.height) || worldMap.height < 0)
	) {
		throw new Error("Scene worldMap.height must be a positive integer");
	}

	// if width or height wasn't provided, set them equal to 0
	worldMap.width = worldMap.width || 0;
	worldMap.height = worldMap.height || 0;

	// check if worldMap.height is valid
	if (worldMap.data !== undefined && !Array.isArray(worldMap.data)) {
		throw new Error("Scene worldMap.data must be an array");
	}

	/*
	if the data array wasn't passed, set it equal to an array with length
	(worldMap.width * worldMap.height) filled with 0's
	*/
	if (worldMap.data === undefined) {
		worldMap.data = [];
		for (let i = 0; i < worldMap.height * worldMap.width; i++) {
			worldMap.data[i] = 0;
		}
	}

	// check if the data array passed has the correct length
	if (worldMap.data.length !== worldMap.height * worldMap.width) {
		throw new Error(
			"Scene worldMap.data length must be worldMap.width *" +
			" worldMap.height"
		);
	}

	// check if the cellInfo object is valid
	if (worldMap.cellInfo !== undefined &&
		typeof worldMap.cellInfo !== "object"
	) {
		throw new Error("Scene worldMap.cellInfo must be an object");
	}

	// if cellInfo is not defined, set it to an empty object
	worldMap.cellInfo = worldMap.cellInfo || {};

	// check if each of the cellInfo attributes are correct
	for (const property in worldMap.cellInfo) {
		// first check if the attribute is an object
		if (typeof worldMap.cellInfo[property] !== "object") {
			throw new Error(
				"Scene worldMap.cellInfo[\"" + property +
				"\"] must be an object"
			);
		}

		// the height of the wall
		let height = worldMap.cellInfo[property].height;

		// check if the height is a number
		if (height !== undefined && typeof height !== "number") {
			throw new Error(
				"Scene worldMap.cellInfo[\"" + property +
				"\"].height must be a number"
			);
		}

		// if the height wasn't provided, default to a height of 1
		worldMap.cellInfo[property].height = height === undefined ? 1 : height;

		// the appearance of the wall, can be a texture or color
		let appearance = worldMap.cellInfo[property].appearance;

		// check if the appearance attribute is valid
		if (appearance !== undefined &&
			!(appearance instanceof Color) &&
			!(appearance instanceof Texture)
		) {
			throw new Error(
				"Scene worldMap.cellInfo[\"" + property +
				"\"].appearance must be of type Color or Texture"
			);
		}

		// if appearance wasn't provided, set it to a transparent color
		worldMap.cellInfo[property].appearance = appearance ||
			new Color(0, 0, 0, 0);
	}
}

// checks floor or ceiling objects
function checkFloorCeiling(floor, ceiling) {
	/*
	check if the appearance and cellWidth / cellHeight attributes are valid for
	both the ceiling and the floor
	*/
	for (let i = 0; i < 2; i++) {
		let plane = i === 0 ? floor : ceiling;
		let debugPlane = i === 0 ? "floor" : "ceiling";

		// if the provided plane object is empty, disable it
		if (JSON.stringify(plane) === "{}") {
			plane.enabled = false;
		} else {
			plane.enabled = true;
		}

		// check if the appearance attribute for the floor / ceiling is valid
		if (plane.appearance !== undefined &&
			!(plane.appearance instanceof Color) &&
			!(plane.appearance instanceof Texture)
		) {
			throw new Error(
				"Scene " + debugPlane +
				".appearance must be of type Color or Texture"
			);
		}

		/*
		if no floor / ceiling appearance was provided, set it to a transparent 
		color
		*/
		plane.appearance = plane.appearance || new Color(0, 0, 0, 0);

		// check if floor / ceiling cellWidth is valid
		if (plane.cellWidth !== undefined &&
			typeof plane.cellWidth !== "number"
		) {
			throw new Error(
				"Scene " + debugPlane + ".cellWidth must be a number"
			);
		}

		// check if floor / ceiling cellHeight is valid
		if (plane.cellHeight !== undefined &&
			typeof plane.cellHeight !== "number"
		) {
			throw new Error(
				"Scene " + debugPlane + ".cellHeight must be a number"
			);
		}

		// if neither cellWidth or cellHeight was provided, default to 1
		plane.cellWidth = plane.cellWidth || 1;
		plane.cellHeight = plane.cellHeight || 1;
	}

	// check if the ceiling height attribute is valid
	if (ceiling.height !== undefined && typeof ceiling.height !== "number") {
		throw new Error("Scene ceiling.height must be a number");
	}

	// if no height was provided, default to 1
	ceiling.height = ceiling.height || 1;
}

// checks gameObject object
function checkGameObject(gameObject) {
	// check if the passed entity array is valid
	if (gameObject.entities !== undefined &&
		!Array.isArray(gameObject.entities)
	) {
		throw new Error(
			"Scene gameObject.entities must be an array of Entities"
		);
	}

	// if no array was provided, set it to an empty array
	gameObject.entities = gameObject.entities || [];

	// check if resolutionX is valid
	if (gameObject.resolutionX !== undefined &&
		(!Number.isInteger(gameObject.resolutionX) ||
			gameObject.resolutionX < 0)
	) {
		throw new Error(
			"Scene gameObject.resolutionX must be a positive integer"
		);
	}

	// check if resolutionY is valid
	if (gameObject.resolutionY !== undefined &&
		(!Number.isInteger(gameObject.resolutionY) ||
			gameObject.resolutionY < 0)
	) {
		throw new Error(
			"Scene gameObject.resolutionY must be a positive integer"
		);
	}

	// if resolutionX / resolutionY wasn't provided, default to 64 * 64
	gameObject.resolutionX = gameObject.resolutionX || 64;
	gameObject.resolutionY = gameObject.resolutionY || 64;
}

// checks skybox object
function checkSkybox(skybox) {
	// check if the provided appearance attribute is valid
	if (skybox.appearance !== undefined &&
		!(skybox.appearance instanceof Color) &&
		!(skybox.appearance instanceof Texture)
	) {
		throw new Error(
			"Scene skybox.appearance must be of type Color or Texture"
		);
	}

	/*
	if the skybox appearance isn't provided, set enabled flag to false and 
	default to a transparent black color
	*/
	if(skybox.appearance === undefined) {
		skybox.appearance = new Color(0, 0, 0, 0);
		skybox.enabled = false;
	} else {
		// if we received a valid input, set enabled flag to true
		skybox.enabled = true;
	}
}

// checks lighting object
function checkLighting(lighting) {
	// check if provided side light is valid
	if (lighting.sideShade !== undefined &&
		typeof lighting.sideShade !== "number"
	) {
		throw new Error("Scene lighting.sideShade must be a number");
	}

	// default to 1 if no sideShade was provided
	lighting.sideShade = lighting.sideShade === undefined ? 0 : 
		lighting.sideShade;

	// check if ambientLight is valid
	if (lighting.ambientLight !== undefined &&
		typeof lighting.ambientLight !== "number"
	) {
		throw new Error("Scene lighting.ambientLight must be a number");
	}

	// default to 1 if no ambientLight was provided
	lighting.ambientLight = lighting.ambientLight === undefined ? 1 :
		lighting.ambientLight;

	/*
	set a flag indecating whether or not lighting is enabled (if both ambient
	and side light are 1 then disable lighting)
	*/
	lighting.enabled = !((lighting.sideShade === 0) &&
		(lighting.ambientLight === 1));
}