(Note: Some of the footage below is a teeny bit outdated, with small visual and functional bugs having being fixed since they were recorded; If your interface looks a little bit different than in the videos below, it is due to those updates; but all major functionality should be the same ) 

# Display Methods

- Hovering over an image on an actor, item, or journal entry sheet will display controls that represent different methods by which you can display that image. 

- these controls can be toggled on and off by type or on each individual sheet (see "Cuztomization and Utility Section" for more information)

- You can also click on the image itself, which will send it to whichever tile is selected as "Default" in that scene (see "Default Tiles" section for more information)

https://user-images.githubusercontent.com/13098820/193417395-8f9aef27-7d09-47c2-8f66-a53917edae40.mp4
- display on default tile demo 

## Window Popouts, Display Journal and Dedicated Display Scene - (Upgraded Features) 

Two of the options in the controls allow you to display images in a window popout, or a dedicated Journal Entry

(Note: The window popout option will render a new "popout" window each time you click it, allowing multiple windows for multiple different images, while the Journal Entry option will simply change the image in that specific journal, showing one image at a time, and providing more of a "slideshow" effect.

https://user-images.githubusercontent.com/13098820/193417364-234769f5-4feb-4d5f-8b2e-14582dfecda9.mp4
- journal entry popover demo

You can also have a dedicated "Art Scene" that images are sent to. Images displayed through this method will automatically display on the "Default Art Tile" in that Art Scene (see "Default Tiles" section for more info).

https://user-images.githubusercontent.com/13098820/193417382-25c0aaca-ccc5-4232-b53e-95fe7bb06205.mp4
- art scene demo 

## URL Image Sharing

You can also share images via URLs through the Scene Gallery Config App. 

Clicking on the first button at the top will open up a Dialog window. Here you can paste your image URL, and select whichever display method you would like.

https://user-images.githubusercontent.com/13098820/193662712-8ae3a10d-e917-44a1-8a59-84575101445b.mp4

---

IMPORTANT 

Do be aware that for web security reasons, not all image URLs will work! Some sites do not allow resources like images to be shared "externally".
- See these WikiPedia article for more information [Same-Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) 
- [Cross-Origin Resource Sharing | Wikipedia](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)

---
## URL Image Sharing (Cont.) 

The display methods in the URL Image Sharing Dialog work pretty much identically those available when hovering over a Journal Entry, Actor or Item Sheet. 

The below options are included in both:

- Window - will render a new "popout" window each time you click it, allowing multiple windows for multiple different images
- Art Journal - will simply change the image in your Art Journal, showing one image at a time, and providing a "slideshow" effect.
- Art Scene - will automatically display on the "Default Art Tile" in that Art Scene (see "Default Tiles" section for more info).

Note: A fourth option to Share URLs on specific tiles will be explained below in the Art Gallery section.

## The Art Gallery - (New Features!)

Clicking the top button on the Sheet Image controls will display a button list of all of the tiles in the scene, and clicking on one of those buttons will display the specific image on that tile

https://user-images.githubusercontent.com/13098820/193417360-70ceb7b4-0ab2-4160-afe9-6ee620d22ab5.mp4
- art gallery display demo 

### Art Gallery Config

Open the Art Gallery Config to see all of the Gallery Tiles a scene. 

You can open it by clicking on a button in the "Tiles" controls, or via utility buttons on any Journal Entry, Actor, or Item sheet. 

Contextual instructions about each type of tile will show to the right

Click on the floating i button to toggle contextual instructions on and off.


https://user-images.githubusercontent.com/13098820/193417374-e2e42fbd-684f-4e08-93f2-426473364348.mp4
- config highlight demo

The Gallery Tiles shown in the "Art Gallery Config" automatically change depending on which scene you're viewing.

Upon switching a scene, the Config will update to show that particular scene's Art Gallery tiles.

https://user-images.githubusercontent.com/13098820/193417372-181cfcd0-06ce-4aaa-b8a6-eb71bb9000d4.mp4
- change config based on scene

## Default Tiles

Select a "Default Art Tile" for each scene in the Art Gallery config with Ctrl/Cmd + Click. 
(The "Default" tile will automatically be set to the first "linked" Art Tile in a scene )

https://user-images.githubusercontent.com/13098820/193417379-e38485a1-492d-425d-87de-4862e6406131.mp4
- default Tile demo

Clicking on a sheet image itself, rather than any of its controls, will automatically send it to the "Default Art Tile" in the current scene

https://user-images.githubusercontent.com/13098820/193417395-8f9aef27-7d09-47c2-8f66-a53917edae40.mp4
- display on default tile demo 

Note: If you haven't manually selected a Default Art Tile, the first Art Tile in a scene that is linked to a tile on the canvas will be chosen as the Default Art Tile. 

If there is no Art Tile that fits these conditions, you will receieve a notification that there are no Default Art Tiles in the scene. 


## Art Tiles and Frame Tiles

- A frame tile acts like an "Frame" for the Art Tile.
- The "Frame" Tile will contain the Art Tile within it, making sure it gets no larger than the frame, but maintaining the image's original dimensions/aspect ratio.
- While an "Art Tile" can only have one "Frame Tile", a "Frame" tile can have more than one "Art Tile" linked to it, which can be useful for many reasons.

---

## Tips and Utilities

### Fading Overlapping Elements

There are various ways to fade parts of the UI or tiles on the screen to better see the Highlighted Gallery Tiles on the Canvas.

#### Fading Tiles

Clicking the button with two overlapping squares on a Gallery Tile item in the Scene Gallery Config App will make all tiles in the scene except the one whose button you clicked upon fade out/become partially translucent, allowing you to better see the highlighted area that represents each Gallery Tile if you have lots of tiles overlaid on top of each other. 

![Frame Tile Highlight](https://user-images.githubusercontent.com/13098820/193483999-c455fab0-c7b8-47c7-8884-0c4255da3e94.png) 

#### Fading Journals 

You can fade out the UI of the Journal Entry, Actor, and Item Sheets by clicking the Icon that looks like an Eye in the controls at the Sheets' bottom.

https://user-images.githubusercontent.com/13098820/193676995-9468b148-8ff8-4345-9ab5-92bd2cdf9e42.mp4

The transparency/fade can be toggled off by clicking the eye button once again. 

![FadeToggle](https://user-images.githubusercontent.com/13098820/193677026-b2e2f5ea-0d12-4aab-9e56-bbe6e80ac1f6.gif)

(Note: (QOL/UX Improvement) This feature could be improved so that the Fade Toggle Button itself is fully opaque and visible regardless of if the fade feature is toggled on or off) 

#### Fading the Scene Gallery Config App

This goes similarly for the Scene Gallery Config App. 

https://user-images.githubusercontent.com/13098820/193676928-3709b5c5-2333-4584-8753-404edbde77d9.mp4

(Note: The value dictating how transparent the document Sheets and the Scene Gallery Config App become when the fade function is toggled on can be changed in the JTCS Art Gallery Settings. )
 
<img alt="fade section in config" src="https://user-images.githubusercontent.com/13098820/193680424-a2c4ca00-e01d-4953-bd18-bad417e602a3.png" width="500" height="auto"/>


### Frame Tiles vs Decorative Tiles

Frame Tiles are completely transparent by default, and are used specifically for sizing and positioning Art Tiles, not really meant for displaying anything themselves. If you want the visual of a "Frame" (like a picture frame, a door, a window, etc.) overlayed on top of your Art Tiles, like is demonstrated in the included "Premade Gallery Scene", you could either use 'decorative tiles', tiles on the canvas that are not linked to an Art or Frame tile, and position them manually, or use two Art Tiles bound to the same Frame Tile, with one on top to represent the actual visual "Frame", and another below to repesent the "Art". 

Here's an example of how you could layer the various Gallery tile types with decorative tiles and/or scene foreground/background images

<img alt="tile layer demo diagram" src="https://user-images.githubusercontent.com/13098820/193488971-98cd1084-e597-451f-a42c-a8dc8b90bb26.png" width="500" height="auto"/>



---
## Art and Frame Tiles (Cont.)

By default after an Art Tile is created, or if you select "Use Canvas as Frame", the Art Tile will treat the scene canvas's boundaries as its frame, getting no bigger than that.


https://user-images.githubusercontent.com/13098820/193417331-c6b03f54-550a-40fc-b377-6e18da26ab3c.mp4 
> Art frame tile bounding demo

You can change an Art Tile's "Frame" by selecting a new Frame in the dropdown on the ArtTile.
Hovering over an Art Tile in the Art Gallery Config will also highlight the Frame Tile it was linked to

https://user-images.githubusercontent.com/13098820/193417365-a8ff798e-dc84-4309-893e-7f0e9d7a5802.mp4
> frame and art tile link demo

## Gallery Tile Creation

When creating a new scene or viewing one without Art Gallery tiles, the Art Gallery Config will be blank. 

You can create a new Gallery tile of either type by clicking on the "Create new Frame Tile" or "New Art Tile" buttons at the bottom of each column in the Art Gallery Config. 

By default, these tiles will be "Unlinked", meaning they aren't connected to a 'physical' tile on the canvas. Unlinked tiles will show a warning on them indicating that they aren't linked.

To link an Gallery tile to a 'physical' tile on the Canvas, there are two methods. 

One is to click the "Plus" button on an unlinked tile, which will create a new "blank" tile linked. 


https://user-images.githubusercontent.com/13098820/193417377-b3f0c34d-ae4d-4dcd-b7bb-cc55f1dfd7b8.mp4
> create new tile demo (note: small bug where the Art Tile doesn't immediately update after being linked to the newly created tile, but updates when the Frame Tile is linked to a canvas tile object)

A new Art Tile will be created with a black gradient as its image, while a new frame tile will have a completely transparent image (however you can still highlight both by hovering over them in the Art Gallery Config) 

You can change the 'default' image for both Gallery tile types in the settings, as this also affects what image the Gallery tile 'resets' to if you 'clear' it (more on this functionality to be explained later)

### Linking Preexisting Tiles

If you have pre-existing canvas tiles you wish to turn *into* Gallery Tiles, you can do that too.

Upon creating a new Gallery Tile in the Art Gallery Config, one of the buttons that will appear has a "link" icon. 

Clicking on that button display a list of all the "Unlinked" tile objects in your current scene. 

You can hover over each item in the list to highlight the specific tile on the canvas, and then click to select which one you would like to "link" to the Gallery Tile.

https://user-images.githubusercontent.com/13098820/193632443-f18bc1aa-14f2-486b-bf62-6ef2c23d4028.mp4

This works the same for both Art and Frame Tiles.

## URL Image Sharing on Specific Art Tiles

#TODO

# Utilities, Settings and Customization

You can configure and customize various settings for this module. 

The JTCS Art Gallery settings application can either be accessed as usual through the "Module Settings" tab in Foundry's default settings, or by clicking on this Gear icon in the Art Gallery Config app or on a sheet that has the controls toggled on.

![Launching Settings App](https://user-images.githubusercontent.com/13098820/193644403-03a3c076-7848-487f-9703-e2c1c7a26edb.png)

Here is what the JTCS Art Gallery Settings App looks like

![JTCS Settings App Window](https://user-images.githubusercontent.com/13098820/193644547-9af4fdef-a68f-4d10-ae77-c225b018f4c1.png)

## Color Theme and Color Customization

### Custom Colors

You can change the colors of various UI elements in the JTCS Art Gallery.


https://user-images.githubusercontent.com/13098820/193647498-54f13886-6206-47d9-891c-585421e1cd2b.mp4

(Selecting a new color, and clicking "Apply" to see how it appears. )

The "Accent Color" property affects the colors of buttons, controls and inputs, including the color of the controls in Actor, Journal, and Item Sheets.

![ColorChangeControls](https://user-images.githubusercontent.com/13098820/193647516-718d0c16-b386-4fb6-abb4-cea865b29396.png)

The "Background Color" property affects the background color of the "JTCS Art Gallery Settings" application and the "Scene Gallery Config" application.

![BGColor](https://user-images.githubusercontent.com/13098820/193652877-2b492dc6-eaa2-46b3-a5a7-795a8a844a4e.png)

The "Tile Indicator Colors" affect the colors that represent the different types of Gallery Tiles, both in the UI elements that represent them, and in the color they are highlighted on the canvas when hovering over the items in the UI. 

![FrameArtDefaultColor](https://user-images.githubusercontent.com/13098820/193652903-07fa9141-8d49-4c45-ae66-69231e12ee7f.png)


<img width="961" alt="ColorDemoTemplateFlat" src="https://user-images.githubusercontent.com/13098820/193660437-e01e36c9-1048-4abe-848f-215889f8add2.png">


### Default Dark and Light Theme

There are two default themes included, one Dark and one Light. 

You can switch between them by clicking one of the buttons in the JTCS Art Gallery Settings app, but do be aware that doing so will overwrite any custom colors you have chosen. 

https://user-images.githubusercontent.com/13098820/193636813-99a3c9fd-2e36-4af6-8324-7d42c853bc96.mp4



## Fading
