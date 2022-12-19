var Ray = {};

// user function (uses perform_dda) (returns hit_info)
Ray.cast = function(startX, startY, dirX, dirY) {
	console.log("cast is called");
};

// user function (Ray.cast wrapper) (returns true / false)
Ray.checkObstruction = function(startX, startY, endX, endY) {
	console.log("checkObstruction is called");
};

// engine utility ray cast function (no input type checking, ray length is 1 for internal usage)
export function perform_dda(startX, startY, dirX, dirY, rayLength) {
	console.log("perform_dda is called");
}

export default Ray;