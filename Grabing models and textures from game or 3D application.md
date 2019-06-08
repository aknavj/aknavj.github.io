### THIS ARTICLE IS STILL UNDER CONSTRUCTION

# Grabing Models and Textures from Game or 3D application

## Goal

The main goal of the article is to summarize methods and techniques what you can use to extract 3D Models and Textures from a game or 3D Application. For further reading, I will provide additional links in the description because I don't want to repeat or additionally quote someone who already wrote it.

## Introduction

There are already a few methods of how to grab or export models with textures from any game or application. I would like to divide them into two main groups:
* [Lethal way](https://github.com/aknavj/articles/new/master#lethal-way)
* [Non-leathal way](https://github.com/aknavj/articles/new/master#non-lethal-way)
##### Bonus:
* [Own tool](https://github.com/aknavj/articles/new/master#own-tool)


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
 
* Requires software reverse engineering, such as extracing binary data formats:

  * Third party written extraction tool, which is specialy reverse engineerd for a single 'Game Engine'.

  * Grabbing geometry from video buffer memory using Third party tools. (This is the most easiest way to do)
    * [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm) Is old but still works fine for old games using DirectX 6, 8, 9 and older OpenGL versions.
    * [Ninja Ripper](https://gamebanana.com/tools/5638) Works great for most of games based on DirectX 9 and newer.

### Tutorial / Usage:

### Screenshots / Gallery:
  
## **Non-leathal way**

### Photogrammery method

#### Introduction:
Is an easy method, but time and computing-power consuming. The technique is pretty simple only what you need to do is to take many screenshots as possible from different camera angles in the application and use "processing" application which will generate a 3D model with textures from your screenshots. Quality of the generated 3D model with texture is depended on how many "takes" (screenshots) from different camera angle you did. You can follow this [guide]()

> So, in theory, you are not altering with original data, or reverse engineering ("cracking") file structures from the software vendor's game engine, because you are just taking screenshots. :-)

##### Software:
* [Agisoft Metashape](https://www.agisoft.com/) - What I have used in samples.
* [OpenMVG](https://github.com/openMVG/openMVG)
* [VisualSFM](http://ccwu.me/vsfm/)

#### Tutorial / Usage:

#### Screenshots / Gallery:

### Modding

The most easiest way to extract data from game is to have oficial tools from game/software vendor. 
  
## **Own Tool:** 

### Techniques
