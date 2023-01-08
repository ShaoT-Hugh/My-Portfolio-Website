var startPoint = view.center;
var endPoint = new Point(-12, view.center.y);
// create the starting segments of the main path
var startSegment = [], interval = 5;
var segmentAmount = Math.round(view.center.x / interval);
for(var p = 0; p <= segmentAmount; p++) {
    if(p !== segmentAmount) {
        startSegment.push(endPoint + [interval, 0]);
    } else startSegment.push(startPoint);
}

// create the main path
var mainPath = new Path({
    segments: startSegment,
    strokeWidth: 5,
    strokeColor: new Color('hsla(180deg, 50%, 50%, 0.6)'),
    strokeCap: 'round',
});

// create the central shape
var center = new Path.Star({
    center: startPoint,
    points: 5,
    radius1: 27,
    radius2: 55,
    strokeWidth: 6,
    strokeColor: new Color('hsl(180deg, 50%, 20%)'),
    fillColor: new Color('hsl(180deg, 20%, 50%)')
});
// create sub central shapes
var particles = [], particleDir = [];

// drag mouse to change the moving direction of the main path
var initDir = new Point(2, 0), angleOffset = 0.5;
function onMouseDrag(event) {
    var dir = event.point - startPoint;
    if(dir.angle < initDir.angle) {
        initDir.angle -= angleOffset; // make the main path go up
        center.strokeColor.hue += 0.5;
        mainPath.strokeColor.hue += 0.5;
        center.fillColor.hue += 0.5;
    } else {
        initDir.angle += angleOffset; // make the main path go down
        center.strokeColor.hue -= 0.5;
        mainPath.strokeColor.hue -= 0.5;
        center.fillColor.hue -= 0.5;
    }
}

function onFrame(event) {
    center.rotate(1); // rotate the center shape
    // if particle is not enough, create a new particle
    if(particles.length < 10 && Math.random() < 0.2) {
        particles.push(new Path.Star({
            center: center.position, 
            points: 5, 
            radius1: 8 + Math.random() * 5, 
            radius2: 18 + Math.random() * 5,
            fillColor: center.fillColor
        }));
        var newDirection = initDir.clone() * (-1);
        newDirection.angle += Math.random() * 60 - 30;
        particleDir.push(newDirection);
    }
    // update particles
    for(var p = 0; p < particles.length; p++) {
        if(particles[p].fillColor.alpha <= 0) { // remove the particle
            if(particles[p].remove()) {
                particles.splice(p, 1);
                particleDir.splice(p, 1);
            }
        } else { // update the particle
            particles[p].rotate(1);
            particles[p].fillColor.alpha -= 0.01;
            particles[p].translate(particleDir[p]);
        }
    }

    mainPath.add(new Point(mainPath.lastSegment.point + initDir)); // extend the main path
    mainPath.translate(initDir * (-1)); // move back the main path
    // delete the segments out of view
    for(var s = 0; s < mainPath.segments.length; s++) {
        var pos = mainPath.segments[s].point;
        if(pos.x < 0 || pos.y < 0 || pos.x > view.width || pos.y > view.height) mainPath.removeSegment(s);
    }
    mainPath.smooth();
}