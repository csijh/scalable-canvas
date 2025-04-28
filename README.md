# Scalable Canvas

The JavaScript module `canvas.mjs` arranges to redraw a canvas at maximum
resolution whenever necessary, to make sure the image remains pin-sharp. The
module exports functions `manageCanvas` and `releaseCanvas`. The `manageCanvas`
function is called with a canvas element and a function `draw` which draws or
redraws the current state of the canvas whenever it is called. The app should
apply only relative coordinate transformations, and should use
`canvas.originalWidth` and `canvas.originalHeight` instead of `canvas.width` and
`canvas.height` to find the coordinate range.

If, for example, an app uses an `app` object which has a `draw` method which is
passed a canvas element to redraw its content, then the `manageCanvas` call
could be:
```
manageCanvas(canvas, ()=>app.draw(canvas));
```

### Background

The HTML5 canvas element provides scalable vector drawing functions, which might
reasonably be expected to look perfect at any size, as with SVG. However, a
canvas is pixel-based, similar to an image. The browser does not change the
resolution of a canvas, but merely rescales its virtual pixels, then maps those
pixels onto device pixels. The result may have low resolution or may look fuzzy,
expecially for text. The situations where this can occur are:

- at any time on a high-density device
- if a user zooms in on a web page
- if a canvas is dynamically resized
- if a canvas is sent fullscreen

The solution is to detect these situations, change the resolution (number of
pixels) of the canvas so that canvas pixels are the same as device pixels, reset
the canvas, and apply a coordinate scaling so that the coordinate range remains
as originally expected.

### Details

A canvas element must have attributes `width` and `height` set to specify both
the resolution, i.e. the number of virtual pixels, and the range of coordinates
to be used to draw on the canvas. The default is `300 x 150`.

A canvas may or may not also have a size specified by setting `style.width` and
`style.height` via JavaScript, or equivalently by setting the style `width` and
style `height` via CSS. If no size is set, the default is to use the `width` and
`height` attributes, treated as browser pixels.

In order to change the resolution of a canvas, the `canvas.mjs` module needs to
change the `width` and `height` on resize events. To make sure this does not
affect the size, the first thing the module does when `manageCanvas` is called
is to find out whether a size is set and, if not, explicitly set it to `width x
height` in browser pixels. (It would be possible to just to track the size,
except that when a canvas exits from fullscreen mode with no size specified, the
browser assumes that the`width` and `height` attributes provide the size before
going fullscreen, which they no longer do.) It turns out to be surprisingly
difficult to detect whether a size is set for a canvas. The only known technique
is to add a low priority stylesheet rule and check whether it affects the actual
size of the canvas.

Browser pixels may be larger than device pixels on a high density device, i.e.
one where `devicePixelRatio` is greater than `1`. Zooming in or out also causes
a change to `devicePixelRatio`. So these two issues are dealt with by tracking
the `devicePixelRatio` value using a media query.

The two remaining situations, i.e. dynamically changing the size of a canvas, or
sending the canvas in or out of fullscreen, can be detected using a resize
observer.

