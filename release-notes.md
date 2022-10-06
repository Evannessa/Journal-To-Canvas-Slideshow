## v.0.2.1

**CHANGED**
**Major**

-   Added support for v10 with backwards compatibility
-   v10 version **REQUIRES** right-click on journal image instead of left-click, to avoid interfering with default JournalEntryPage functionality when clicking on an image

## v.0.2.0

**CHANGED**

**Major**

-   Improved image-share controls in actor, item, and journal sheets
    -   Various Display methods can be accessed and activated by hovering over an image and clicking on one of these controls
    -   the original "click on the image to display it on the canvas" functionality remains intact.

**ADDED**

**Major**

-   Scene Gallery Config
    -   Configuration settings
-   Settings and Customization
    -   settings application that can be launched from multiple locations and includes customization options
    -   colored overlays shown on tiles on the canvas whenever you hover a connected UI item, to ensure you can easily find them. - overlay colors are customizable
    -   Color customization of elements UI in JTCS Art Gallery apps, including a default light and dark theme.
-   Compendiums
    -   Compendium pack of macros with featuring utilities to make moving and scaling tiles easier
    -   Compendium pack of premade scenes displaying demo setups of Gallery tiles, including a scene meant to act as your default "Display Scene"
    -   Compendium pack of Journal Entries including a scene meant to act as your default "Display Journal"

**REMOVED**

-   Tile Tool Controls added by the module, including controls/dialog to change Display Method and share URL image.
-   The above tools have been replaced by "Scene Gallery Config" App, which can be accessed from the same place.

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

*   Clicking on image in journal no longer activates the 'Display' scene if a different scene is active. Plan to add functionality later to toggle this behavior.

(Red arrow pointing at new 'Clear Display' button')
!["Location of clear button"](https://i.imgur.com/aPtU9QL.jpg)

!["Showing off updates"](https://media2.giphy.com/media/sIKIPBhN3c5vLPVxGu/giphy.gif)
