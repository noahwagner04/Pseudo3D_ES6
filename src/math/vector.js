/*
basic vector class that will be used in the core of the raycast engine
z component is used to represent object height (components x and y form a
horizontal plane)
*/

export class Vector {

	// constructor expects all number inputs
	constructor(x, y, z) {
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
		this.normalize().scale(newMag);
		return this;
	}

	// gets the squared distance between this vector and another one
	getDistSqBtw(vector) {
		return vector.clone().subtract(this).getMagSqr();
	}

	// gets the actual distance between two vectors
	getDistBtw(vector) {
		return Math.sqrt(this.getDistSqBtw(vector));
	}

	// returns the dot product between this vector and another
	dot(vector) {
		if (this.is2d) {
			// ignore the z component if this vector is 2d
			return this.x * vector.x + this.y * vector.y;
		} else {
			return this.x * vector.x + this.y * vector.y + this.z * vector.z;
		}
	}

	// rotates the vector based on given angles
	rotate(pitch, yaw, roll) {
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
		return Math.acos(this.dot(vector) / (this.getMag() * vector.getMag()));
	}

	/*
	returns the length of the vector projected by this onto the 
	provided vector
	*/
	getScalarProj(vector) {
		return this.dot(vector) / vector.getMag();
	}

	/*
	returns the new vector caused by the shadow of this 
	vector onto another vector
	*/
	project(vector) {
		return this.setTo(vector.clone().setMag(this.getScalarProj(vector)));
	}

	// sets this vector equal to the provided vector
	setTo(vector) {
		this.x = vector.x;
		this.y = vector.y;

		// only set the z component if we are 3d
		if(this.is2d) {
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
}