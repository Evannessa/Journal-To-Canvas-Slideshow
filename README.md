# Journal to Canvas Slideshow

-   [WARNING](#warning)

*   [About the Project](#about-the-project)
    -   [Built With](#built-with)
*   [Installation and Getting Started](#installation-and-getting-started)
*   [How to Use](#how-to-use)
    -   [Full Video Tutorial (Walkthrough of New Features Included)](#full-video-tutorial--walkthrough-of-new-features-included-)
    -   [Written Tutorial with Gifs](#written-tutorial-with-gifs)
    -   [Videos in Journal](#videos-in-journal)
    -   [Display In Window and Module Settings](#display-in-window-and-module-settings)
        -   [Auto-Activate or Auto-Show Toggle](#auto-activate-or-auto-show-toggle)
*   [Changelog](#changelog)
    -   [**v0.1.6** - 2021-06-09](#--v016-----2021-06-09)
    -   [**v0.1.5** - 2021-03-21](#--v015-----2021-03-21)
        -   [Default Tile Control Tools](#default-tile-control-tools)
        -   [Tile Control Tools with Hide Tile Buttons Turned On](#tile-control-tools-with-hide-tile-buttons-turned-on)
    -   [**v0.1.4** - 2021-03-19](#--v014-----2021-03-19)
    -   [**v0.1.3** - 2021-01-22](#--v013-----2021-01-22)
    -   [**v0.1.2** - 2021-01-03](#--v012-----2021-01-03)
    -   [**v0.1.1** - 2020-12-28](#--v011-----2020-12-28)
        -   [**Added**](#--added--)
        -   [**Changes**](#--changes--)
*   [Roadmap](#roadmap)
*   [Code Explanation](#code-explanation)
*   [Motivation](#motivation)
*   [Credits](#credits)
*   [Contact Me](#contact-me)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

## Feature Requests & The Future of Journal to Canvas Slideshow 01-16-2022

With my school workload, I unfortunately don't have time to implement any new features for this module going forward. I will try to fix any bugs that pop up, tweak any minor issues, and continue to keep it updated for major Foundry versions. If you want more/cooler/more flexible features, I would suggest checking out @DarKDinDoN 's amazing module Share Media, which was inspired by and improves upon this module :)
https://github.com/DarKDinDoN/share-media

## WARNING

If your image's source is from somewhere online, there's a chance there will be a CORS issue, and clicking on the image in the journal won't change the tile due to this error. Take a look at the dev console (F12 on Windows) and see if there's an error like this: https://i.imgur.com/SBHQPka.png

If so, for now, try saving/downloading the image and placing it in your Foundry data folder somewhere, then in the journal entry, have the image's source link to that file path instead. I'll try to see if I can find a way around this.

# About the Project

This project brings functionality to images and videos in your Foundry journal entries and allows you to create a Display Scene. You can click on journal images and videos, which will change a tile in the Display Scene to match the image in the journal.

!["Demonstration of module"](https://media4.giphy.com/media/nCBKGGweEGVYObw3ZB/giphy.gif)

This is meant to make sharing art with your players while narrating or reading your notes a lot more seamless. It fits well with Theater of the Mind style play.

## Built With

-   JavaScript
-   JQuery
-   HTML

# Installation and Getting Started

To install this module, go to the Configuration and Setup options in Foundry VTT, click on "Add-on Modules", then "Install Module".

There will be a text box toward the bottom where you can paste this Manifest URL:

https://raw.githubusercontent.com/EvanesceExotica/Journal-To-Canvas-Slideshow/master/module.json

Then click "Install".

# How to Use

## Full Video Tutorial (Walkthrough of New Features Included)

Please click on the image below for a full video tutorial with walk-throughs of new features included:

[![Alt text](https://img.youtube.com/vi/t4NX55vs9gU/0.jpg)](https://www.youtube.com/watch?v=t4NX55vs9gU)

(Click this link if the above doesn't work for some reason):

https://youtu.be/t4NX55vs9gU

---

## Written Tutorial with Gifs

(**NOTE:** The instructions below are a bit outdated compared to the above video which includes explanations of new features and settings, but they still generally apply. )

1. Open your game in FoundryVTT and navigate to the "Scenes" tab.

2. At the bottom of this tab, there will be a button that reads "Create or Show Display Scene".
3. Click that button. A new scene will be generated named "Display", with a single tile with a dark background.

!["Demonstration of Create or Show Display Scene button"](https://media4.giphy.com/media/PHOiojIZhG3hyg4uIm/giphy.gif)

4. If you click on this button again while the Display scene already exists, it will activate the Display scene instead of creating a new one. ~~(**Warning**: _Do not_ rename this scene, as the script searches for a scene named "Display" specifically. I may try to change this in the future so it keeps track of and searches for the scene's ID instead.)~~ (No longer true in v0.1.4 -- see Change Log below for details)

5. You can change the scene's background image and add extra tiles for decoration, ~~but
   make sure that the very first tile on the canvas is the tile you wish to display your images.~~ (No longer necessary in version 0.1.4 -- see Change Log below for details)
6. Open up a journal entry with images (**Note**: This should work with Image Mode journal entries too). You should notice the images highlight and gain a shadow when you hover over them.
7. Clicking on them will cause the tile in the Display scene to resize/reposition and change to match the image you clicked on.
8. Have fun!

---

## Videos in Journal

This project does support .webm and .mp4 files, however inserting a video into a journal entry requires a different approach than using an image.

1. Check out this page: https://www.w3schools.com/html/html5_video.asp and scroll down a bit to the part that says "Example".

2. Open up your journal entry, click the edit button, then click the button along the top that looks like this "< >" to access the entry's source code.

!["Clicking on source code button"](https://i.imgur.com/dUgvvBS.png?1)

3. You can copy and paste the code example shown on the above w3schools site into the source code, and change the file path in quotations (where it says <source="movie.mp4" type="video/mp4">, change the 'movie.mp4' part to be the file path of your .webm or .mp4 video and the type to the matching type "mp4" or "webm").

!["Placing video element in source code"](https://i.imgur.com/uXnoRxU.png=800x600)

4. You can then click on the video, and it will change the Display tile.

!["Clicking on vid to change tile"](https://media0.giphy.com/media/rF4mjVrm5L6Y4MrmSx/giphy.gif)

---

## Display In Window and Module Settings

The module now includes a feature to display your journal images in a window rather than in a dedicated scene. This will allow you to click through and present your 'slideshow' to your players even while they're on another scene, like a battlemap.

!["Display in Window"](https://media.giphy.com/media/2ubtah0ZPWcWtpzyh6/giphy.gif)

(Note: If above gif doesn't display, please click this link to see it: https://media.giphy.com/media/2ubtah0ZPWcWtpzyh6/source.gif)

In order to use this new feature

1. navigate to the "Journal" tab and click on the button that says "Create or Show Display Entry". A journal will be created named "Display Journal".

(_Note_: You can click this button again after the Display Journal is created to show the Display Journal to all of your players.)

2. Navigate to "Journal to Canvas Slideshow"'s settings in the "Module Settings" tab of the "Configure Game Settings" window.

3. You will see a setting called "Display Location", and you can switch it from "Scene" to "Window".

!["Module settings"](https://i.imgur.com/djMriuR.jpg)

4. This will allow clicked-on journal images to be shown in the Display Journal rather than in the Display scene, as demonstrated in the above gif.

( _Note_: For right now, to 'clear' the Display Journal, (while it's selected as the Display Location in the module settings), you can click on the same "ClearDisplay" button under the Tiles section of the scene controls as you would use to clear the tile in the Display scene. This will set the image to a blank/transparent image. I intend to add a button to the actual window later on. )

### Auto-Activate or Auto-Show Toggle

A toggleable option is also included in the module settings to automatically activate the "Display" scene OR automatically show the "Display Journal" window to players when you click on a journal image, depending on which option you have selected for the Display Location setting.

!["Module settings1"](https://i.imgur.com/k3CwDBa.jpg)

(_Note_: A notification appears each time you click a journal image while having this setting turned on in conjunction with the "Window" option for the Display Location setting. This is because it uses the same functionality as the "Show Players" button at the top of a journal in image mode. I'll have to figure out how to change that if possible.)

# Changelog

## **v0.1.8 - v0.1.9** - 2022-01-16

**CHANGED**

-   Updated for Foundry version 9. Check in "releases" for the version still compatible with version 8.

## **v0.1.7** - 2021-08-26

**CHANGED**

-   Integrated features from pull requests, such as item images now being able to be clicked on and displayed. (Thanks, @DarKDinDoN !)
-   Added setting to hide or change how "Toggle Display Location" button in journal header displays.

## **v0.1.6** - 2021-06-09

Updated module to work with Foundry v8.6

## **v0.1.5** - 2021-05-23

**ADDED**

**Major**

-   NEW: Ability to _right click_ on actor sheet character images to display them the same as journal images.

-   NEW: Ability to display Journal-to-Canvas-Slideshow tools within a dialog rather than as tile control tools.

See the settings for **Use Actor Sheet Images** and **Hide Tile Buttons** in the updated module settings below.
!["New Settings"](https://i.imgur.com/AfHLPSG.png)

### Default Tile Control Tools

The default tile control tools with the Hide Tile Buttons setting disabled.

A new button is there called "Switch Display Location" that will display a dialog that allows you to switch display locations without needing to go into the module's settings.

!["Switch Display Location Button"](https://i.imgur.com/3XLHTku.png)

!["Switch Display Location Dialog"](https://i.imgur.com/CBSidW0.png)

**Note**: Journal entries now have a button in the header that allows you to switch the display location as well.

**Note**: You can switch away from the tile control tools and then back again to "refresh" if you enable or disable the Hide Tile Buttons setting.

---

### Tile Control Tools with Hide Tile Buttons Turned On

With the Hide Tile Buttons setting enabled, all Journal-to-Canvas-Slideshow buttons will not be displayed except for the "Clear Display" button, and a new button that says "Show Slideshow Config".

To show the other functions, click on the button in the tile control tools that says "Show Slideshow Config".

!["Hide Tile Buttons Setting Turned On"](https://i.imgur.com/6a7oxpt.png)

The following dialog will appear with buttons with all the functionality, such as creating Display and Bounding Tiles, Setting a URL image, and switching between display locations.

!["Hide Tile Buttons Dialog"](https://i.imgur.com/u5DWfMc.png)

---

**CHANGED**:

-   Many features now work with VIEWED scene rather than ACTIVE scene, such as the bounding tiles.

---

## **v0.1.4** - 2021-03-19

**ADDED**

**Major**:

-   NEW: Bounding Tiles implemented by @Occidio
-   NEW: Display Tiles that along with Bounding Tiles can be added to _any scene_.
-   NEW: Display images via copy-pasting URL feature implemented by @p4535992
-   NEW: Display in Window feature alternative implemented by @DarKDinDoN
-   NEW: Extra settings to accomodate the above new features -- please check the settings menu and reselect your prefered settings.

**Changes**:

**Major:**

-   Special "Display Tiles" now created via button in Tile controls menu. Flagged by script, so no longer have to be very first tile in scene.
-   **Warning**: Please replace regular tile in pre-made Display Scenes with new Display Tile, else the script will not detect them.

## **v0.1.3** - 2021-01-22

**ADDED**

**Major**:

-   NEW: Added option to display journal images in a window rather than display scene

-   NEW: Module settings

## **v0.1.2** - 2021-01-03

**Major:**

-   Fixed an incompatability issue with the Call of Cthulhu 7e (CoC7) system.

## **v0.1.1** - 2020-12-28

### **Added**

**Major:**

-   Added "Clear Display" button in Tiles scene control buttons. Will set 'slideshow' tile to a transparent image.

**Minor:**

-   More visual effects when hovering over and clicking images in journal, for more user feedback
-   Changed cursor to pointer on hover of journal images

### **Changes**

-   Clicking on image in journal no longer activates the 'Display' scene if a different scene is active. Plan to add functionality later to toggle this behavior.

(Red arrow pointing at new 'Clear Display' button')
!["Location of clear button"](https://i.imgur.com/aPtU9QL.jpg)

!["Showing off updates"](https://media2.giphy.com/media/sIKIPBhN3c5vLPVxGu/giphy.gif)

# Roadmap

-   I next intend to add a way to more easily toggle between the various different settings (Display in Window vs Display in Scene, etc.) without needing to go all the way to the settings menu.

-   I may possibily implement a way to have multiple Display Tiles in a single scene, but I will need to think of the best way to implement this.

# Code Explanation

The real 'magic' basically surrounds a single tile. Each time I click on an image in the journal entry, the tile's image source is updated with the source changed to that of the image in the journal that I clicked on.

The script basically goes through the images in a journal entry when it renders, adds a 'clickable-image' class to them, and then looks through the elements with that class and adds an event handler when they're clicked.

This event handler handles changing the tile's source in a specific scene called "Display" to that of the image in the journal.

# Motivation

I love being able to share art with my players. Though I know some groups prefer complete Theater of the Mind using only imagination, images help me and my group with immersion, improv, and with 'pseudo-TOTM' battles when I don't want to use a battlemap.

The motivation behind this project is to have a journal entry with many images, that you can click through to show your players art for characters, locations, monsters, etc. while not having to miss a beat if you also need to narrate.

Years ago I tried to do this using Google Slides, but it was clunky and a pain in the butt. Then another VTT (GM Forge) came along that had this feature and I absolutely loved it, but the VTT stopped being supported.

I then tried to replicate the feature in other VTTs but nothing quite worked the way I wanted.

Upon getting Foundry VTT, I finally learned Javascript, with some help from some StackOverflow posts and reading over the source code for the Image-Drop, Sound-Link and Journal-Links modules helped me figure out how to implement this feature on my own.

# Credits

The following users for their awesome contributions to this module:

@p4535992 https://github.com/p4535992

@Occidio https://github.com/Occidio

@DarKDinDoN https://github.com/DarKDinDoN

@zeel01 for the implementation of their MultiMediaPopout class from their module Show art: https://github.com/zeel01/TokenHUDArtButton

GMForge -- this feature was originally built into [GMForge](https://store.steampowered.com/app/842250/GM_Forge__Virtual_Tabletop/) which I used while it was still supported. I adored this feature and wanted to bring it to Foundry VTT, as I could never quite find another solution that scratched this itch and satisfied me in the same way.

My figuring out how to do this in FoundryVTT is thanks largely to studying the source code of the modules [Drag Upload](https://github.com/cswendrowski/FoundryVTT-Drag-Upload) by _cswendrowski_, [Image-Drop](https://gitlab.com/mesfoliesludiques/foundryvtt-image-drop) by _U~man_, [Journal-Links](https://github.com/Sigafoos/journal-links) by _Sigafoos_ and [Sound-Link](https://github.com/superseva/sound-link) by _superseva_.

Thanks to Joe Neeves whose tabletop art from Gumroad: https://gumroad.com/limonium provided the decorative tiles.

# Contact Me

_Discord_: Eva#3782

_Email_: EvanesceExotica@gmail.com
