// Scalable canvas. Free and open source. See licence.txt.
export { manageCanvas, releaseCanvas };

// The aim is to keep canvas drawings crisp:
//   - on high density devices
//   - if the user zooms in with CTRL+
//   - if a canvas is dynamically resized
//   - if a canvas is sent fullscreen

// Call manageCanvas(canvas, draw) with a canvas, and a function for redrawing
// the canvas content. Use canvas.originalWidth and canvas.originalHeight
// instead of canvas.width and canvas.height in scripts.

// Track the set of managed canvases on the page, so they can all be updated on
// changes to the device pixel ratio. Define a media query to detect the
// changes. Set up a resize observer to report changes in the size of a canvas.
let canvases = new Set();
let mediaQuery = setupMediaQuery(null);
let observer = new ResizeObserver(sizeChange);

// Manage a canvas, using a given function to redraw what is on the canvas when
// anything changes. Initialise the canvas, adding it to the set of canvases
// being observed. Set its size separately from its resolution if necessary, and
// do an initial reshaping.
function manageCanvas(canvas, draw) {
    canvas.originalWidth = canvas.width;
    canvas.originalHeight = canvas.height;
    canvas.drawingFunction = draw;
    let g = canvas.getContext("2d");
    g.reset();
    if (canvases.has(canvas)) return;
    canvases.add(canvas);
    setSize(canvas);
    observer.observe(canvas);
    reshape(canvas);
}

// Stop managing a canvas.
function releaseCanvas(canvas) {
    canvases.delete(canvas);
    observer.unobserve(canvas);
    canvas.originalWidth = undefined;
    canvas.originalHeight = undefined;
    canvas.drawingFunction = undefined;
}

// Set the size of a canvas if it doesn't have one. Temporarily add a stylesheet
// to the page with a low specificity class rule, and add a class to the canvas.
// If the rule affects the canvas size, it has no explicit size.
function setSize(canvas) {
    let styles = ":where(.default_size) { width: 12345px; height: 12345px; }";
    let styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    canvas.classList.add("default_size");
    if (canvas.clientWidth == 12345) {
        canvas.style.width = canvas.width + "px";
        canvas.style.height = canvas.height + "px";
    }
    canvas.classList.remove("default_size");
    styleSheet.remove();
}

// Set up a media query to call deviceChange when the device pixel ratio
// changes away from its current value. This is one-shot: after the call, the
// query needs to be changed to the new device pixel ratio.
function setupMediaQuery(old) {
    if (old != null) old.removeListener(deviceChange);
    let query = `(resolution: ${devicePixelRatio}dppx)`;
    let mQ = matchMedia(query);
    mQ.addListener(deviceChange);
    return mQ;
}

// When the observer reports a size change, this function is passed a list of
// entries, one per canvas under observation.
function sizeChange(entries) {
    for (let entry of entries) reshape(entry.target);
}

// This is called when the device pixel ratio changes. Update all the canvases,
// and also update the media query to represent the new value.
function deviceChange() {
    for (let canvas of canvases) reshape(canvas);
    mediaQuery = setupMediaQuery(mediaQuery);
}

// Change the resolution of a canvas to device pixels. It is assumed that the
// canvas has a style-based size, so changing canvas.width and canvas.height
// only causes scaling. Then refit the scene.
function reshape(canvas) {
    let g = canvas.getContext("2d");
    let dpr = devicePixelRatio;
    let w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    g.resetTransform();
    g.scale(dpr, dpr);
    let aspectRatio = canvas.originalWidth / canvas.originalHeight;
    let left = 0, top = 0, scale;
    if (w / h < aspectRatio) {
        top = (h - w / aspectRatio) / 2;
        scale = w / canvas.originalWidth;
    } else {
        left = (w - h * aspectRatio) / 2;
        scale = h / canvas.originalHeight;
    }
    g.translate(left, top);
    g.scale(scale, scale);
    canvas.drawingFunction();
}
