/*
this class represents the orientation of an object in 2d space
it has two parts, a position vector and a direction vector
*/

import { Vector } from "/src/math/vector.js"

export class Orientation {
	// constructor expects 4 numbers as inputs
	constructor(posX, posY, dirX, dirY) {
		if (typeof posX !== "number" ||
			typeof posY !== "number" ||
			typeof dirX !== "number" ||
			typeof dirY !== "number"
		) {
			throw new Error(
				"Orientation constructor must recieve four numbers"
			);
		}
		this.position = new Vector(posX, posY);

		/*
		normalize direction in the case that the user 
		passed a non unit vector
		*/
		this.direction = new Vector(dirX, dirY).normalize();
	}
}