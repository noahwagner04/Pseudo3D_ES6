/*
Basic color class used for rendering walls or sprites that are a constant 
color (or used as a temporary color before textures load)
*/

export class Color {
	// constructor takes 4 integer inputs, red, blue, green, alpha
	constructor(r, g, b, a) {
		// check if inputs are integers, and are within the range 0 - 255
		for (var i = 0; i < 4; i++) {
			if (!Number.isInteger(arguments[i]) ||
				!(arguments[i] >= 0 && arguments[i] <= 255)
			) {
				throw new Error(
					"Color must recieve four integers, each in the range [0, 255]"
				);
			}
		}

		// set the valid inputs
		this.red = r;
		this.blue = g;
		this.green = b;
		this.alpha = a;
	}
}