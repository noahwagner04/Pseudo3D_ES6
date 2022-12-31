/*
The Renderer namespace holds all the core math that actually renderes the 
raycast world. There are several main functions, each of which can be used
stand alone to render only a portion of the world. These functions include:
renderWalls(), renderFloorCeiling(), renderEntities(), renderSkybox().
*/

import Ray from "/src/core/ray.js";
import Texture from "/src/resources/texture.js";
import Color from "/src/resources/color.js";

let Renderer = {};

// renders the walls of a scene
Renderer.renderWalls = function(screen, scene, camera) {
	/*
	the ray we will be using to cast per column of the screen (use a temporary
	direction). Pass the scene to the ray so it can have access to the worldMap
	array
	*/
	let ray = new Ray(
		scene,
		camera.orientation.position.x,
		camera.orientation.position.y,
		0,
		1,
		1
	);

	// for every column of the screen...
	for (let x = 0; x < screen.renderWidth; x++) {
		/*
		remap x from a range of 0 - screen.renderWidth, to -0.5 - 0.5 (this 
		variable is used for the ray direction setup)
		*/
		let cameraX = (x / screen.renderWidth) - 0.5;

		/*
		set up the ray x and y directions, scale the camera direction by 
		focalLength of the camera to get different fov, and scale the camera 
		plane by the aspect ratio of the screen in order to fix horizontal 
		stretch when using a non-square aspect ratio
		*/
		let rayDirX = camera.orientation.direction.x * camera.focalLength +
			camera.plane.x * screen.aspectRatio * cameraX;
		let rayDirY = camera.orientation.direction.y * camera.focalLength +
			camera.plane.y * screen.aspectRatio * cameraX;

		/*
		initialize the ray with the correct direction (use a length of 1 in
		order to avoid using a square root, and to calculate the perpendicular 
		distance)
		*/
		ray.init(
			camera.orientation.position.x,
			camera.orientation.position.y,
			rayDirX,
			rayDirY,
			1
		);

		/*
		save the last drawStart so we can check if further walls must be drawn 
		(in this case, smallest means highest wall)
		*/
		let smallestDrawStart = Infinity;

		// keep casting the ray until it goes out of bounds
		while (1) {

			// cast the ray
			ray.cast();

			// get a local refference to the information about the wall we hit
			let wallInfo = scene.worldMap.cellInfo[ray.hit];

			/*
			if the ray left the bounds of the map, continue casting the next 
			ray
			*/
			if (ray.hit === 0) {
				break;
			}

			/*
			if the hit cell isn't defined in the cellInfo struct, continue
			casting the current ray
			*/
			if (wallInfo === undefined) {
				continue;
			}

			/*
			calculate the height of the column to draw (in pixel coordinates)
			*/
			let lineHeight = screen.renderHeight / ray.distance;

			/*
			the center of the columns that we will be drawing (depends on 
			camera height and pitch)
			*/
			let columnCenter =
				(screen.renderHeight / 2 + camera.pitch) +
				screen.renderHeight *
				((camera.orientation.position.z - 0.5) / ray.distance);

			/*
			now calculate the two endpoints of the column (in pixel 
			coordinates), drawStart depends on the height of the wall
			*/
			let drawStart = Math.floor(columnCenter -
				(lineHeight * wallInfo.height - lineHeight / 2));
			let drawEnd = Math.floor(columnCenter + lineHeight / 2);

			/*
			// the true drawEnd of the column (accounting for potential walls
			infront of this one)
			*/
			let trueDrawEnd = drawEnd;

			// if the top of the projected wall is above the 
			if (drawStart <= smallestDrawStart) {
				/*
				set the drawEnd to the drawStart of the tallest wall in this 
				column of the screen (don't do this if we are the first wall 
				the ray hit, which can be detected if smallestDrawStart is 
				Infinity)
				*/
				trueDrawEnd = smallestDrawStart === Infinity ?
					trueDrawEnd : smallestDrawStart;

				// update the smallestDrawStart (or tallest wall)
				smallestDrawStart = drawStart;
			} else {
				// continue casting ray if this wall is too short to be seen
				continue;
			}

			// try to access the pixels of the appearance
			let drawTexture = wallInfo.appearance.hasLoaded;

			/*
			if the pixel information for the texture doesn't exist, render a 
			color instead
			*/
			if (!drawTexture) {
				// the color we are going to use
				let color;

				/*
				the color could be either from an unloaded texture or the 
				appearance itself could be a color
				*/
				if (wallInfo.appearance instanceof Texture) {
					color = wallInfo.appearance.temporaryColor;
				} else {
					color = wallInfo.appearance;
				}

				// draw the single colored column
				drawColoredColumn(
					screen,
					color,
					ray.distance,
					x,
					drawStart,
					drawEnd
				);

			} else {
				/*
				the pixels array does exist, so calculate relavent variables 
				for texture mapping
				*/

				// where exactly the wall was hit (depends on the side we hit)
				let wallX;
				if (ray.side === 0) {
					wallX = camera.orientation.position.y +
						ray.distance * rayDirY;
				} else {
					wallX = camera.orientation.position.x +
						ray.distance * rayDirX;
				}

				// make wallX relative to the cell it hit
				wallX -= Math.floor(wallX);

				// get the texture x coordinate for the column
				let texX = Math.floor(wallX * wallInfo.appearance.width);

				/*
				flip the texture X coordinate depending on the wall face we hit
				*/
				if (ray.side === 0 && rayDirX > 0) {
					texX = wallInfo.appearance.width - texX - 1;
				}
				if (ray.side === 1 && rayDirY < 0) {
					texX = wallInfo.appearance.width - texX - 1;
				}

				/*
				draw the textured column (pass drawEnd - drawStart instead of 
				lineHeight * wallHeight to avoid weird texturemapping bug)
				*/
				drawTexturedColumn(
					screen,
					wallInfo.appearance,
					texX,
					ray.distance,
					x,
					drawStart,
					trueDrawEnd,
					drawEnd - drawStart
				);
			}
		}
	}
};

Renderer.renderFloorCeiling = function(screen, scene, camera) {
	// get local copies of screen width and height for convenience
	let height = screen.renderHeight;
	let width = screen.renderWidth;

	// find the start and end rows to draw floors or ceilings
	let rowStart = scene.ceiling.enabled ? 0 : Math.floor(height / 2);
	let rowEnd = scene.floor.enabled ? height : Math.floor(height / 2);

	// get the floor appearance
	let floorIsColor;
	let floorAppearance = scene.floor.appearance;

	// get the ceiling appearance
	let ceilingIsColor;
	let ceilingAppearance = scene.ceiling.appearance;

	// figure out if the floor is a color or a texture
	if (floorAppearance instanceof Color) {
		floorIsColor = true;
	} else if (!floorAppearance.hasLoaded) {
		floorIsColor = true;
	} else {
		floorIsColor = false;
	}

	// figure out if the ceiling is a color or a texture
	if (ceilingAppearance instanceof Color) {
		ceilingIsColor = true;
	} else if (!ceilingAppearance.hasLoaded) {
		ceilingIsColor = true;
	} else {
		ceilingIsColor = false;
	}

	// get the initial components of the left and rightmost rays
	let rayDirLX = camera.orientation.direction.x * camera.focalLength -
		camera.plane.x * screen.aspectRatio;
	let rayDirLY = camera.orientation.direction.y * camera.focalLength -
		camera.plane.y * screen.aspectRatio;
	let rayDirRX = camera.orientation.direction.x * camera.focalLength +
		camera.plane.x * screen.aspectRatio;
	let rayDirRY = camera.orientation.direction.y * camera.focalLength +
		camera.plane.y * screen.aspectRatio;

	// for every row of the screen...
	for (let y = rowStart; y < rowEnd; y++) {
		// where the floor and ceiling end
		let horizon = height / 2 + camera.pitch;

		// check if this pixel is on the floor or the ceiling
		// NOTE: make a plane variable (or planeAppearance) that way we don't need to check what plane we are in the inner loop
		let isFloor = y > horizon;

		// get the y position relative to the center of the horizon
		let p = y - horizon;

		// height of camera in pixel coordinates
		let posZ = isFloor ?
			camera.orientation.position.z * height :
			height - camera.orientation.position.z * height;

		// horizontal distance the camera is from the current row
		let rowDistance = Math.abs(posZ / p * camera.focalLength);

		// the delta step from one horizontal pixel to the next
		let floorStepX = (rayDirRX - rayDirLX) *
			(rowDistance / screen.renderWidth);
		let floorStepY = (rayDirRY - rayDirLY) *
			(rowDistance / screen.renderWidth);

		// the world coordinates for the current pixel being evaluated
		let floorX = camera.orientation.position.x + rayDirLX * rowDistance;
		let floorY = camera.orientation.position.y + rayDirLY * rowDistance;

		// for every horizontal pixel in this row...
		for (let x = 0; x < screen.renderWidth; x++) {
			// the index to check the depth and pixel buffer
			let index = x + y * width;

			// if there is something obstructing this pixel, do not draw it
			if(depthBuffer[index] <= rowDistance) {
				// step to the right so the next pixel can be drawn correctly
				floorX += floorStepX;
				floorY += floorStepY;
				continue;
			}

			// the color we will be drawing, will be decided by the code below
			let red;
			let green;
			let blue;

			/*
			decide color based on world position and if we are a ceiling or 
			floor, and what the floor / ceilings appearance is
			*/

			// draw the color
			screen.pixels[index * 4] = red;
			screen.pixels[index * 4 + 1] = green;
			screen.pixels[index * 4 + 2] = blue;

			// increment the world coodinate for the next pixel
			floorX += floorStepX;
			floorY += floorStepY;
		}
	}
};

Renderer.renderEntities = function(screen, scene, camera) {

};

Renderer.renderSkybox = function(screen, scene, camera) {

};

export default Renderer;

// draws a vertical line of one color
function drawColoredColumn(screen, color, depth, x, startY, endY) {

	/*
	constrain start and end coordinates to be within the bounds of the screen
	*/
	if (startY < 0) startY = 0;
	if (endY > screen.renderHeight) endY = screen.renderHeight;

	// for every y pixel in the x column between startY and endY...
	for (let y = startY; y < endY; y++) {
		// 1d index of the current pixel
		let index = x + y * screen.renderWidth;

		// don't draw the color if there is something closer to the camera
		if (screen.depthBuffer[index] < depth) continue;

		// draw the pixel
		screen.pixels[index * 4] = color.red;
		screen.pixels[index * 4 + 1] = color.green;
		screen.pixels[index * 4 + 2] = color.blue;
		screen.pixels[index * 4 + 3] = color.alpha;

		// add the depth to the depth buffer
		screen.depthBuffer[index] = depth;
	}
}

// draws a vertical slice of the texture provided at the given coordinates
// NOTE: make fully transparent pixels not affect the depth buffer
function drawTexturedColumn(
	screen,
	texture,
	texX,
	depth,
	x,
	startY,
	endY,
	lineHeight
) {
	// how much to increase the texture coordinate per screen pixel
	let step = texture.height / lineHeight;

	/*
	start at 0 if the top of the wall is in the bounds of the screen, 
	if the top of the wall is out of bounds, we must start drawing the
	texture at some y offset
	*/
	let texPosY = startY < 0 ? -startY * step : 0;

	/*
	constrain startY and endY to the screen's dimentions before 
	drawing
	*/
	if (startY < 0) startY = 0;
	if (endY > screen.renderHeight) endY = screen.renderHeight;

	// draw the column
	for (let y = startY; y < endY; y++) {
		// index for depthbuffer and pixel screen
		let index = x + y * screen.renderWidth;

		// if there is something obstructing this pixel, don't draw it
		if (screen.depthBuffer[index] <= depth) {
			texPosY += step;
			continue;
		}

		// get the y pixel coordinate of the texture
		let texY = Math.floor(texPosY);

		// get the index to the texture color
		let texIndex = (texX + texY * texture.width) * 4;

		// draw the pixel
		screen.pixels[index * 4] = texture.pixels[texIndex];
		screen.pixels[index * 4 + 1] = texture.pixels[texIndex + 1];
		screen.pixels[index * 4 + 2] = texture.pixels[texIndex + 2];
		screen.pixels[index * 4 + 3] = texture.pixels[texIndex + 3];

		// increment the y texture coordinate
		texPosY += step;

		screen.depthBuffer[index] = depth;
	}
}