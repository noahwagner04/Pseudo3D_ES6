/*
Basic wrapper for an html image element. The main functionality of this class 
is to automatically get the pixel data array of an html image when its finished 
loading. Textures are used to hold pixel information for sprites, walls, the 
ceiling and floor, and skybox textures.
*/

import { Color } from "/src/resources/color.js";

export class Texture {
	/*
	Constructor takes a config object argument, recognized attributes are:
	path, temporaryColor, width, and height. 
	Only required argument is config.path.
	*/
	constructor(config) {
		// check if we recieved a config object
		if (typeof config !== "object") {
			throw new Error(
				"Texture constructor must recieve a config object"
			);
		}

		// there must be a path attribute on the config object
		if (typeof config.path !== "string") {
			throw new Error(
				"Texture must recieve source path of type String for image to load"
			);
		}

		// check if we recieved a valid temporary color
		if (config.temporaryColor) {
			if (config.temporaryColor instanceof Color) {
				this.temporaryColor = config.temporaryColor;
			} else {
				throw new Error(
					"Texture temporaryColor must be of type Color"
				);
			}
		}

		// check to see if we recieved a valid width
		if (config.width !== undefined) {
			if (Number.isInteger(config.width) && config.width > 0) {
				this.width = config.width;
			} else {
				throw new Error("Texture width must be an integer greater than 0");
			}
		}

		// check to see if we recieved a valid height
		if (config.height !== undefined) {
			if (Number.isInteger(config.height) && config.height > 0) {
				this.height = config.height;
			} else {
				throw new Error("Texture height must be an integer greater than 0");
			}
		}

		/*
		to make things simple, either both width and height must be
		supplied, or neither (not one or the other)
		*/
		if ((this.width && !this.height) || (!this.width && this.height)) {
			throw new Error(
				"Texture constructor must receive width and height together"
			);
		}

		// path to the image to load
		this.path = config.path;

		// this will hold the 2d pixel array
		this.pixels = undefined;

		// set true when the image has loaded
		this.hasLoaded = false;

		// the html image element we are going to load
		this.htmlImageElement = new Image(this.width, this.height);

		// set up load listener
		this.htmlImageElement.addEventListener("load", function() {
			// image has loaded, so set loaded bool to true
			this.hasLoaded = true;

			/*
			if no width and height was provided, set the textures 
			width and height to the images width and height
			*/
			if (!this.width && !this.height) {
				this.width = this.htmlImageElement.width;
				this.height = this.htmlImageElement.height;
			}

			/*
			get the pixel information by drawing the image to a 
			temporary canvas
			*/
			let tempCanvas = document.createElement("canvas");
			let ctx = tempCanvas.getContext("2d");

			tempCanvas.width = this.width;
			tempCanvas.height = this.height;

			ctx.drawImage(
				this.htmlImageElement,
				0,
				0,
				this.width,
				this.height
			);

			this.pixels = ctx.getImageData(0, 0, this.width, this.height).data;

		}.bind(this));

		// set up error listener
		this.htmlImageElement.addEventListener("error", function(event) {
			throw new Error("Failed to load image with path " + this.path);
		}.bind(this));

		// set the src for the image to start loading it
		this.htmlImageElement.src = this.path;
	}
}