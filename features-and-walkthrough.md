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

Have a dedicated "Art" scene that images are sent to

https://user-images.githubusercontent.com/13098820/193417382-25c0aaca-ccc5-4232-b53e-95fe7bb06205.mp4
- art scene demo 


## The Art Gallery - (New Features!)

Clicking the top button on the controls will display a button list of all of the tiles in the scene, and clicking on one of those buttons will display the specific image on that tile

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



## Art Tiles and Frame Tiles

- A frame tile acts like an "Frame" for the Art Tile.
- The "Frame" Tile will contain the Art Tile within it, making sure it gets no larger than the frame, but maintaining the image's original dimensions/aspect ratio.
- By default after an Art Tile is created, or if you select "Use Canvas as Frame", the Art Tile will treat the scene canvas's boundaries as its frame, getting no bigger than that.


https://user-images.githubusercontent.com/13098820/193417331-c6b03f54-550a-40fc-b377-6e18da26ab3c.mp4 
- Art frame tile bounding demo

You can change an Art Tile's "Frame" by selecting a new Frame in the dropdown on the ArtTile.
Hovering over an Art Tile in the Art Gallery Config will also highlight the Frame Tile it was linked to

https://user-images.githubusercontent.com/13098820/193417365-a8ff798e-dc84-4309-893e-7f0e9d7a5802.mp4
- frame and art tile link demo

## Gallery Tile Creation

When creating a new scene or viewing one without Art Gallery tiles, the Art Gallery Config will be blank. 

You can create a new Gallery tile of either type by clicking on the "Create new Frame Tile" or "New Art Tile" buttons at the bottom of each column in the Art Gallery Config. 

By default, these tiles will be "Unlinked", meaning they aren't connected to a 'physical' tile on the canvas. Unlinked tiles will show a warning on them indicating that they aren't linked.

To link an Gallery tile to a 'physical' tile on the Canvas, there are two methods. 

One is to click the "Plus" button on an unlinked tile, which will create a new "blank" tile linked. 


https://user-images.githubusercontent.com/13098820/193417377-b3f0c34d-ae4d-4dcd-b7bb-cc55f1dfd7b8.mp4
- create new tile demo (note: small bug where the Art Tile doesn't immediately update after being linked, but updates when the Frame Tile is linked to a canvas tile object)

A new Art Tile will be created with a black gradient as its image, while a new frame tile will have a completely transparent image (however you can still highlight both by hovering over them in the Art Gallery Config) 

You can change the 'default' image for both Gallery tile types in the settings, as this also affects what image the Gallery tile 'resets' to if you 'clear' it (more on this functionality to be explained later)


The second method involves linking a Gallery Tile to a canvas tile object that already exists in the scene. 

TODO (record video) 

# Utilities and Customization

TODO 
