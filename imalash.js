var program = require('commander');
var lwip = require('lwip');
var getpixels = require("get-pixels");

program.version('0.0.1')
    .option('-w, --width <width>', 'Width of output image')
    .option('-h, --height <height>', 'Height of output image')
    .parse(process.argv);

var filename = program.args[0]
if(!filename){
	console.log("Required filename is missing");
	process.exit(code = 1);
}

lwip.open(filename, function(err, image){
	var width = program.width ? program.width : image.width();
	var height = program.height ? program.height : image.height();
	image.batch()
		.resize(width, height, "cubic")
		.writeFile('imalash.temp.jpg', function(err){
			getpixels('imalash.temp.jpg', 'image/jpeg', dumpPixelArray(image));
			//todo: delete
		});
});

function dumpPixelArray(image){
	return function(err, pixels){
		console.log("Written: " + pixels.shape.slice());
		for(var x = 0; x < image.width() ; x++){
			console.log(pixels.data.get(x));
		}
	}
}
