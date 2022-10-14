- [JTCS - Art Gallery](#jtcs---art-gallery)
  - [Features, Walkthrough and Changelog](#features-walkthrough-and-changelog)
    - [Walkthrough/Tutorial](#walkthroughtutorial)
    - [Major Feature Additions and Improvements](#major-feature-additions-and-improvements)
      - [**IMPROVED**](#improved)
      - [**NEW**](#new)
    - [Previous Versions Documentation](#previous-versions-documentation)
    - [Changelog/Release Notes](#changelogrelease-notes)
  - [Recommended Modules](#recommended-modules)
  - [Contributors & Thanks](#contributors--thanks)
    - [Code Contributors](#code-contributors)
    - [Visual FX/UI/Assets Contributions](#visual-fxuiassets-contributions)

# JTCS - Art Gallery

Journal to Canvas Slideshow (Now renamed to "JTCS - Art Gallery") has received a major overhaul and several big feature updates.

Now with support for Foundry v10!

In addition to big updates to the core features, and major QOL improvements, the biggest new feature is called the "Art Gallery" which allows you to display multiple different images on multiple different "Art Tiles" in the same scene, bound by "Frame Tiles" that keep the Art Tiles scaled within a certain size.

Here is a video demonstration:

<https://user-images.githubusercontent.com/13098820/193938899-f5920be7-6148-4ac7-9738-8a5ee7d420e9.mp4>

Note: While the wooden scene background and overlay art is included as part of the module in a compendium pack, the tabletop "trinket" assets seen in above video are NOT included as part of the module. They are by [Joe Neeves (Limonium) on Gumroad](https://limonium.gumroad.com/?recommended_by=library).

## Features, Walkthrough and Changelog

### Walkthrough/Tutorial

A detailed walkthrough of the new features can be found here: [Features and Walkthrough](features-and-walkthrough.md)

### Major Feature Additions and Improvements

#### **IMPROVED**

- Added support for Foundry VTT v10, with backwards compability for v9

- Improved image-share controls in actor, item, and journal sheets

  - Various Display methods can be easily accessed and activated by hovering over an image and clicking on one of these controls, rather than having to change the method via settings
  - the Original "click on an image to display it on the canvas" functionality remains intact.

        <img alt="Image Controls Demo" src="https://user-images.githubusercontent.com/13098820/193946807-644aed5c-e6ad-402f-a85f-91947343dbf7.png" width="45%"/>

#### **NEW**

- Gallery Tiles

  - "Gallery Tiles" feature introduced, allowing the creation of "Art Tiles" and "Frame Tiles" (which are an overhauled and much more robust version of the old 'Display Tiles' and 'Bounding Tiles' feature)
  - Gallery Tiles can be created, linked, configured, and given unique names in a new configuration application called the "Scene Gallery Config"

        <img alt="Scene Gallery Config App - Light Mode" src="https://user-images.githubusercontent.com/13098820/193947720-ed4a388f-e22f-466c-b14b-b26c64042c7c.png" width="45%"/>

- Settings and Customization

  - JTCS Art Gallery Settings application that can be launched from multiple locations and includes several customization options
  - Canvas tiles highlight with colored overlays whenever you hover a connected UI item, to ensure you can easily find them.

    - overlay colors are customizable

      - Gallery Tile color customization options in the JTCS Art Gallery Settings App

                        <img alt="Tile Colors Demo" src="https://user-images.githubusercontent.com/13098820/193948186-86e8f4b8-7803-48bc-acef-93bbf54a0a67.png" width="75%"/>

      - Demonstration of how the colors translate to affect the UI elements and canvas tile overlays  
                 <img width="75%" alt="Color Demo Template" src="https://user-images.githubusercontent.com/13098820/193948287-2004ca17-a594-4d92-aec5-ad6e616abc52.png">

  - Color customization of elements UI in JTCS Art Gallery apps, including a default light and dark theme.  
         <img alt="Background Color Change Demo" src="https://user-images.githubusercontent.com/13098820/193948120-316f5f8c-9ea9-4ca2-b42f-cdc3ea7f8eb8.png" width="75%"/>

              <img alt="Scene Gallery Config App - Dark Mode" src="https://user-images.githubusercontent.com/13098820/193947490-3baf8588-c679-4375-be76-0ad88ff892de.png" width="45%"/>
              <img alt="Scene Gallery Config App - Light Mode" src="https://user-images.githubusercontent.com/13098820/193947720-ed4a388f-e22f-466c-b14b-b26c64042c7c.png" width="45%"/>

- Compendiums
  - Compendium pack of macros with featuring utilities to make moving and scaling tiles easier
  - Compendium pack of premade scenes displaying demo setups of Gallery tiles, including a scene meant to act as your default "Display Scene"
  - Compendium pack of Journal Entries including a scene meant to act as your default "Display Journal"

### Previous Versions Documentation

For access to the older/previous version documentation, please see [Old Readme](README-old.md)

### Changelog/Release Notes

Go to [Release Notes](release-notes.md) to view the full changelog/release notes.

## Recommended Modules

- [Tile Sort] by [theripper93](https://github.com/theripper93) - highly recommended for taking the pain out of layering tiles
- [Quickscale](https://foundryvtt.com/packages/quickscale) by [unsoluble](https://foundryvtt.com/community/unsoluble) - will make scaling and rotating tiles easier
- [FX Master](https://foundryvtt.com/packages/fxmaster) by [ghost](https://foundryvtt.com/community/saluu) - for cool visual effects on your Art Gallery scenes
- [Token Magic FX](https://foundryvtt.com/packages/tokenmagic) by [SecretFire](https://foundryvtt.com/community/galaktor) - for adding add filters and effects to tiles

## Contributors & Thanks

Thanks to everyone, both users and contributors, for being patient with me as this project has evolved. This module was one of my first forays into the realm of web development, and I've learned so much since its inception, both through schooling and the painstaking but fulfilling process of gradually trying to make my modules better and better.

This update was a huge undertaking for me, but aso an amazing learning experience, and I hope to continue adding improvements as needed.

I hope everyone enjoys!

### Code Contributors

Thank you to everyone who contributed, added and suggested features, and helped me out while I was still a beginner, including:

- <https://github.com/Occidio> - @Occidio
- <https://github.com/MaximeTKT> - @MaximeTKT
- <https://github.com/p4535992> - @P4535992

### Visual FX/UI/Assets Contributions

- FoundryVTT UI Theme shown in demo vids and images is [Polished UI](https://foundryvtt.com/packages/polished-ui) by [erizocosmico](https://foundryvtt.com/community/erizocosmico)
- Visual FX - [FX Master](https://foundryvtt.com/packages/fxmaster)
- Tabletop Trinket Assets by Joe Neeves (Limonium) on Gumroad - [Limonium's Gumroad Library](https://limonium.gumroad.com/?recommended_by=library)
