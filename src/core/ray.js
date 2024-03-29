/*
The Ray Class is a general ray casting utility meant to be used by the user and
the engine, If a user is utilizing the class, rayLength should not be 
specified; however, the engine will set raylegnth to 1 for certain rendering 
purposes.
*/

import {
	Scene
} from "/src/core/scene.js";

class Ray {

	static faces = ["north", "east", "south", "west"];

	// checks if inputs are the right type, then calls init
	constructor(scene, startX, startY, dirX, dirY, rayLength) {

		// check if provided scene is valid
		if (!(scene instanceof Scene)) {
			throw new Error(
				"Ray constructor must receive a scene of type Scene"
			);
		}

		// check if the provided starting and direction coordinates are valid
		if (typeof startX !== "number" ||
			typeof startY !== "number" ||
			typeof dirX !== "number" ||
			typeof dirY !== "number") {
			throw new Error(
				"Ray constructor must receive four numbers: startX, startY," +
				" dirX, dirY"
			);
		}

		// check if the provided length is valid
		if (rayLength !== undefined && typeof rayLength !== "number") {
			throw new Error(
				"Ray constructor must receive a length that is a number"
			);
		}

		// if the scene is valid, assign it to the instance
		this.scene = scene;

		/*
		if rayLength is not provided, set it to the length of the direction
		vector, this will make the distance attribute equal the actual total 
		traveled distance (instead of perpendicular distance)
		NOTE: the provided rayLength doesn't need to be equal to the actual
		initial length of the ray, it just defaults to that if no length is
		provided
		*/
		rayLength = rayLength || Math.sqrt(dirX * dirX + dirY * dirY);

		// setup ray attributes
		this.init(startX, startY, dirX, dirY, rayLength);
	}

	// initializes the ray's properties to be ready for casting.
	init(startX, startY, dirX, dirY, rayLength) {
		// get the cell coordinates of the starting position
		this.mapX = Math.floor(startX);
		this.mapY = Math.floor(startY);

		/*
		the length of the ray when it intersects the first horizontal / 
		vertical side, the meaning of these variables slightly change when we 
		start casting the ray, as it will be the cumulative distance the ray 
		has casted to reach any given horizontal / vertical side
		*/
		this.sideDistX;
		this.sideDistY;

		/*
		the x and y directions to check the next cell for a wall
		e.g. if the ray's direction is up and to the left, the step increment
		checks in the scene worldMap 2d array would be: stepX = -1, stepY = 1
		*/
		this.stepX;
		this.stepY;

		/*
		the ray's distance from crossing one horizontal / vertical line to 
		another
		*/
		this.deltaDistX = Math.abs(rayLength / dirX);
		this.deltaDistY = Math.abs(rayLength / dirY);

		// the wall id we hit
		this.hit = 0;

		/*
		A horizontal face corresponds to a side of 1, while a vertical face
		corresponds to a side of 0.
		*/
		this.side = 0;

		// which north, south, west, or east face we hit
		this.face = "";

		/*
		DDA setup step directions and initial side distances (depends on the
		direction of our ray)
		*/
		if (dirX < 0) {
			this.stepX = -1;
			this.sideDistX = (startX - this.mapX) * this.deltaDistX;
		} else {
			this.stepX = 1;
			this.sideDistX = (this.mapX + 1.0 - startX) * this.deltaDistX;
		}
		if (dirY < 0) {
			this.stepY = -1;
			this.sideDistY = (startY - this.mapY) * this.deltaDistY;
		} else {
			this.stepY = 1;
			this.sideDistY = (this.mapY + 1.0 - startY) * this.deltaDistY;
		}

		// find the initial side the ray is "colliding" with
		this.side = (this.sideDistX > this.sideDistY) ? 1 : 0;

		// calculate the initial face the ray is hitting
		if (this.side === 0) {
			// the x direction of the ray is < 0
			if (this.stepX < 0) {
				// west
				this.face = 3;
			} else {
				// the x direction of the ray is > 0, east
				this.face = 1;
			}
		} else {
			// the y direction of the ray is < 0
			if (this.stepY < 0) {
				// north
				this.face = 0;
			} else {
				// the y direction of the ray is > 0, south
				this.face = 2;
			}
		}

		/*
		represents the total distance the ray was cast, the meaning of this
		variable slightly changes depending on whether the ray was cast by 
		the user or the engine
		engine - distance represents the total perpendular distance traveled 
		divided by the focalLength of the camera (not so useful for the user,
		but very useful for the render engine)
		user - distance represents the actual distance the ray has traveled
		*/
		this.distance = 0;
	}

	// casts the ray, this function is meant for the engine and user use
	cast() {
		// assume we haven't already hit a wall
		this.hit = 0;

		// perform DDA casting
		while (this.hit === 0) {
			// increment ray position
			if (this.sideDistX > this.sideDistY) {
				// check in the vertical direction
				this.mapY += this.stepY;
				this.sideDistY += this.deltaDistY;
				this.side = 1;
			} else {
				// check in the horizontal direction
				this.mapX += this.stepX;
				this.sideDistX += this.deltaDistX;
				this.side = 0;
			}

			// check if ray is out of map bounds, manually stop casting if so
			if (this.mapX < 0 ||
				this.mapY < 0 ||
				this.mapX >= this.scene.worldMap.width ||
				this.mapY >= this.scene.worldMap.height) {
				break;
			}

			// if we are in the bounds, check if we hit a wall
			this.hit = this.scene.worldMap.data[
				this.mapX + this.mapY * this.scene.worldMap.width
			];
		}

		/*
		calculate the distance the ray traveled (decrement back one step 
		because our collision detection is one step ahead), the calculation 
		depends on the side that was hit

		also calculate which face we hit (depends on the side hit and the
		direction the ray is traveling), which can be North (0), South (2), 
		East (1), or West (3)
		*/
		if (this.side === 0) {
			this.distance = this.sideDistX - this.deltaDistX;

			// the x direction of the ray is < 0
			if (this.stepX < 0) {
				// we are facing west
				this.face = 3;
			} else {
				// the x direction of the ray is > 0, we are facing east
				this.face = 1;
			}

		} else {
			this.distance = this.sideDistY - this.deltaDistY;

			// the y direction of the ray is < 0
			if (this.stepY < 0) {
				// we are facing north
				this.face = 0;
			} else {
				// the y direction of the ray is > 0, we are facing south
				this.face = 2;
			}
		}
	}
}

export {
	Ray
};