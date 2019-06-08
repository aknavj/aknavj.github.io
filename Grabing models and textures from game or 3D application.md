### THIS ARTICLE IS STILL UNDER CONSTRUCTION

# Grabing models and textures from Game or 3D application

There are a few basic concepts how to grab or export models with textures from any game or application. I would like to divide them into two main groups:
* [Lethal way](https://github.com/aknavj/articles/new/master#lethal-way)
* [Non-leathal way](https://github.com/aknavj/articles/new/master#non-lethal-way)
##### Bonus:
* [Own tool](https://github.com/aknavj/articles/new/master#own-tool)


There is many ways and reasons how or why you are want to use obtained data:
* **Studying how it is made:** 3D geometry topology, UV-Maps, level design, etc...
* **To learn programming:** Rendering models, textures because no one wants to look whole life on textured CUBE.
* **Optimising speed-runs:** Some tools can get/show trigger boxes which can be used as exploit.
* **3D printing:** 
* **Creating an impressinve video:** Known as "3D Edit" for example [CS:GO 3D-Edit like NikkyHD, Fuze or maro2k8!](https://www.youtube.com/watch?v=R-fq8o4Do3g)
* **Modding different game:** 
  * Total conversion: for example [Duke Nukem 3D 'Forever' in Serious Sam 3](https://www.youtube.com/watch?v=BDSUeD-WErY)
    * Did you not get a spinoff of your favorite game? Do not worry fan-based developer comunity made one.

## **Lethal way:**
 
Lethal way breaks all Legal agreements with software/game vendor and distributor. Simply you are not supposted to reverse engineer a product or 'steal' any kind of content created by vendor it is their own intelectual property. But we are doing it because it is a fun and most of hardcore fans do not simply care. At least what you can do is not to share "ripped" content for commercial purposes.
 
* Requires software reverse engineering, such as extracing binary data formats:

  * Third party written extraction tool, which is specialy reverse engineerd for a single 'Game Engine'.

  * Grabbing geometry from video buffer memory using Third party tools. (This is the most easiest way to do)
    * [3D Ripper DX](http://www.deep-shadows.com/hax/3DRipperDX.htm) Is old but still works fine for old games using DirectX 6, 8, 9 and older OpenGL versions.
    * [Ninja Ripper](https://gamebanana.com/tools/5638) Works great for most of games based on DirectX 9 and newer.
  
## **Non-leathal way:**

### Photogrammery method:

Is easy method, but time and computing-power consuming. Technique is pretty simple only what you need to do is to take many screenshots as possible from different camera angles in application and use "processing" application which will generate 3D model with textures from your screenshots. Quality of the generated 3D model with texture is depended on how many "takes" (screenshots) from different camera angle you did. You can follow this [guide]()

#### Software
* [Agisoft Metashape](https://www.agisoft.com/) - What I have used in samples.
* [OpenMVG](https://github.com/openMVG/openMVG)
* [VisualSFM](http://ccwu.me/vsfm/)

So in theory you are not altering with original data, or reverse engineering ("cracking") file structures from the software vendor's game engine.

> My personal opinion is using this metod in some way does not alter "The Legal Issue" because only what you are doing are screenshots.

### Modding:

The most easiest way to extract data from game is to have oficial tools from game/software vendor. 
  
## **Own Tool:** 

### Techniques
