### THIS ARTICLE IS STILL UNDER CONSTRUCTION

# Grabing Models and Textures from Game or 3D application

#### Goal
```
The main goal of the article is to summarize methods and techniques what you can use to extract 3D Models 
and Textures from a game or 3D Application. For further reading, I will provide additional, explanatory 
links as the article progress for a better understanding.
```
## Introduction 

There are already a few methods of how to grab or export models with textures from any game or application. I would like to divide them into two main groups:

* [Lethal way](#lethal-way)

  Example of usage:
  * [Graphics analyzers](#graphics-analyzers)
  * [Ripper tools](#ripper-tools)
  * [Comparing Data](#comparing-data)
* [Non-lethal way](#non-lethal-way)
  * [Photogrammery method](#photogrammery-method) + Example of usage
  * [Game Modding](#game-modding)
##### Bonus: (This section will come)
* [Own tool](#own-tool)
  * [Prerequisities]()
  * [Theory]()
    * [What is a "data"]()
    * [Trial and error]()
  * [Writing Export Tool]()
    * [Research]()
    * [Execution]()
  * [Writing Ripper Tool]()
    * [Research]()
    * [Execution]()

There is many ways and reasons how or why you want to use obtained data:
* **Personal usage:** Just play with it around for a fun.
* **Study how GFX is made:** 3D geometry topology, UV-Maps, level design, etc...
* **Study how Game engine functions:** Mostly for a viewing rendering optimizations. Check this study of [GTA 5 Rendering engine](http://www.adriancourreges.com/blog/2015/11/02/gta-v-graphics-study/) made by Adrian Courrèges.
* **To learn programming:** Use assets for rendering models, textures because no one wants to look whole life on textured CUBE.
* **Optimizing  speed-runs:** Some tools can get/show trigger which are represented by boxes. This can be used to find an exploit.
* **3D printing:** For example just follow [this instructions!](https://www.instructables.com/id/3D-Printing-Models-from-video-game/)
* **Creating an impressive video:** Known as "3D Edit" for example [CS:GO 3D-Edit like NikkyHD, Fuze or maro2k8!](https://www.youtube.com/watch?v=R-fq8o4Do3g)
* **Modding a game:** 
  * Total conversion: For example [Duke Nukem 3D 'Forever' in Serious Sam 3](https://www.youtube.com/watch?v=BDSUeD-WErY)

## **Lethal way**
 
### Introduction:
Lethal way breaks all Legal agreements with software/game vendor and distributor. Simply you are not supposed to reverse engineer a product or 'steal' any kind of content created by a vendor it is their own intellectual property. But we are doing it because it is fun and most the hardcore fans do not simply care. At least what you can do is not to share "ripped" content for commercial purposes.


* **File extraction tools** - Third party written tools, which are especially reverse engineered for a single purpose, extract targeted data.
  * [Xentax Forum](https://forum.xentax.com/) There are already lot of people in the community who are focused in this area of reverse engineering and poking around stuff.

* **Graphics analyzers** / **profiling tools**: Are designed to grab everything that goes to the memory of Graphic card during a single frame, utilizing frame breakdown, analysis or investigation.
  * [Intel Graphic Analyzer](https://software.intel.com/en-us/gpa)
  * [AMD GPU PerfStudio](https://gpuopen.com/archive/gpu-perfstudio/)
  * [NVIDIA Nsight](https://developer.nvidia.com/nsight-graphics)
  * [RenderDoc](https://renderdoc.org/)

* **Ripper tools** - Third party tools designed for grabbing geometry from video buffer memory. From principle, those tools have the same fundamentals as Graphic analyzers.
  * [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm) Is old but still works fine for old games using DirectX 6x, 8x, 9x.
    > Note: Instalation is password protected, type: **ripper**
  
  * [Ninja Ripper](https://gamebanana.com/tools/5638) Works great for most of games based on DirectX 9x, 10x, 11x and newer.
      * source-code for study is on [github](https://github.com/riccochicco/ninjaripper)
    * [Ninja Ripper - oficial guide](http://cgig.ru/en/2012/10/ho-to-use-ninja-ripper/)
    * [Ninja Ripper - Nero's Tips & Guides](https://nerotips.tumblr.com/post/159024040760/ninja-ripper-guide)
    
  * [GameAssassin](http://www.mediafire.com/file/0a4104rb1ukczas/GameAssassin.zip)
    * [Xentax community usage guide](https://forum.xentax.com/viewtopic.php?t=5913)

Before you will start to use any **Ripper tool** or **Graphics analyzer** it is a good practice to understand what the Tool does and what is happening inside application. 

At first,you must be aware of which Graphics API does the game run and check if tool or software of your selection does support that criteria, otherwise it might not work.
> There are some cases of "software protection" against reverse engineering tools that will disable the functionality of software disassemblers or profilers or even prevent it from running the application. 

The second you must realize that it is impossible to capture Frames per second in real-time from the graphic card, so every time you will do the 'Frame grab', the application will freeze for a few seconds or minutes. 

And for the third, you must be aware that everything you are grabbing is handled by Game Engine of the game itself. Generally, Game Engine has its sub-system called 'Rendering engine' which is in the most common way responsible for managing everything that you see on the screen and in what order it will be displayed.

The Rendering engine is working with all 3D data structures such as vertices, polygons, UV coordinates, and textures. Under the hood  Rendering engine is also handling their optimization before sending it to the video buffer memory and before it is all displayed in the frame of the application.
> You will find more informations in [Own Tool](#own-tool) section.

So you might also grab additional "unwanted" data, which are practically hidden but their representation still exists in video memory such as:
* Portal areas for indoor or outdoor rendering
* Trigger areas (represented by Cube/Box shape or Positional Null Axis)
* Level of details
* Collision-shaped representations (boxes, cylinders, spheres)

### Example of Usage:

The following game selection was made not because I loved those titles, but because there is still a lack of third-party community extraction tools for file formats. They are hard to crack or not interesting enough to give a try. This serves as proof that you can still extract game data from most of the games without official or community support.

* For a Graphics Analyzer section I have used the DirectX 11 game steam-version of [Alien: Isolation](https://store.steampowered.com/app/214490/Alien_Isolation/) from Creative Assembly.

* For Ripper Tools section I choose to use older DirectX 9 game steam-version of [Dead Space 2](https://store.steampowered.com/app/47780/Dead_Space_2/) from Visceral games (EA)

#### Graphics Analyzers

#### Ripper Tools

Using a following software:
* PC Game [Dead Space 2](https://store.steampowered.com/app/47780/Dead_Space_2/) - steam version
* [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm)
* [Ninja Ripper](https://gamebanana.com/tools/5638)
* 3D Studio Max 2010

##### Using 3D Ripper DX 
A 3D Ripper DX is a tool which enables you a grab frame data like 3d models, textures, and shaders. For 3d models it utilizes own file format called ".3DR" so for a successful viewing you must have any version of 3D Studio Max from 2009 to 2014 and installed import plugin which is included in 3D Ripper DX installation. Any other data such as textures (DDS Format) and shaders (Plain Text format) are viewable with common tools included in Windows 10.
> Note: Shaders are in compiled form so you need to understand for DirectX HLSL Shading language with Fixed Function pipeline its instruction set and registers for a proper decomposition. You can follow for example [this guide](https://drivers.amd.com/misc/samples/dx9/FixedFuncShader.pdf)

![](https://github.com/aknavj/articles/blob/master/Grabbing%20Models%20And%20Textures/images/rippingtools/3dripper-first.png?raw=true)

##### Using Ninja Ripper
Usage and principles are almost the same as 3D Ripper DX, but Ninja does not support wireframe mode. 

#### Comparing Data

From results, we are able to see one main difference between **Ninja Ripper** and **3D Ripper DX** is that tool captures the scene before any transformations from GPU shaders, it simply means that characters remain in the T-pose and additional/other geometry is also captured without rotation or deformation. That is one of the reasons why 3D Ripper DX is able to grab only what you are seeing on the screen.

#### Conclusion

I would like to say that every software has its own use case. For example, if I want to create "diorama" scene I will be choosing a **3D Ripper DX** for a "models in motion", on another side if I would like to have non-deformed assets in their original stage I would choose **Ninja Ripper** instead.
 
## **Non-lethal way**

### Photogrammery method

#### Introduction:
Is an easy method, but time and computing-power consuming. The technique is pretty simple only what you need to do is to take many screenshots as possible from different camera angles in the application and use "processing" application which will generate a 3D model with textures from your screenshots. Quality of the generated 3D model with texture is depended on how many "takes" (screenshots) from different camera angle you did. You can follow this [guide](https://www.agisoft.com/pdf/photoscan-pro_1_3_en.pdf) from **page 8 chapter 2**.

> In theory, you are not altering with original data, or reverse engineering ("cracking") file structures from the software vendor's game engine, because you are just taking screenshots.

##### Software:
* Agisoft PhotoScan or [Agisoft Metashape](https://www.agisoft.com/) - What I have used in samples.
* [3DF Zephyr Free](https://www.3dflow.net/3df-zephyr-free/)
* [Autodesk 123D Catch](https://www.autodesk.com/solutions/123d-apps)
* [OpenMVG](https://github.com/openMVG/openMVG)
* [VisualSFM](http://ccwu.me/vsfm/)

#### Example of usage: (Agisoft Metashape)

> If you are not familiar with usage of Agisoft Metashape (Photoscan) you can folow [this guide](https://www.youtube.com/watch?v=Uny9nTr22go)

So as first step I started game, in my case it was [Doom 2016 - Steam version](https://store.steampowered.com/app/379720/DOOM/). In the game I have used built-in Photo Mode where I taken around 300 screenshots from Free camera. Even that most of my screenshots are blured because I didnt turn off "Motion-blur" in Game Advanced Rendering settings, I think final result just came fine.

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

### Game Modding

The most easiest way to extract data from game is to have oficial tools from game/software vendor. 
  
## **Own Tool:** 

### Techniques
