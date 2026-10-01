"""Original metre-scale assets. Blender 5.2: --background --python scripts/build-landmarks.py.
Author in Blender Z-up; glTF exporter converts to Y-up. No external assets or bake claims.
The deterministic script is the editable source. Batch by material before export.
"""
import bpy, math, json, pathlib, hashlib, sys
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

# Optional targeted export: blender --background --python scripts/build-landmarks.py -- --only ring
ONLY = sys.argv[sys.argv.index('--only')+1] if '--only' in sys.argv else None

def export(name):
    if ONLY and name != ONLY: return
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
# Clear spherical pavilion above a sealed dark pressure hull. The underwater
# hemisphere remains complete; only the exposed envelope becomes curtain wall.
pavilionglass=material('Pavilion clear glazing','#a7c2cf',.16,.32)
glassnode=pavilionglass.node_tree.nodes.get('Principled BSDF')
glassnode.inputs['Alpha'].default_value=.28
pavilionglass.surface_render_method='DITHERED'
silver=material('Pavilion silver louvers','#a5b6bd',.31,.62)
interior=material('Pavilion limestone interior','#e3d7bd',.76)
wood=material('Pavilion oak furnishings','#b79160',.62)
linear=material('Pavilion warm light','#fff1cf',.4)
linear.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(1.,.69,.37,1.)
linear.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=3

def spherical_patch(name,low,high,mat,radius=R,segments=192,rows=8):
    vertices=[];faces=[]
    for j in range(rows+1):
        lat=low+(high-low)*j/rows
        for i in range(segments+1):vertices.append(spherepoint(radius,lat,math.tau*i/segments))
    for j in range(rows):
        for i in range(segments):
            k=j*(segments+1)+i;faces.append((k,k+1,k+segments+2,k+segments+1))
    obj=mesh(name,vertices,faces,mat)
    obj.data.set_sharp_from_angle(angle=math.pi)
    obj.data.normals_split_custom_set_from_vertices([Vector(v).normalized() for v in vertices])
    return obj

def pavilion_ring(name,radius,z,thickness,mat):
    obj=tube(name,[(radius*math.cos(i*math.tau/192),radius*math.sin(i*math.tau/192),z) for i in range(193)],thickness,mat)
    obj.data.bevel_resolution=1
    return obj

def gallery_floor(name,inner,outer,z,mat):
    vertices=[];faces=[];n=128
    for radius,height in [(inner,z),(outer,z),(outer,z+.32),(inner,z+.32)]:
        for i in range(n):vertices.append((radius*math.cos(i*math.tau/n),radius*math.sin(i*math.tau/n),height))
    for j in range(4):
        for i in range(n):
            k=j*n+i;nx=j*n+(i+1)%n;faces.append((k,nx,((j+1)%4)*n+(i+1)%n,((j+1)%4)*n+i))
    obj=mesh(name,vertices,faces,mat)
    for polygon in obj.data.polygons:polygon.use_smooth=False
    return obj

spherical_patch('Complete submerged pressure hull',-math.pi/2,math.asin(2/R),wet,rows=40)
spherical_patch('Continuous clear glass envelope',math.asin(2/R),math.pi/2,pavilionglass,rows=44)
# A low black waterline plinth and fine horizontal shading, never a stack of disks.
for z in [-1.5,2.05]:pavilion_ring('Waterline and sill frame',math.sqrt(R*R-z*z)+.04,z,.10,seam)
for i in range(15):
    z=8.8+i*1.8
    lo=math.asin((z-.25)/R);hi=math.asin(min(R,z+.25)/R)
    spherical_patch('Curved silver shading belt',lo,hi,silver,R+.14,rows=2)
    radius=math.sqrt((R+.16)**2-z*z)
    pavilion_ring('Shading belt lower edge',radius,z-.28,.065,seam)
    # Recessed warm LED follows each ring, behind the outer glass highlight.
    pavilion_ring('Recessed continuous warm strip',math.sqrt((R+.18)**2-(z-.36)**2),z-.36,.07,linear)
for k in range(24):
    a=k*math.tau/24
    tube('Radial curtain wall mullion',[spherepoint(R+.045,math.asin(2/R)+(math.pi/2-math.asin(2/R))*j/64,a) for j in range(65)],.105,seam)
# Open atrium and occupied galleries are real geometry visible through the glass.
cylinder('Ground floor slab',(0,0,1.45),(0,0,1.82),34.3,interior,128)
for z in [9.2,16.8]:
    outer=math.sqrt(R*R-z*z)-.6
    floor=gallery_floor('Atrium gallery',10,outer,z,interior)
    cutter=box('Stair opening cutter',(17 if z<10 else -17,-6,z+.16),(14,4,.9),seam,0)
    modifier=floor.modifiers.new('Open stairwell','BOOLEAN');modifier.operation='DIFFERENCE';modifier.object=cutter
    bpy.context.view_layer.objects.active=floor;bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.data.objects.remove(cutter,do_unlink=True)
    pavilion_ring('Atrium handrail',10.15,z+1.45,.05,seam)
    for k in range(40):
        a=k*math.tau/40;c=math.cos(a);t=math.sin(a)
        cylinder('Atrium baluster',(10.15*c,10.15*t,z+.32),(10.15*c,10.15*t,z+1.45),.035,seam,8)
    pavilion_ring('Gallery perimeter cove',outer-.3,z-.06,.065,linear)
for k in range(12):
    a=k*math.tau/12;c=math.cos(a);t=math.sin(a)
    cylinder('Slender internal column',(22*c,22*t,1.82),(22*c,22*t,math.sqrt(R*R-22*22)),.22,silver,12)
# Two flights climb opposite sides of the atrium; clear central space stays open.
for level,z in enumerate([1.82,9.52]):
    side=1 if level==0 else -1
    for i in range(32):box('Gallery stair',(side*(11+i*.35),-6,z+i*.24),( .42,3.4,.28),interior,.02)
    tube('Stair handrail',[(side*11,-7.8,z+1.1),(side*22,-7.8,z+8.55)],.055,seam)
    for y in [-7.4,-4.6]:cylinder('Stair stringer',(side*11,y,z-.14),(side*21.85,y,z+7.3),.12,seam,8)
for z,ringradius in [(1.82,27),(9.52,25),(17.12,22)]:
    for i in range(12):
        a=i*math.tau/12+.13;x=ringradius*math.cos(a);y=ringradius*math.sin(a)
        # Leave the east entry free of furniture.
        if z<2 and abs(y)<7 and x>0:continue
        table=box('Gallery display table',(x,y,z+.95),(4.6,2, .22),wood,.12);table.rotation_euler.z=a
        for dx in [-1.6,1.6]:
            cylinder('Table trestle',(x+dx*math.cos(a),y+dx*math.sin(a),z),(x+dx*math.cos(a),y+dx*math.sin(a),z+.85),.12,seam,8)
        box('Exhibit object',(x,y,z+1.25),(1.2,.7,.3),silver,.06)
    for i in range(6):
        a=i*math.tau/6+.5;x=(ringradius-6)*math.cos(a);y=(ringradius-6)*math.sin(a)
        cylinder('Circular lounge seat',(x,y,z),(x,y,z+.48),1.15,wood,24)
# Central information desk and entry stair up from the existing pier airlock.
cylinder('Atrium information desk',(0,0,1.82),(0,0,2.9),3.1,wood,64)
pavilion_ring('Desk task light',2.95,2.94,.045,linear)
for i in range(8):box('Entry stair',(34.5-i*.55,0,.02+i*.225),( .6,3.5,.25),interior,.025)
# Fixed landing on east side with human-scale railing, airlock and boat fenders.
box('Lateral landing',(40,0,-1),(17,15,1),concrete,.25)
box('Deck surface',(40,0,-.43),(16.5,14.5,.15),deck)
box('Entry airlock',(34.7,0,2),(5,4,5),silver,.3)
box('Entry glazing',(37.25,0,2),( .08,2.5,3.6),pavilionglass,.02)
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
pavilion_ring('Crown oculus frame',1.8,34.96,.08,silver)
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
# Inward-leaning campus, with a continuous white crown and a planted internal court.
def ring_surface(name, profile, mat, smooth=False):
    vertices=[];faces=[];n=192
    for radius,z in profile:
        for i in range(n):
            a=i*math.tau/n;vertices.append((radius*math.cos(a),radius*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(n):
            k=j*n+i;next=j*n+(i+1)%n
            faces.append((k,next,next+n,k+n))
    obj=mesh(name,vertices,faces,mat)
    for polygon in obj.data.polygons:polygon.use_smooth=smooth
    return obj

def annulus(name, inner, outer, base, height, mat):
    return ring_surface(name,[(inner,base),(outer,base),(outer,base+height),(inner,base+height),(inner,base)],mat)

roof=material('Ring porcelain crown','#f1f3ee',.38,.15)
ringglass=material('Ring blue glazing','#385562',.22,.5)
frame=material('Ring silver framing','#aab8be',.42,.65)
paving=material('Ring limestone paving','#c3c7b8',.9)
lawn=material('Ring meadow','#566c41',.97)
bark=material('Ring tree bark','#69614c',.98)
foliage=[material('Ring canopy '+str(i),c,.96) for i,c in enumerate(['#4a663e','#667c49'])]
water=material('Ring reflecting water','#477a80',.21,.3)
neon=material('Ring violet edge','#d7a2ff',.3)
neon.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(.352,.051,1.,1)
neon.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=14
# Retain the surveyed base and approach; the occupied facade leans 2.6 m inward.
for i in range(4):cylinder('Terraced gravity foundation',(0,0,-8+i*2),(0,0,-6+i*2),66-i*4,paving,96)
for z in [0,3.5,7,10.5]:
    inset=z/10.5*2.6
    annulus('Recessed floor edge',34.8-inset,48.2-inset,z,.24,frame)
for radius in [35,48]:
    for z in [.28,3.78,7.28]:
        lo=radius-z/10.5*2.6;hi=radius-(z+3.18)/10.5*2.6
        # Closed shallow shell gives both inward and outward glazing valid normals.
        ring_surface('Inward curtain wall',[(lo-.07,z),(lo+.07,z),(hi+.07,z+3.18),(hi-.07,z+3.18),(lo-.07,z)],ringglass,True)
    for i in range(112):
        a=i*math.tau/112;c=math.cos(a);t=math.sin(a)
        cylinder('Inclined facade fin',(radius*c,radius*t,.22),((radius-2.6)*c,(radius-2.6)*t,10.6),.075,frame,8)
# A gently arched radial section makes a broad, uninterrupted white roof.
ring_surface('Swept porcelain roof',list(reversed([(31.7,11.1),(31.85,11.6),(33,12.1),(36.5,12.35),(42.5,12.05),(46.7,11.3),(47.4,10.95),(47.35,10.55),(44.8,10.65),(33,10.9),(31.7,11.1)])),roof,True)
for radius,z in [(31.73,11.45),(47.43,10.98)]:
    tube('Continuous violet roof edge',[(radius*math.cos(i*math.tau/256),radius*math.sin(i*math.tau/256),z) for i in range(257)],.14,neon)
# Courtyard ground is complete at the centre, with a planted loop and axial pavilion.
cylinder('Courtyard limestone',(0,0,.02),(0,0,.20),34.5,paving,192)
cylinder('Courtyard meadow',(0,0,.21),(0,0,.31),30.6,lawn,192)
annulus('Garden loop walk',23.2,24.7,.32,.08,paving)
box('Axial garden walk',(0,0,.36),(7,64,.16),paving,.04)
box('East west garden walk',(0,-9,.36),(57,2,.16),paving,.04)
box('Garden pavilion plinth',(0,13,.65),(8.8,30,.5),paving)
box('Garden pavilion glazing',(0,13,2.15),(7.2,28,2.5),ringglass,.02)
box('Garden pavilion white canopy',(0,13,3.65),(9.4,30.8,.3),roof,.1)
# Recessed rooflight keeps the pavilion a quiet linear element through the trees.
box('Pavilion rooflight',(0,13,3.82),(5.8,27,.05),ringglass,.01)
for y in range(-1,28,4):
    for x in [-3.9,3.9]:cylinder('Pavilion arcade column',(x,y,.8),(x,y,3.52),.085,frame,8)
for i in range(4):box('Pavilion arrival step',(0,-3.2-i*.6,.58-i*.09),(8.8,.65,.18),paving,.025)
box('Linear reflecting pool',(0,-18,.5),(4.5,11,.14),paving)
box('Still courtyard water',(0,-18,.58),(4.1,10.6,.03),water,.01)
# Deterministic tree clusters leave the loop, cross path and central axis walkable.
for i in range(104):
    a=i*2.3999632297;r=6+math.sqrt((i+.5)/104)*23.4
    x,y=r*math.cos(a),r*math.sin(a)
    if abs(x)<6 or abs(y+9)<2.4 or 21.4<r<26.2:continue
    h=3.5+(i*17%11)*.23
    cylinder('Courtyard tree trunk',(x,y,.32),(x,y,h),.16,bark,8)
    for k in range(3):
        angle=k*math.tau/3+i
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(x+math.cos(angle)*.7,y+math.sin(angle)*.7,h+.25+k*.28))
        obj=bpy.context.object;obj.name='Courtyard clustered canopy';obj.scale=(1.65,1.65,1.2);obj.data.materials.append(foliage[i%2])
        for polygon in obj.data.polygons:polygon.use_smooth=True
for x in [-9,9]:
    for y in [-9,8,20]:
        box('Garden bench',(x,y,.85),(3,.65,.22),roof,.06)
        for dx in [-1.1,1.1]:box('Bench support',(x+dx,y,.57),(.12,.5,.55),frame,.02)
export('ring')

fingerprint=hashlib.sha256(pathlib.Path(__file__).read_bytes()+(ROOT/'lib/world/landmark-spec.json').read_bytes()).hexdigest()[:12]
(ROOT/'lib/world/landmark-version.ts').write_text("// Generated by build-landmarks.py.\nexport const LANDMARK_VERSION = '"+fingerprint+"';\n")
