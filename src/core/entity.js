/*
this class represents any physical object that will be in the raycast world
any user made item / character class should use this class or derive from it
*/

import { Texture } from "/src/resources/texture.js";
import { Color } from "/src/resources/color.js";
import { Orientation } from "/src/math/orientation.js";

class Entity {
	/*
	config holds the appearance (texture or color), position and direction, 
	and the size of the entity (in world coordinates)
	*/
	constructor(config) {
		// check if we recieved a config object
		if (typeof config !== "object") {
			throw new Error(
				"Entity constructor must recieve a config object"
			);
		}

		// check if appearance argument is provided (neccessary)
		if (!(config.appearance instanceof Texture) &&
			!(config.appearance instanceof Color)) {
			throw new Error(
				"Entity constructor must receive an appearance argument of " +
				"type Texture or Color"
			);
		}

		// vector arguments
		let config_attributes = [
			"position",
			"direction",
			"size"
		];

		// check if we received valid position, direction, and size attributes
		for (let i = 0; i < config_attributes.length; i++) {
			if (config[config_attributes[i]] !== undefined && (
					typeof config[config_attributes[i]] !== "object" ||
					typeof config[config_attributes[i]].x !== "number" ||
					typeof config[config_attributes[i]].y !== "number")) {
				throw new Error(
					"Entity " + config_attributes[i] + " must be an object" +
					" with x and y attributes that are numbers"
				);
			}
		}

		// check if the z attribute was passed correctly
		if (config.position !== undefined &&
			config.position.z !== undefined &&
			typeof config.position.z !== "number"
		) {
			throw new Error("Entity z position must be a number");
		}

		// check if the tint was passed properly
		if (config.tint !== undefined && !(config.tint instanceof Color)) {
			throw new Error("Entity tint must be of type Color");
		}

		// set appearance attribute
		this.appearance = config.appearance;

		// if position wasn't provided, use the origin
		let position = config.position || {
			x: 0,
			y: 0,
			z: 0
		};

		// use a default direction if no direction vector was provided
		let direction = config.direction || {
			x: 1,
			y: 0
		};

		// create an orientation object from the position and direction
		this.orientation = new Orientation(
			position.x,
			position.y,
			direction.x,
			direction.y
		);

		// set the z position of the entity
		this.orientation.position.z = position.z;

		// set the size to a default unit square if none was provided
		this.size = config.size || {
			x: 1,
			y: 1
		};

		// a color to tint the appearance of the entity
		this.tint = config.tint;

		/*
		set isInvisible and hasPartialAlpha to their corresponding 
		truth / false values
		*/
		this.isInvisible = !!config.isInvisible;
		this.hasPartialAlpha = !!config.hasPartialAlpha;
	}
}

export { Entity };