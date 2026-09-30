"""Original metre-scale assets. Blender 5.2: --background --python scripts/build-landmarks.py.
Author in Blender Z-up; glTF exporter converts to Y-up. No external assets or bake claims.
The deterministic script is the editable source. Batch by material before export.
"""
import bpy, math, json, pathlib, hashlib
from mathutils import Vector

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / 'lib/world/landmark-spec.json').read_text())
OUT = ROOT / 'public/world/models'
OUT.mkdir(parents=True, exist_ok=True)

def material(name, rgb, rough=.5, metal=0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    # Hex colours converted from display sRGB to scene-linear before glTF export.
    c = [int(rgb[i:i+2], 16)/255 for i in (1,3,5)]
    c = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in c]
    p.inputs['Base Color'].default_value = (*c,1)
    p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    return m

def mesh(name, vertices, faces, mat, bevel=0):
    data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    for p in data.polygons:p.use_smooth=True
    if bevel:
        mod=obj.modifiers.new('Manufactured edge radius','BEVEL');mod.width=bevel;mod.segments=2
    return obj

def box(name, p, s, mat, bevel=.06):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p);o=bpy.context.object;o.name=name;o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Edge radii','BEVEL');mod.width=bevel;mod.segments=3
        normal=o.modifiers.new('Face normals','WEIGHTED_NORMAL')
    return o

def tube(name, points, radius, mat):
    curve=bpy.data.curves.new(name,'CURVE');curve.dimensions='3D';curve.resolution_u=1
    curve.bevel_depth=radius;curve.bevel_resolution=2
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    obj=bpy.data.objects.new(name,curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(mat)
    return obj

def cylinder(name, a, b, radius, mat, vertices=24):
    d=Vector(b)-Vector(a)
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=d.length,location=(Vector(a)+Vector(b))/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();o.data.materials.append(mat)
    mod=o.modifiers.new('Edge radii','BEVEL');mod.width=min(.12,radius*.15);mod.segments=2
    for p in o.data.polygons:p.use_smooth=True
    return o

def clear():
    bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)

def export(name):
    for o in list(bpy.context.scene.objects):
        if o.type in ('CURVE','MESH'):
            bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o
            bpy.ops.object.convert(target='MESH')
    groups={}
    for o in bpy.context.scene.objects:
        if o.type=='MESH':groups.setdefault(o.data.materials[0].name,[]).append(o)
    for objects in groups.values():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
        objects[0].name=name+' / '+objects[0].data.materials[0].name
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_yup=True,export_apply=True,export_texcoords=True,export_normals=True)
    tris=sum(len(o.data.loop_triangles) for o in bpy.context.scene.objects if o.type=='MESH')
    print('ASSET',name,'material batches',len(groups),'bytes',(OUT/(name+'.glb')).stat().st_size)
    if name != 'ship-hull':
        for o in bpy.context.scene.objects:
            if o.type=='MESH':
                mod=o.modifiers.new('Lightweight geometry budget','DECIMATE');mod.ratio=.38
        bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'-low.glb')),export_format='GLB',export_yup=True,export_apply=True,export_texcoords=True,export_normals=True)


clear()
shell=[material('Titanium '+str(i),c,.4,.5) for i,c in enumerate(['#465d61','#495f63','#475e62'])]
wet=material('Immersed ceramic coating','#243e43',.27,.28)
seam=material('Recessed joints','#182d34',.62,.25)
glass=material('Observation glazing','#356875',.17,.58)
bronze=material('Anodised bronze','#b49a73',.34,.7)
concrete=material('Marine concrete','#999d90',.87)
white=material('Warm enamel','#e0e2d7',.38,.18)
deck=material('Deck grating','#5b6968',.72,.45)

R=SPEC['observatory']['radius']
def spherepoint(r, lat, lon):return (r*math.cos(lat)*math.cos(lon),r*math.cos(lat)*math.sin(lon),r*math.sin(lat))
# The complete pressure shell, including lower hemisphere, uses spherical patches.
# Window patches replace shell patches; they are never flat rectangles floating above it.
bounds=[-90,-65,-45,-25,-7,5,10,14,24,28,45,65,90]
for j in range(len(bounds)-1):
    for k in range(24):
        lat0,lat1=[math.radians(v) for v in bounds[j:j+2]]
        a0=k*math.tau/24;a1=(k+1)*math.tau/24
        window=j in (5,8) and (14<=k<=21 or 4<=k<=6)
        mat=glass if window else wet if j<4 else shell[(k+j)%3]
        radius=R-.07 if window else R
        verts=[];faces=[];nu,nv=8,6
        for v in range(nv+1):
            lat=lat0+(lat1-lat0)*v/nv
            for u in range(nu+1):verts.append(spherepoint(radius,lat,a0+(a1-a0)*u/nu))
        for v in range(nv):
            for u in range(nu):
                i=v*(nu+1)+u;faces.append((i,i+1,i+nu+2,i+nu+1))
        o=mesh('Curved window' if window else 'Spherical shell panel',verts,faces,mat)
        o.data.set_sharp_from_angle(angle=math.pi)
        o.data.normals_split_custom_set_from_vertices([Vector(v).normalized() for v in verts])
        if j>=4 and j<11:
            tube('Recessed panel seam',[spherepoint(R+.012,lat0,a0+(a1-a0)*i/12) for i in range(13)],.028,seam)
            tube('Meridian joint',[spherepoint(R+.012,lat0+(lat1-lat0)*i/12,a0) for i in range(13)],.026,seam)
        if window:
            for lat in [lat0,lat1]:tube('Window reveal',[spherepoint(R+.05,lat,a0+(a1-a0)*i/12) for i in range(13)],.11,bronze)
            for u in range(3):tube('Curved mullion',[spherepoint(R+.04,lat0+(lat1-lat0)*i/8,a0+(a1-a0)*u/3) for i in range(9)],.07,bronze)
# Fixed landing on east side with human-scale railing, airlock and boat fenders.
box('Lateral landing',(40,0,-1),(17,15,1),concrete,.25)
box('Deck surface',(40,0,-.43),(16.5,14.5,.15),deck)
box('Entry airlock',(34.7,0,2),(5,4,5),shell[1],.3)
box('Entry glazing',(37.25,0,2),( .08,2.5,3.6),glass,.02)
box('Entry canopy',(37,0,4.8),(5,5,.25),bronze)
for x in [34,47]:
    for y in [-6,6]:
        cylinder('Landing pile',(x,y,-39),(x,y,-1),.65,concrete)
        cylinder('Guardrail post',(x,y,0),(x,y,1.2),.045,bronze)
for y in [-7,7]:
    tube('Landing guardrail',[(32,y,1),(48,y,1)],.045,bronze)
    for x in range(32,49,2):cylinder('Guardrail stanchion',(x,y,-.3),(x,y,1),.04,bronze)
for x in [33,47]:
    for y in [-7.2,7.2]:cylinder('Berthing fender',(x,y,-2),(x,y,0),.25,seam)
for y in [-.6,.6]:cylinder('Service ladder',(48,y,-4),(48,y,1),.045,bronze)
for z in range(-4,2):cylinder('Ladder rung',(48,-.6,z),(48,.6,z),.04,bronze)
# Deep foundation below the complete sphere, on the surveyed excavated bed.
cylinder('Gravity foundation',(0,0,-42),(0,0,-39),22,concrete,64)
for x in [-12,12]:
    for y in [-12,12]:cylinder('Bearing pier',(x,y,-40),(x,y,-28),2.3,concrete)
cylinder('Roof access hatch',(0,0,34.8),(0,0,35.4),1.5,bronze)
export('observatory')

clear()
# Pressure habitat: continuous rounded capsule, reinforcing ribs, windows and pressure lock.
def capsule():
    verts=[];faces=[];profile=[];half=11.1;r=3.4
    for i in range(13):
        a=-math.pi/2+i*math.pi/24;profile.append((-half+r*math.sin(a),r*math.cos(a)))
    profile.append((half,r))
    for i in range(1,13):
        a=i*math.pi/24;profile.append((half+r*math.sin(a),r*math.cos(a)))
    for x,rad in profile:
        for k in range(48):
            a=k*math.tau/48;verts.append((x,rad*math.cos(a),rad*math.sin(a)))
    for j in range(len(profile)-1):
        for k in range(48):i=j*48+k;n=j*48+(k+1)%48;faces.append((i,n,n+48,i+48))
    return mesh('Pressure hull',verts,faces,white)
capsule()
for x in [-10,-5,0,5,10]:
    tube('Pressure frame',[(x,3.46*math.cos(k*math.tau/64),3.46*math.sin(k*math.tau/64)) for k in range(65)],.16,bronze)
for x in [-7.5,-2.5,2.5,7.5]:
    for side in [-1,1]:
        cylinder('Porthole reveal',(x,side*3.1,.6),(x,side*3.48,.6),1.08,seam,40)
        cylinder('Porthole glass',(x,side*3.48,.6),(x,side*3.53,.6),.86,glass,40)
        tube('Porthole rim',[(x+1.02*math.cos(k*math.tau/40),side*3.55,.6+1.02*math.sin(k*math.tau/40)) for k in range(41)],.09,bronze)
for x in [-10,10]:
    box('Saddle',(x,0,-3),(2,8,1),deck,.2)
    for y in [-3,3]:cylinder('Seabed pile',(x,y,-6),(x,y,-3),.55,concrete)
    box('Footing',(x,0,-6),(4,10,1),concrete,.2)
cylinder('Pressure lock',(13,0,0),(21,0,0),1.7,white,48)
for x in [15,20]:tube('Lock flange',[(x,1.85*math.cos(k*math.tau/48),1.85*math.sin(k*math.tau/48)) for k in range(49)],.2,bronze)
for y in [-1.5,1.5]:tube('Service conduit',[(-11,y,2.8),(-8,y,3.8),(10,y,3.8),(14,y,2.2)],.14,deck)
box('Maintenance walk',(0,-4,-2.4),(24,2,.25),deck)
for x in range(-12,13,3):cylinder('Walk handrail',(x,-5,-2.3),(x,-5,-1.2),.035,bronze)
tube('Walk rail',[(-12,-5,-1.2),(12,-5,-1.2)],.04,bronze)
export('habitat')

clear()
# Unit swept ship hull; scales to each existing vessel's beam and length in the scene.
verts=[];faces=[]
stations=[(-.5,.24),(-.46,.40),(-.35,.49),(-.1,.5),(.2,.48),(.35,.36),(.44,.19),(.5,0.015)]
for y,w in stations:
    for x,z in [(-w,.5),(-w*.96,-.12),(-w*.65,-.8),(0,-1),(w*.65,-.8),(w*.96,-.12),(w,.5)]:verts.append((x,y,z))
for j in range(len(stations)-1):
    for k in range(6):i=j*7+k;faces.append((i,i+7,i+8,i+1))
faces.extend([tuple(range(6,-1,-1)),tuple(range((len(stations)-1)*7,len(stations)*7))])
mesh('Swept displacement hull',verts,faces,shell[0])
export('ship-hull')

clear()
# Continuous annular floors/roof and a circular envelope replace crossed box segments.
def annulus(name, inner, outer, base, height, mat):
    v=[];f=[];n=192
    for z,r in [(base,inner),(base,outer),(base+height,inner),(base+height,outer)]:
        for i in range(n):a=i*math.tau/n;v.append((r*math.cos(a),r*math.sin(a),z))
    for i in range(n):
        j=(i+1)%n
        f.extend([(i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(n+i,n+j,3*n+j,3*n+i),(i,2*n+i,2*n+j,j)])
    o=mesh(name,v,f,mat)
    for polygon in o.data.polygons:polygon.use_smooth=False
    return o
ringstone=material('Honed limestone','#c9ccbf',.9)
for i in range(4):cylinder('Terraced gravity foundation',(0,0,-8+i*2),(0,0,-6+i*2),66-i*4,concrete,96)
for z in [0,5.2,10.6]:annulus('Continuous slab',35.5,48.7,z,.45,ringstone)
for r in [36,48]:
    for z in [.5,5.65]:annulus('Curved curtain wall',r-.09,r+.09,z,4.9,glass)
    for i in range(96):
        a=i*math.tau/96
        cylinder('Facade mullion',(r*math.cos(a),r*math.sin(a),.4),(r*math.cos(a),r*math.sin(a),10.6),.12,bronze,8)
annulus('Roof coping',35.35,48.85,11.05,.3,ringstone)
annulus('Garden paving',10,35.4,.05,.14,concrete)
annulus('Garden planting',14,31,.20,.18,material('Garden lawn','#719264',.96))
for i in range(4):
    a=i*math.pi/2
    o=box('Garden path',(22*math.cos(a),22*math.sin(a),.45),(26,2,.15),white);o.rotation_euler[2]=a
export('ring')

fingerprint=hashlib.sha256(pathlib.Path(__file__).read_bytes()+(ROOT/'lib/world/landmark-spec.json').read_bytes()).hexdigest()[:12]
(ROOT/'lib/world/landmark-version.ts').write_text("// Generated by build-landmarks.py.\nexport const LANDMARK_VERSION = '"+fingerprint+"';\n")
