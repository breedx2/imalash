var program = require('commander');
var lwip = require('lwip');
var getpixels = require('get-pixels');
var fs = require('fs');

program.version('0.0.1')
    .option('-w, --width <width>', 'Width of output image')
    .option('-h, --height <height>', 'Height of output image')
    .option('-d, --decimal', 'Print RGB decimal notation instead of hex')
    .option('-t, --temp', 'Save the resize temp file')
    .option('-s, --simple', 'Simple output: a 1 dimension array with defined bounds')
    .parse(process.argv);

var filename = program.args[0]
if(!filename){
	console.log("Required filename is missing");
	process.exit(code = 1);
}

lwip.open(filename, function(err, image){
	var width = program.width ? program.width : image.width();
	var height = program.height ? program.height : image.height();
	var tmpFileName = 'imalash.temp.png';
	var tmpFormat = 'image/png';
	image.batch()
	    .resize(width, height, "grid")
		.writeFile(tmpFileName, function(err){
			getpixels(tmpFileName, tmpFormat, dumpPixelArray(image));
			if(!program.temp){
				fs.unlink(tmpFileName);
			}
		});
});

function format(pixels, x, y, z){
	if(program.decimal){
		return parseInt(pixels.get(x, y, z));
	}
	return hexify(pixels, x, y, z);
}

function hexify(pixels, x, y, z){
	var suffix = pixels.get(x, y, z).toString(16).toUpperCase();
	if(suffix.length < 2){
		suffix = "0" + suffix;
	}
	return "0x" + suffix;
}

function printRGB(pixels, x, y){
	var r = format(pixels, x, y, 0);
	var g = format(pixels, x, y, 1);
	var b = format(pixels, x, y, 2);
	process.stdout.write(r + "," + g + "," + b);
}

function dumpPixelArray(image){
	return function(err, pixels){
		var varname = filename.replace(/\..*/, '');
		if(program.simple){ //output a single dimension array with variables indicating parse info
			process.stdout.write("uint8_t const " + varname + "[" + (image.height() * image.width() * 3) + "] PROGMEM = {");
			for(var y = 0; y < image.height() ; y++){
				if(y > 0){
					process.stdout.write(', ');
				}
				for(var x = 0; x < image.width() ; x++){
					if(x > 0){
						process.stdout.write(', ');
					}
					printRGB(pixels, x, y);
				}
			}
			process.stdout.write("};\n");
			process.stdout.write("uint8_t const " + varname + "_w = " + image.width() + ";\n");
			process.stdout.write("uint8_t const " + varname + "_h = " + image.height() + ";\n");

		} else { //output a 3D array with dimensions [image.height][image.width][3]
			process.stdout.write("uint8_t const " + varname + "[" + image.height() + "][" + image.width() + "][3] PROGMEM = {");
			for(var y = 0; y < image.height() ; y++){
				if(y > 0){
					process.stdout.write(', ');
				}
				process.stdout.write("\n\t{");
				for(var x = 0; x < image.width() ; x++){
					if(x > 0){
						process.stdout.write(', ');
					}
					process.stdout.write("{")
					printRGB(pixels, x, y);
					process.stdout.write("}");
				}
				process.stdout.write("}");
			}
			process.stdout.write("\n};");
		}
	}
}
