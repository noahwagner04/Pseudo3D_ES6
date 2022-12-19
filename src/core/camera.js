/*
This class holds relavent information that changes the way the rendered 
world looks. There are also some functions that make it easier to move and 
rotate the camera without having to manually rotate the camera plane as well.
This must be done in order to make the camera plane always perpendicular to 
the direction vector.
*/

import Orientation from "/src/math/orientation.js";
import Color from "/src/resources/color.js";
import Vector from "/src/math/vector.js";

export default class Camera {
	/*
	recognized config attributes are position, direction, focalLength, pitch,
	and a lighting settings object
	*/
	constructor(config) {
		// check if we recieved a config object
		if (typeof config !== "object") {
			throw new Error(
				"Camera constructor must recieve a config object"
			);
		}

		// vector arguments
		let config_attributes = [
			"position",
			"direction",
		];

		// check if we recieved valid position or direction
		for (let i = 0; i < config_attributes.length; i++) {
			if (config[config_attributes[i]] !== undefined && (
					typeof config[config_attributes[i]] !== "object" ||
					typeof config[config_attributes[i]].x !== "number" ||
					typeof config[config_attributes[i]].y !== "number")) {
				throw new Error(
					"Camera " + config_attributes[i] + " must be an object" +
					" with x and y attributes that are numbers"
				);
			}
		}

		// check if we received a valid focal length
		if (config.focalLength !== undefined &&
			typeof config.focalLength !== "number") {
			throw new Error("Camera focalLength must be a number");
		}

		// check if we received a valid camera pitch
		if (config.pitch !== undefined &&
			!Number.isInteger(config.pitch)) {
			throw new Error("Camera pitch must be an integer");
		}

		// check if the lighting settings object is valid
		if (config.lighting !== undefined) {

			// check if the lighting object is an object
			if (typeof config.lighting !== "object") {
				throw new Error("Camera lighting must be an object");
			}

			// check if the brightness attribute is valid
			if (config.lighting.brightness !== undefined &&
				typeof config.lighting.brightness !== "number") {
				throw new Error(
					"Camera lighting brightness must be a number"
				);
			}

			// if brightness is not provided, set it to 1
			config.lighting.brightness = config.lighting.brightness || 1;

			// check if the maxBrightness attribute is valid
			if (config.lighting.maxBrightness !== undefined &&
				typeof config.lighting.maxBrightness !== "number") {
				throw new Error(
					"Camera lighting maxBrightness must be a number"
				);
			}

			// if maxBrightness is not provided, set it to Infinity
			config.lighting.maxBrightness = config.lighting.maxBrightness ||
				Infinity;

			// check if the color attribute is valid
			if (config.lighting.color !== undefined &&
				!(config.lighting.color instanceof Color)) {
				throw new Error(
					"Camera lighting color must be of type Color"
				);
			}

			// if not color was provided, set defualt color to white
			config.lighting.color = config.lighting.color ||
				new Color(255, 255, 255, 255);

		}

		// if position wasn't provided, use the origin
		let position = config.position || {
			x: 0,
			y: 0
		};

		// use a default direction if no direction vector was provided
		let direction = config.direction || {
			x: 1,
			y: 0
		};

		// set the orientation of the camera
		this.orientation = new Orientation(
			position.x,
			position.y,
			direction.x,
			direction.y
		);

		this.orientation.direction.scale(config.focalLength || 1);

		/*
		this vector represents the local x axis of the camera, and is used
		throughout the rendering process of the raycast world
		cameraPlane length will be set to the aspect ratio of the window 
		its rendering to (this is done by the render functions)
		*/
		this.cameraPlane = new Vector(
			-this.orientation.direction.y,
			this.orientation.direction.x
		);

		/*
		pitch is in pixel coordinates, it gives the illusion of rotation 
		along the camera plane
		*/
		this.pitch = config.pitch || 0;

		/*
		this object stores settings related to the light emitted from 
		the camera
		*/
		this.lighting = config.lighting;
	}

	/*
	rotates the camera plane and direction vector some amount of radians from 
	their last position
	*/
	rotate(angle) {
		// check if angle recieved was valid
		if (typeof angle !== "number") {
			throw new Error(
				"Camera.rotate must recieve an angle that is a number"
			);
		}

		// rotate our direction vector
		this.orientation.direction.rotate(angle);

		/*
		keep camera plane perpendicular, length will be set when the camera is 
		passed to render functions
		*/
		this.cameraPlane.x = -this.orientation.direction.y;
		this.cameraPlane.y = this.orientation.direction.x;

		return this;
	}

	/*
	sets the rotation of the camera plane and direction vector some amount of
	radians from the horizontal
	*/
	setRotation(angle) {
		// check if angle recieved was valid
		if (typeof angle !== "number") {
			throw new Error(
				"Camera.setRotation must recieve an angle that is a number"
			);
		}

		/*
		set the direction vector to be rotated <angle> radians from the 
		horizontal
		*/
		let focalLength = this.orientation.direction.getMag();
		this.orientation.direction.x = Math.cos(angle) * focalLength;
		this.orientation.direction.y = Math.sin(angle) * focalLength;

		// update the cameraPlane to be perpendicular to the direction vector
		this.cameraPlane.x = -this.orientation.direction.y;
		this.cameraPlane.y = this.orientation.direction.x;

		return this;
	}

	/*
	added for consistency, but not as useful as rotate and setRotation 
	functions
	*/
	move(deltaX, deltaY) {
		// check if delta coordinates recieved was valid
		if (typeof deltaX !== "number" || typeof deltaY !== "number") {
			throw new Error(
				"Camera.move must recieve two numbers"
			);
		}

		// add our position with the delta vector given
		this.orientation.position.x += deltaX;
		this.orientation.position.y += deltaY;

		return this;
	}

	/*
	also added to stay consistent with how the user would rotate the camera 
	(but not really neccessary otherwise)
	*/
	setPosition(newX, newY) {
		// check if delta coordinates recieved was valid
		if (typeof newX !== "number" || typeof newY !== "number") {
			throw new Error(
				"Camera.setPosition must recieve two numbers"
			);
		}

		// set our position to a new x and y location
		this.orientation.position.x = newX;
		this.orientation.position.y = newY;

		return this;
	}
}