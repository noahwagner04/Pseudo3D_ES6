// This class is an html canvas wrapper that makes pixel manipulation simpler.

export default class Screen {
	// arguments include screen dimentions and resolution
	constructor(width, height, quality) {
		// check if width input is valid
		if (!Number.isInteger(width) || width <= 0) {
			throw new Error(
				"Screen width must be a positive non-zero integer"
			);
		}

		// check if height input is valid
		if (!Number.isInteger(height) || height <= 0) {
			throw new Error(
				"Screen height must be a positive non-zero integer"
			);
		}

		// check if quality input is valid
		if (typeof quality !== "number" || !(quality > 0 && quality <= 1)) {
			throw new Error(
				"Screen quality must be a number in the range (0, 1]"
			);
		}

		/*
		arguments passed are valid, initialize instance attributes
		width and height are pixel dimentions after css stretch
		*/
		this.width = width;
		this.height = height;
		this.quality = quality;

		// the true width and height of the canvas
		this.renderWidth = Math.round(width * quality) || 1;
		this.renderHeight = Math.round(height * quality) || 1;

		// initialize the canvas element
		this.htmlCanvasElement = document.createElement("canvas");
		this.drawingContext = this.htmlCanvasElement.getContext("2d");

		// set the width and height of the canvas
		this.htmlCanvasElement.width = this.renderWidth;
		this.htmlCanvasElement.height = this.renderHeight;

		// set the css width and height (stretch the canvas)
		this.htmlCanvasElement.style.width = this.width + "px";
		this.htmlCanvasElement.style.height = this.height + "px";

		// prevents pixel blur when css stretches the canvas
		this.htmlCanvasElement.style["image-rendering"] = "pixelated";

		// actual pixel data of the screen
		this.pixels = this.drawingContext.getImageData(
			0,
			0,
			this.renderWidth,
			this.renderHeight
		).data;

		// holds the y depth from the camera for every pixel of the screen
		this.depthBuffer = [];

		// initialize the depth buffer
		for (let i = 0; i < this.renderHeight * this.renderWidth; i++) {
			this.depthBuffer[i] = Infinity;
		}

		// aspect ratio used internally by renderer
		this.aspectRatio = this.renderWidth / this.renderHeight;
	}

	// clears the pixel and depth buffers
	clear() {
		// clear the canvas by drawing an empty ImageData
		let emptyImageData = this.drawingContext.createImageData(
			this.renderWidth,
			this.renderHeight
		);
		this.drawingContext.putImageData(emptyImageData, 0, 0);

		// set the pixels array to the emptyImageData array
		this.pixels = emptyImageData.data;

		// reset the depth buffer
		for (let i = 0; i < this.renderHeight * this.renderWidth; i++) {
			this.depthBuffer[i] = Infinity;
		}
	}

	// sets the pixels array to the current state of the canvas screen
	setPixels() {
		this.pixels = this.drawingContext.getImageData(
			0,
			0,
			this.renderWidth,
			this.renderHeight
		).data;
	}

	// draws the pixels data array to the screen
	update() {
		let tempImageData = new ImageData(
			this.pixels,
			this.renderWidth
		);
		this.drawingContext.putImageData(tempImageData, 0, 0);
	}
}