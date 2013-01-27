CustomCursor.js
=============

## A cross-browser, cross-platform way to use the kind of cursor you want.

Are you writing a desktop-like web application and want to control the cursor's look and feel? Why, yes, of course. The cursor is an important part of the user experience. You noticed that the CSS `cursor` property only has limited capabilities. You tried using the `url()` value, but messed up the different file types and got stuck, when you tested it in Opera.
*CustomCursor.js* is meant to overcome these limitations.
It detects whether the browser is capable of using the `url()`-value and creates an HTML-based *fake cursor* in case it's not.

## Awesomeness

+ Native first — Uses the CSS-based `url()`-cursor wherever possible
+ requestAnimationFrame goodness — To improve the overall fluency it syncs its rendering with the browser's repaint cycle if possible
+ canvas support — If given a canvas element and detected support for cursor-images it sets the `url()`-value to a base64-representation of the canvas' content
+ Maximum efficiency — Performance was the number one key feature tried to gain throughout the whole development
+ Pure VanillaJS — No dependencies at all. No Mootools, no PrototypeJS, no jQuery

## How do I use it?

Create a new cursor:

    var myCursor = new CustomCursor("myCursorImage.png"); // Path to an image file
    myCursor = new CustomCursor("<div style='width: 1px; height: 1px; background: blue;'></div>"); // HTML-String will be turned into DOM Nodes internally
    myCursor = new CustomCursor(new Image("myCursorImage.png")); // If possible, the image source of HTML image elements is taken to set a cursor's url()-property
    myCursor = new CustomCursor(document.getElementsByTagName("canvas")[0]); // Like with image elements, if possible, the cursor's url()-property is set to an base64-representation of the canvas content

Position a cursor:

    // Either:
    myCursor = new CustomCursor(whatever, 10, 10); // The second and third argument are the cursor's position
    
    // Or:
    myCursor.setPosition(10, 10); // After instantiating the cursor's position can be set by calling setPosition

Set the cursor to an element:

    myCursor.setElement(document.getElementById("myTargetNode")); // Set one element with setElement
    myCursor.setElements(document.querySelectorAll("[data-cursor=mycursor]")); // Set multiple elements with setElements

An internal *cursor registry* will keep track of which cursor is attached to which element and makes sure that an element is not attached to two cursors at the same time.

Remove an element from a cursor:

    myCursor.removeElement(document.getElementById("myTargetNode")); // Remove one element with removeElement
    myCursor.removeElements(document.querySelectorAll("[data-cursor=mycursor]")); // remove multiple elements with removeElements

Delete a cursor:

    myCursor.destroy(); // Removes all references to the cursor instance


## Downsides

This script is quite new and having the ability to create a cross-browser, cross-platform, ultra-performant custom cursor is anything but an easy undertaking. Here are some shortcomings and major bugs, all relating to custom cursor's in "html"-mode when we don't fall back to the browser's native CSS support:

- Not enough testing — This is like the pre-alpha-alpha version. Only the basic functionality works so far in all major browsers ...on my Mac. I haven't tested it on Windows yet. It should work in IE, even the old IEs. Only testing will show.
- No inheritance — Some complicated stuff is going on internally. So far, it prevents support for inheriting the cursor from an element's parent.
- Mouseout-Messup — When entering an element which is attached to a custom cursor, the cursor element will be displayed at the position where the target element is. So, the cursor has entered the target element and then immediatly enters a new element (the cursor element). That's why, technically, it leaves the target element. That causes the browser to fire a mouseout event in the very second the user just entered the element. To complete this mess, an actual mouseout-Event is never fired.
- No Touch-Devices — Touch-Devices don't have any cursor's at all. The script needs to detect a touch device and disable it's custom cursor functionality completely.
- No automatic Canvas-updates — To improve performance, the canvas is read and its image is used for the native CSS cursor. However, that means changes to the canvas don't apply to the cursor. The cursor must be updated. Therefore we have the update()-function, but it's really not the best solution.
- Left cursor — We don't register when the actual cursor leaves the window. That's why our fake cursor is left on the document. Very bad
- No manipulations, please — To improve performance the target element's size is read out just one time, when the cursor enteres the element. The element's children are also read out and marked as areas where the cursor shouldn't apply to (that's the reason for missing inheritance, see above). However, that means, we don't notice when the children's dimensions are manipulated while the cursor is still on top of them.
- No Documentation — I just coded. And coded. In two weeks I have no idea what I've written there.
