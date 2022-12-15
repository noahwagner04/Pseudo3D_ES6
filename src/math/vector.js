/*
basic vector class that will be used in the core of the raycast engine
z component is used to represent object height (components x and y form a
horizontal plane)
*/

export class Vector {

	// constructor expects all number inputs
	constructor(x, y, z) {
		// input type checking
		if (typeof x !== "number" || typeof y !== "number") {
			throw new Error(
				"Vector constructor must recieve at least two numbers"
			);
		}

		if (typeof z !== "number" && typeof z !== "undefined") {
			throw new Error("Vector z component must be a number");
		}

		this.x = x;
		this.y = y;

		// if the user provided a z component, classify the vector as 3d
		if (z) {
			this.z = z;
			this.is2d = false;
		} else {
			this.z = 0;
			this.is2d = true;
		}
	}

	/*
	adds a vectors components to this vectors components
	expects a vector as input
	*/
	add(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.add must recieve an object of type Vector"
			);
		}
		this.x += vector.x;
		this.y += vector.y;

		// only add to z component if we are a 3d vector
		if (!this.is2d) {
			this.z += vector.z;
		}
		return this;
	}

	/*
	adds a number to all vectors components
	expects a number as input
	*/
	addConst(num) {
		// input type checking
		if (typeof num !== "number") {
			throw new Error("Vector.addConst must recieve a number");
		}
		this.x += num;
		this.y += num;

		// only add to z component if we are a 3d vector
		if (!this.is2d) {
			this.z += num;
		}
		return this;
	}

	/*
	subtracts a vectors components to this vectors components
	expects a vector as input
	*/
	subtract(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.subtract must recieve an object of type Vector"
			);
		}
		this.x -= vector.x;
		this.y -= vector.y;

		// only subtracts to z component if we are a 3d vector
		if (!this.is2d) {
			this.z -= vector.z;
		}
		return this;
	}

	/*
	subtracts a number to this vectors components
	expects a number as input
	*/
	subtractConst(num) {
		// input type checking
		if (typeof num !== "number") {
			throw new Error("Vector.subtractConst must recieve a number");
		}
		this.x -= num;
		this.y -= num;

		// only subtracts to z component if we are a 3d vector
		if (!this.is2d) {
			this.z -= num;
		}
		return this;
	}

	// scale this vector by some scalar
	scale(scalar) {
		// input type checking
		if (typeof scalar !== "number") {
			throw new Error("Vector.scale must recieve a number");
		}
		this.x *= scalar;
		this.y *= scalar;

		// only scale z axis if we are a 3d vector
		if (!this.is2d) {
			this.z *= scalar;
		}
		return this;
	}

	// gets the squared magnitude of the vector
	getMagSqr() {
		if (this.is2d) {
			// ignore the z component if we are a 2d vector
			return this.x * this.x + this.y * this.y;
		} else {
			// use z component if we are a 3d vector
			return this.x * this.x + this.y * this.y + this.z * this.z;
		}
	}

	// gets the actual magnitude of the vector
	getMag() {
		return Math.sqrt(this.getMagSqr());
	}

	// sets the length of this vector to 1
	normalize() {
		let mag = this.getMag();

		// prevents division by 0
		if (mag === 0) return this;

		this.x /= mag;
		this.y /= mag;

		// only scale the z component if we are a 3d vector
		if (!this.is2d) {
			this.z /= mag;
		}
		return this;
	}

	/*
	set the vectors current magnitude to a new magnitude
	assumes number input
	*/
	setMag(newMag) {
		// input type checking
		if (typeof newMag !== "number") {
			throw new Error("Vector.setMag must recieve a number");
		}
		this.normalize().scale(newMag);
		return this;
	}

	// gets the squared distance between this vector and another one
	getSqrDistBtw(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.getSqrDistBtw must recieve an object of type Vector"
			);
		}
		return vector.clone().subtract(this).getMagSqr();
	}

	// gets the actual distance between two vectors
	getDistBtw(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.getDistBtw must recieve an object of type Vector"
			);
		}
		return Math.sqrt(this.getSqrDistBtw(vector));
	}

	// returns the dot product between this vector and another
	dot(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.dot must recieve an object of type Vector"
			);
		}

		if (this.is2d) {
			// ignore the z component if this vector is 2d
			return this.x * vector.x + this.y * vector.y;
		} else {
			return this.x * vector.x + this.y * vector.y + this.z * vector.z;
		}
	}

	// rotates the vector based on given angles
	rotate(pitch, yaw, roll) {
		// input type checking
		if (typeof pitch !== "number") {
			throw new Error("Vector.rotate must recieve at least one number");
		}

		// if the vector is 3d, we must recieve all three rotation angles
		if (!this.is2d &&
			(typeof yaw !== "number" || typeof roll !== "number")) {
			throw new Error(
				"Vector.rotate must recieve three numbers if the vector is 3d"
			);
		}

		// coefficients of the rotation matrices
		let cosX = Math.cos(pitch);
		let sinX = Math.sin(pitch);
		let cosY = this.is2d ? 0 : Math.cos(yaw);
		let sinY = this.is2d ? 0 : Math.sin(yaw);
		let cosZ = this.is2d ? 0 : Math.cos(roll);
		let sinZ = this.is2d ? 0 : Math.sin(roll);
		let oldX = this.x;
		let oldY = this.y;
		let oldZ = this.z;

		if (this.is2d) {
			// if we are a 2d vector, rotate using the 2d rotation matrix
			this.x = oldX * cosX - oldY * sinX;
			this.y = oldX * sinX + oldY * cosX;
		} else {
			// if we are a 3d vector, rotate using the 3d rotation matrix
			this.x = oldX * (cosZ * cosY) +
				oldY * (cosZ * sinY * sinX - sinZ * cosX) +
				oldZ * (cosZ * sinY * cosX + sinZ * sinX);
			this.y = oldX * (sinZ * cosY) +
				oldY * (sinZ * sinY * sinX + cosZ * cosX) +
				oldZ * (sinZ * sinY * cosX - cosZ * sinX);
			this.z = oldX * (-sinY) +
				oldY * (cosY * sinX) +
				oldZ * (cosY * cosX);
		}
		return this;
	}

	// gets the angle between this vector and another
	getAngleBtw(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.getAngleBtw must recieve an object of type Vector"
			);
		}
		return Math.acos(this.dot(vector) / (this.getMag() * vector.getMag()));
	}

	/*
	returns the length of the vector projected by this onto the 
	provided vector
	*/
	getScalarProj(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.getScalarProj must recieve an object of type Vector"
			);
		}
		return this.dot(vector) / vector.getMag();
	}

	/*
	returns the new vector caused by the shadow of this 
	vector onto another vector
	*/
	project(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.project must recieve an object of type Vector"
			);
		}
		return this.setTo(vector.clone().setMag(this.getScalarProj(vector)));
	}

	// sets this vector equal to the provided vector
	setTo(vector) {
		// input type checking
		if (!Vector.isVector(vector)) {
			throw new Error(
				"Vector.setTo must recieve an object of type Vector"
			);
		}

		this.x = vector.x;
		this.y = vector.y;

		// only set the z component if we are 3d
		if (this.is2d) {
			this.z = vector.z;
		}

		return this;
	}

	// clones this vector
	clone() {
		if (this.is2d) {
			// only clone x and y components if we are 2d
			return new Vector(this.x, this.y);
		} else {
			// clone all three components if we are 3d
			return new Vector(this.x, this.y, this.z);
		}
	}

	// returns true of argument is an instance of vector
	static isVector(vector) {
		return vector instanceof Vector ? true : false;
	}
}