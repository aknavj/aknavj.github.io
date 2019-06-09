### THIS ARTICLE IS STILL UNDER CONSTRUCTION

# Grabing Models and Textures from Game or 3D application

## Goal

The main goal of the article is to summarize methods and techniques what you can use to extract 3D Models and Textures from a game or 3D Application. For further reading, I will provide additional links in the description because I don't want to repeat or additionally quote someone who already wrote it.

## Introduction 

There are already a few methods of how to grab or export models with textures from any game or application. I would like to divide them into two main groups:
* [Lethal way](#lethal-way)
* [Non-leathal way](#non-lethal-way)
##### Bonus:
* [Own tool](#own-tool)


There is many ways and reasons how or why you want to use obtained data:
* **Personal usage:** Just play with it around for a fun.
* **Studying how it is made:** 3D geometry topology, UV-Maps, level design, etc...
* **To learn programming:** Rendering models, textures because no one wants to look whole life on textured CUBE.
* **Optimising speed-runs:** Some tools can get/show trigger which are represented by boxes. This can be used to find an exploit.
* **3D printing:** 
* **Creating an impressinve video:** Known as "3D Edit" for example [CS:GO 3D-Edit like NikkyHD, Fuze or maro2k8!](https://www.youtube.com/watch?v=R-fq8o4Do3g)
* **Modding different game:** 
  * Total conversion: for example [Duke Nukem 3D 'Forever' in Serious Sam 3](https://www.youtube.com/watch?v=BDSUeD-WErY)
    * Did you not get a spinoff of your favorite game? Do not worry fan-based developer comunity made one.

## **Lethal way**
 
### Introduction:
Lethal way breaks all Legal agreements with software/game vendor and distributor. Simply you are not supposed to reverse engineer a product or 'steal' any kind of content created by a vendor it is their own intellectual property. But we are doing it because it is fun and most the hardcore fans do not simply care. At least what you can do is not to share "ripped" content for commercial purposes.
 
> Requires software reverse engineering, such as extracing binary data formats:

* Third party written extraction tool, which is specialy reverse engineerd for a single 'Game Engine'.
  * [Xentax Forum](https://forum.xentax.com/) There are lot of people who are focused in this area and poking around stuff.

* Grabbing geometry from video buffer memory using Third party tools. (This is the most easiest way to do)
  * [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm) Is old but still works fine for old games using DirectX 6x, 8x, 9x.
  > Note instalation is password protected, type: **ripper**
  * [Ninja Ripper](https://gamebanana.com/tools/5638) Works great for most of games based on DirectX 9 and newer.

* Graphics analyzers:
  * Intel Graphic Analyzer
  * GPU PerfStudio
  * Radeon GPU Profiler (GPU Open)

Before you will start to use any Grabbing tool or Graphics analyzers it is a good practice to understand what the Tool does and what is happening inside application. At first, you must be aware that everything you are grabbing is handled by Game Engine of the game itself. Generally, Game Engine has its sub-system called 'Rendering engine' which is in the most common way responsible for managing everything that you see on the screen and in what order it will be displayed. 

The Rendering engine is working with all 3D data structures such as vertices, polygons, UV coordinates, and textures. Under the hood Rendering Engine is also handling their optimization before sending it to the video buffer memory and before it is all displayed in the frame of the application.

> You will find more informations in [Own Tool](#own-tool) section.

So you might grab additional "unwanted" data such as:
* Portals
* Trigger areas (represented by Cube/Box shape or Positional Null Axis)
* Level of details
* Collision-shaped representations (boxes, cylinders, spheres)

### Tutorial / Usage:

Guides to follow: (with litlle more description)
* [Ninja Ripper - oficial guide](http://cgig.ru/en/2012/10/ho-to-use-ninja-ripper/)
* [Ninja Ripper - Nero's Tips & Guides](https://nerotips.tumblr.com/post/159024040760/ninja-ripper-guide)

### Screenshots / Gallery:

### Summary

| Data | Pros | Cons | Note |
|----- |----- | ---- | ---- |
| Models | Single files |  | Randomized without correct naming |
| Textures | Single files |  | Randomly generated name |
| Shaders | Single files | | Shader in assembled structure |
| Legal | x | Breaks Legal agreement | |
  
## **Non-leathal way**

### Photogrammery method

#### Introduction:
Is an easy method, but time and computing-power consuming. The technique is pretty simple only what you need to do is to take many screenshots as possible from different camera angles in the application and use "processing" application which will generate a 3D model with textures from your screenshots. Quality of the generated 3D model with texture is depended on how many "takes" (screenshots) from different camera angle you did. You can follow this [guide](https://www.agisoft.com/pdf/photoscan-pro_1_3_en.pdf) from **page 8 chapter 2**.

> In theory, you are not altering with original data, or reverse engineering ("cracking") file structures from the software vendor's game engine, because you are just taking screenshots. :-)

##### Software:
* Agisoft PhotoScan or [Agisoft Metashape](https://www.agisoft.com/) - What I have used in samples.
* [3DF Zephyr Free](https://www.3dflow.net/3df-zephyr-free/)
* [Autodesk 123D Catch](https://www.autodesk.com/solutions/123d-apps)
* [OpenMVG](https://github.com/openMVG/openMVG)
* [VisualSFM](http://ccwu.me/vsfm/)

#### Example of usage: (Agisoft Metashape)

> If you are not familiar with usage of Agisoft Metashape (Photoscan) you can folow [this guide](https://www.youtube.com/watch?v=Uny9nTr22go)

So as first step I started game, in my case it was [Doom 2016 - Steam version](https://store.steampowered.com/app/379720/DOOM/)). In the game I have used built-in Photo Mode where I taken around 300 screenshots from Free camera. Even that most of my screenshots are blured because I didnt turn off "Motion-blur" in Game Advanced Rendering settings, I think final result just came fine.

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/game_screenshot.jpg)

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/grabbed_screenshots.png)

Drag and drop photos into Agisoft Metashape do a **Photo alignment** which will generate a **Point-cloud data**.

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/image_alignment.png)

After Point-cloud data just **build Mesh**

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/output.jpg)

For a beter texture resolution you can rebuild Texture using **"Build Texture"** with higher resolution settings than defined, I have used 8k resolution which is 4 times bigger than source image resolution (1920x1080).

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/screenshoted_path.png)
![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/output_recomputed_textures_8k.png)

So a little comparsion for final image quality or result.
![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/comparsion.png)

I will not bother you with optimisations and what you can do as next step but I will recommend to reduce polygon mesh by using something like [Simplygon](https://www.simplygon.com/) or [InstaLOD](https://instalod.com/) or built-in functionality like [Cinema 4D](http://www.maxon.net) have called Polygon reduction.

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/photogrammery/reduced_polygons_c4d.png)

#### Files for Download:
* [Source Images]()
* [Agisoft project]()
* [Exported Files](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/files/export.7z)

#### Summary

| Data | Pros | Cons | Note |
|----- |----- | ---- | ---- |
| Models | Generated | Single file  | Might have big file size. Needs optimisition |
| Textures | Generated | Single file | Might have big size. In-correct UV |
| Shaders | Baked | Not included | Shaders are baked in texture |
| Legal | Not altering with legal agreement | x | |

### Modding

The most easiest way to extract data from game is to have oficial tools from game/software vendor. 
  
## **Own Tool:** 

### Techniques
