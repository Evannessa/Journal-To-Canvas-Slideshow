# ClickImage
Test FoundryVTT Project

Heres the manifest URL: https://raw.githubusercontent.com/EvanesceExotica/ClickImage/master/module.json


## ***UPDATE 12/20/2020***

**Warning**: If your image's source is from somewhere online, there's a chance there will be a CORS issue, and clicking on the image in the journal won't change the tile due to this error. Take a look at the dev console (F12 on Windows) and see if there's an error like this: https://imgur.com/SBHQPka

If so, for now, try saving/downloading the image and placing it in your Foundry data folder somewhere, then in the journal entry, have the image's source link to that file path instead. I'll try to see if I can find a way around this.

This also for now only works with images placed in the text mode journal entries, and not in the image mode. 

-----

## Create or Show Display Scene Button

The button in the scenes tab that says "Create or Show Display Scene" should work now. If you're having trouble setting the Display scene up manually, uninstall and reinstall the module, delete your Display scene and try creating the Display scene by clicking that button (Clicking it again will activate the scene after it already exists).

## .WEBM, .MP4, and videos in journals

This module will work with .MP4 and .WEBM files now, but it searches for a video element in the journal entry which needs to be done a little differently than inserting an image. 

If you want to know how to put a video in the journal, check out this page: https://www.w3schools.com/html/html5_video.asp and scroll down a bit to the part that says "Example". 

Open up your journal entry, click the edit button, then click the button along the top that looks like this "< >" to access the entry's source code. You can copy and paste the code example shown on the above w3schools site  into the source code, and change the file path in quotations (where it says <source="movie.mp4" type="video/mp4">, change the 'movie.mp4' part to be the file path of your .webm or .mp4 video and the type to the matching type "mp4" or "webm").

-----------------------------------------

## Original Post 12/18/2020

Here's some info on how to set things up. Skip to the bottom with the step-by-step if you want to just know how to set up the Display scene.

***Warning***: I'm a noob to Foundry and a mostly self-taught programmer, so this is a hacky and probably inflexible solution. Forgive me  and let me know if something doesn't work right; I'll try to get it fixed up.

***Script explanation***: 

The real 'magic' basically surrounds a single tile. Each time I click on an image in the journal, the tile's image source is updated with the source changed to that of the image in the journal that I clicked on.  

The script basically goes through the images in a journal entry when it renders, adds a 'clickable-image' class to them, and then looks through the elements with that class and adds an event handler when they're clicked.

This event handler handles changing the tile's source to that of the image in the journal.

***So here's how to manually set it up your "Display" scene: (Should be unnecessary with the update)***

1. Create a new scene, name it "Display" — unsure if this is case sensitive, but I'd capitalize it just to be safe.
2. I'm using a 2000px by 2000px scene, but the script should take the size of the canvas into consideration (I think). 
3. Change the "padding percentage" to zero in the scene configuration options.
4. Once the scene is created, create a single tile on the canvas, with whatever generic image as the source. This will be your display tile. **Note**: The script looks for the very first tile in the scene, so don't add any other tiles before the one that you want to show the journal images.
5. The script will handle positioning and sizing the tile depending on the size of the image and page, so don't worry about that. 
6. Decorate the scene as you see fit, changing the background image and adding extra tiles to make it look however you want. But this first tile you placed will be the only one that changes.

If any more experienced programmers have some tips on how to make this better, please let me know. I do plan to release it as an actual module at some point.

----
***Demonstration Video***

https://imgur.com/WryKY4Z