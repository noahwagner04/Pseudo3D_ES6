/*
this class represents the orientation of an object in 2d space
it has two parts, a position vector and a direction vector
*/

import { Vector } from "src/math/vector.js"

export class Orientation {
	// constructor expects 4 numbers as inputs
	constructor(posX, posY, dirX, dirY) {
		this.position = new Vector(posX, posY);
		this.direction = new Vector(dirX, dirY);
	}
}