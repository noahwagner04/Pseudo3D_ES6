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

	// where the floor and ceiling end
	let horizon = Math.floor(height / 2 + camera.pitch);

	// find the start and end rows to draw floors or ceilings
	let rowStart = scene.ceiling.enabled ? 0 : horizon;
	let rowEnd = scene.floor.enabled ? height : horizon;

	// a local refference to the appearance of the floor / ceiling
	let floorAppearance = scene.floor.appearance;
	let ceilingAppearance = scene.ceiling.appearance;

	/*
	if the floor is an unloaded texture, set the appearance to the temporary 
	color
	*/
	if (scene.floor.appearance.hasLoaded === false) {
		floorAppearance = scene.floor.appearance.temporaryColor;
	}

	/*
	if the ceiling is an unloaded texture, set the appearance to the temporary 
	color
	*/
	if (scene.ceiling.appearance.hasLoaded === false) {
		ceilingAppearance = scene.ceiling.appearance.temporaryColor;
	}

	// get the initial components of the left and rightmost rays
	let rayDirLX = camera.orientation.direction.x * camera.focalLength -
		camera.plane.x * screen.aspectRatio * 0.5;
	let rayDirLY = camera.orientation.direction.y * camera.focalLength -
		camera.plane.y * screen.aspectRatio * 0.5;
	let rayDirRX = camera.orientation.direction.x * camera.focalLength +
		camera.plane.x * screen.aspectRatio * 0.5;
	let rayDirRY = camera.orientation.direction.y * camera.focalLength +
		camera.plane.y * screen.aspectRatio * 0.5;

	// for every row of the screen...
	for (let y = rowStart; y < rowEnd; y++) {
		// check if this pixel is on the floor or the ceiling
		let isFloor = y > horizon;

		// texture / color going to be rendered by inner loop
		let appearance = isFloor ? floorAppearance : ceilingAppearance;

		// done to avoid using instanceof operator in the nested loop
		let appearanceIsColor = appearance instanceof Color;

		// stretch factor of the appearance
		let cellWidth = isFloor ?
			scene.floor.cellWidth :
			scene.ceiling.cellWidth;
		let cellHeight = isFloor ?
			scene.floor.cellHeight :
			scene.ceiling.cellHeight;

		// get the y position relative to the center of the horizon
		let p = y - horizon;

		/*
		height of camera in pixel coordinates (relative to the current plane 
		being rendered)
		*/
		let posZ = isFloor ?
			camera.orientation.position.z * height :
			height * scene.ceiling.height -
			camera.orientation.position.z * height;

		// horizontal distance the camera is from the current row
		let rowDistance = Math.abs(posZ / p);

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
			if (screen.depthBuffer[index] <= rowDistance) {
				// step to the right so the next pixel can be drawn correctly
				floorX += floorStepX;
				floorY += floorStepY;
				continue;
			}

			// the color we will be drawing, will be decided by the code below
			let red;
			let green;
			let blue;
			let alpha;

			if (appearanceIsColor) {
				/*
				if the appearance is a color, simply set red, green, blue, 
				alpha to appearance attributes
				*/
				red = appearance.red;
				green = appearance.green;
				blue = appearance.blue;
				alpha = appearance.alpha;
			} else {
				/*
				if the appearance is a texture, get the texture coordinates of 
				the color to draw texture coordinates
				*/
				let tx = Math.floor(appearance.width *
					Math.abs(floorX % cellWidth / cellWidth));
				let ty = Math.floor(appearance.height *
					Math.abs(floorY % cellHeight / cellHeight));

				// 1 dimentional index of the texture pixel to use
				let texIndex = (tx + ty * appearance.width) * 4;

				// get the color from the pixels array
				red = appearance.pixels[texIndex];
				green = appearance.pixels[texIndex + 1];
				blue = appearance.pixels[texIndex + 2];
				alpha = appearance.pixels[texIndex + 3];
			}

			// draw the color
			screen.pixels[index * 4] = red;
			screen.pixels[index * 4 + 1] = green;
			screen.pixels[index * 4 + 2] = blue;
			screen.pixels[index * 4 + 3] = alpha;

			// increment the world coodinate for the next pixel
			floorX += floorStepX;
			floorY += floorStepY;

			// update the depth buffer to include this pixel
			screen.depthBuffer[index] = rowDistance;
		}
	}
};

Renderer.renderEntities = function(screen, scene, camera) {
	// for every entity in the scene...
	for (let i = 0; i < scene.gameObject.entities.length; i++) {
		let entity = scene.gameObject.entities[i];

		// get entity position relative to camera position
		let entityX = entity.orientation.position.x -
			camera.orientation.position.x;
		let entityY = entity.orientation.position.y -
			camera.orientation.position.y;

		// y basis vector for camera space
		let dirX = camera.orientation.direction.x * camera.focalLength;
		let dirY = camera.orientation.direction.y * camera.focalLength;

		// x basis vector for camera space
		let planeX = camera.plane.x * screen.aspectRatio / 2;
		let planeY = camera.plane.y * screen.aspectRatio / 2;

		/*
		derotate the relative position of the entity (brings entity position
		in camera space) do this by multiplying the vector (entityX, entityY)
		by the inverse matrix of the camera matrix (whose basis vectors are its
		direction and camera plane)
		*/
		let invDet = 1 / (camera.plane.x * screen.aspectRatio / 2 * dirY -
			dirX * camera.plane.y * screen.aspectRatio / 2);

		// x coordinate of the entity relative to the camera's orientation
		let transformX = invDet * (dirY * entityX - dirX * entityY);

		// y coordinate of the entity relative to the camera's orientation
		let transformY = invDet * (-planeY * entityX + planeX * entityY);

		// don't draw the sprite if it is behind the camera
		if (transformY < 0) continue;

		// x coordinate of center of the projected entity in pixel coordinates
		let entityScreenX = (transformX / transformY + 1) / 2 *
			screen.renderWidth;

		// y coordinate of center of the projected entity in pixel coordinates
		let entityScreenY = (screen.renderHeight / 2 + camera.pitch) -
			((entity.orientation.position.z + (entity.size.y - 1) / 2 -
					(camera.orientation.position.z - 0.5)) /
				transformY) * screen.renderHeight;

		// height of the projected entity on screen
		let entityHeight = (entity.size.y / transformY) * screen.renderHeight;

		// width of the projected entity on screen
		let entityWidth = (entity.size.x / transformY) * screen.renderWidth /
			screen.aspectRatio;

		// column of the screen to start drawing at
		let drawStartX = Math.floor(entityScreenX - entityWidth / 2);

		// column of the screen to stop drawing at
		let drawEndX = Math.floor(entityScreenX + entityWidth / 2);

		// row of the screen to start drawing at
		let drawStartY = Math.floor(
			entityScreenY - entityHeight / 2);

		// row of the screen to stop drawing at
		let drawEndY = Math.floor(
			entityScreenY + entityHeight / 2);

		// constrained drawStartX to bounds of screen
		let columnStart = drawStartX;

		if (columnStart < 0) {
			columnStart = 0;
		} else if (columnStart > screen.renderWidth) {
			columnStart = screen.renderWidth;
		}

		// constrained drawEndX to bounds of screen
		let columnEnd = drawEndX;

		if (columnEnd < 0) {
			columnEnd = 0;
		} else if (columnEnd > screen.renderWidth) {
			columnEnd = screen.renderWidth;
		}

		// whether or not the appearance is a color
		let appearanceIsColor = false;

		// check whether the appearance is a color or not
		if (entity.appearance instanceof Color) {
			appearanceIsColor = true;
		} else if (entity.appearance.hasLoaded === false) {
			appearanceIsColor = true;
		}

		for (let x = columnStart; x < columnEnd; x++) {
			// if the appearance is a color, draw a single colored rectangle
			if (appearanceIsColor) {
				drawColoredColumn(
					screen,
					entity.appearance,
					transformY,
					x,
					drawStartY,
					drawEndY
				);
				continue;
			}

			/*
			the column of the entity texture will be used to render this column
			of the entity
			*/
			let texX = Math.floor((x - drawStartX) / (drawEndX - drawStartX) *
				entity.appearance.width);

			// draw the textured column
			drawTexturedColumn(screen,
				entity.appearance,
				texX,
				transformY,
				x,
				drawStartY,
				drawEndY,
				drawEndY - drawStartY
			);
		}
	}
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
		screen.pixels[index * 4 + 3] = 255;

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

		// if the pixel isn't fully visible, don't draw it
		if (texture.pixels[texIndex + 3] !== 255) {
			texPosY += step;
			continue;
		}

		// draw the pixel
		screen.pixels[index * 4] = texture.pixels[texIndex];
		screen.pixels[index * 4 + 1] = texture.pixels[texIndex + 1];
		screen.pixels[index * 4 + 2] = texture.pixels[texIndex + 2];
		screen.pixels[index * 4 + 3] = 255;

		// increment the y texture coordinate
		texPosY += step;

		screen.depthBuffer[index] = depth;
	}
}