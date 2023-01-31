/*
This file is meant to hold any general handy math equations that will be used 
in the core of the engine.
*/
let Math = {};

/*
remaps a number from the range s1-e1 to the new range s2-e2, expects 
all inputs to be numbers
*/
Math.remap = function(num, s1, e1, s2, e2) {
	// input type checking
	if (typeof num !== "number" ||
		typeof s1 !== "number" ||
		typeof e1 !== "number" ||
		typeof s2 !== "number" ||
		typeof e2 !== "number"
	) {
		throw new Error("remap must recieve five numbers");
	}
	/*
	works in steps:
	1. move the first range start at origin
	2. normalize the range by dividing by the length of the first range
	3. multiply that by the length of the second range
	4. add the offset of the second range
	*/
	return (num - s1) / (e1 - s1) * (e2 - s2) + s2;
}

/*
constrains a number to be within the range min-max
expects all integer inputs, returns x if it lies within the range,
otherwise return min or max depending on if x is below or above the range
*/
Math.constrain = function(num, min, max) {
	// input type checking
	if (typeof num !== "number" ||
		typeof min !== "number" ||
		typeof max !== "number"
	) {
		throw new Error("constrain must recieve three numbers");
	}
	return Math.min(Math.max(x, min), max);
}

export {
	Math
};