// draw the background board
var board = new Path.Rectangle({
    rectangle: view.bounds,
    radius: [40, 40],
    fillColor: new Color(40 / 255)
});

// preset parameters
var blockCount = 4, width = view.viewSize.width, height = view.viewSize.height;
var border = width * 0.05, padding = width * 0.05;
var blockSize = (width - border * 2 + padding) / blockCount - padding, cellSize = blockSize * 0.02;

// create blocks
var blocks = [];
for(var row = 0; row < blockCount; row++) {
    for(var col = 0; col < blockCount; col++) {
        blocks.push(new Path.RegularPolygon({
            center: [border + blockSize * (0.5 + col) + padding * col, border + blockSize * (0.5 + row) + padding * row],
            // sides: Math.floor(Math.random() * 5) + 3,
            sides: row < 2 ? 4 : (row == 2 ? 6 : 8),
            radius: blockSize / 2,
            strokeWidth: 4,
            strokeJoin: 'round',
            strokeColor: new Color(0.6)
        }));
    }
}

// initialize the paths
var paths = [];
for(var p = 0; p < blocks.length; p++) {
    var interPaths = [];
    for(var e = 0; e < blocks[p].segments.length * 2; e++) {
        var dir = blocks[p].segments[Math.floor(e / 2)].point - blocks[p].position;
        dir.length = cellSize;
        var path = new Path({
            segments: [blocks[p].position],
            strokeWidth: 5,
            strokeJoin: 'round',
            strokeCap: 'round',
            strokeColor: new Color('hsl(' + Math.random() * 360 + 'deg, 50%, 60%)')
        });
        interPaths.push({
            path: path,
            vector: dir
        });
    }
    paths.push(interPaths);
}

function onFrame(event) {
    // update all the paths
    for(var p = 0; p < paths.length; p++) {
        var unitDegree = 0;
        // decide whether change the direction in next step
        if(Math.random() < 0.1) {
            if(Math.random() < 0.5) unitDegree = 360 / blocks[p].segments.length;
            else unitDegree = -360 / blocks[p].segments.length;
        } 
        for(var e = 0; e < paths[p].length; e++) {
            var newPos = paths[p][e].path.lastSegment.point + paths[p][e].vector;
            if(blocks[p].contains(newPos)) { // check if the path is still in the block bound
                paths[p][e].path.lineTo(newPos);
                // chenge the direction of each path
                if(e % 2 === 0) paths[p][e].vector.angle += unitDegree;
                else paths[p][e].vector.angle -= unitDegree;
            } else { // if the path goes beyond the block bound, change the color of the path
                paths[p][e].path.strokeColor = new Color('hsl(' + Math.random() * 360 + 'deg, 50%, 60%)');
                // reverse the direction
                if(e % 2 === 0) paths[p][e].vector.angle += 360 / blocks[p].segments.length;
                else paths[p][e].vector.angle -= 360 / blocks[p].segments.length;
            }
            // delete the excessive segments
            if(paths[p][e].path.segments.length > 20) {
                paths[p][e].path.removeSegment(0);
            }
        }
    }
}