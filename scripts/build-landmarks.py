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
    # Convert the selected set together; per-object conversion rebuilds the entire
    # dependency graph for every baluster in the multi-level interior.
    convertible=[o for o in bpy.context.scene.objects if o.type=='CURVE' or (o.type=='MESH' and o.modifiers)]
    if convertible:
        bpy.ops.object.select_all(action='DESELECT')
        for o in convertible:o.select_set(True)
        bpy.context.view_layer.objects.active=convertible[0]
        bpy.ops.object.convert(target='MESH')
    groups={}
    for o in bpy.context.scene.objects:
        if o.type=='MESH':groups.setdefault((o.parent.name if o.parent else '',o.data.materials[0].name),[]).append(o)
    for objects in groups.values():
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join()
        objects[0].name=(objects[0].parent.name if objects[0].parent else name)+' / '+objects[0].data.materials[0].name
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',export_yup=True,export_apply=True,export_texcoords=True,export_normals=True)
    tris=sum(len(o.data.loop_triangles) for o in bpy.context.scene.objects if o.type=='MESH')
    print('ASSET',name,'material batches',len(groups),'bytes',(OUT/(name+'.glb')).stat().st_size)
    if name != 'ship-hull':
        for o in bpy.context.scene.objects:
            if o.type=='MESH' and o.data.materials[0].name!='Pavilion stair treads':
                mod=o.modifiers.new('Lightweight geometry budget','DECIMATE');mod.ratio=.38
        bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'-low.glb')),export_format='GLB',export_yup=True,export_apply=True,export_texcoords=True,export_normals=True)


clear()
shell=[material('Titanium '+str(i),c,.4,.5) for i,c in enumerate(['#465d61','#495f63','#475e62'])]
seam=material('Recessed joints','#182d34',.62,.25)
glass=material('Observation glazing','#356875',.17,.58)
bronze=material('Anodised bronze','#b49a73',.34,.7)
concrete=material('Marine concrete','#999d90',.87)
white=material('Warm enamel','#e0e2d7',.38,.18)
deck=material('Deck grating','#5b6968',.72,.45)

R=SPEC['observatory']['radius']
def spherepoint(r, lat, lon):return (r*math.cos(lat)*math.cos(lon),r*math.cos(lat)*math.sin(lon),r*math.sin(lat))
# One continuous glass sphere above and below water, with matching fine framing.
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

def gallery_floor(name,inner,outer,z,mat,thickness=.32):
    vertices=[];faces=[];n=128
    for radius,height in [(inner,z),(outer,z),(outer,z+thickness),(inner,z+thickness)]:
        for i in range(n):vertices.append((radius*math.cos(i*math.tau/n),radius*math.sin(i*math.tau/n),height))
    for j in range(4):
        for i in range(n):
            k=j*n+i;nx=j*n+(i+1)%n;faces.append((k,nx,((j+1)%4)*n+(i+1)%n,((j+1)%4)*n+i))
    obj=mesh(name,vertices,faces,mat)
    for polygon in obj.data.polygons:polygon.use_smooth=False
    return obj

spherical_patch('Clear submerged glass envelope',-math.pi/2,math.asin(2/R),pavilionglass,rows=40)
spherical_patch('Continuous clear glass envelope',math.asin(2/R),math.pi/2,pavilionglass,rows=44)
# A low black waterline plinth and fine horizontal shading, never a stack of disks.
for z in [-1.5,2.05]:pavilion_ring('Waterline and sill frame',math.sqrt(R*R-z*z)+.04,z,.10,seam)
for i in range(30):
    z=(8.8+(i%15)*1.8)*(1 if i<15 else -1)
    lo=math.asin((z-.25)/R);hi=math.asin(min(R,z+.25)/R)
    spherical_patch('Curved silver shading belt',lo,hi,silver,R+.14,rows=2)
    radius=math.sqrt((R+.16)**2-z*z)
    pavilion_ring('Shading belt lower edge',radius,z-.28,.065,seam)
    # Recessed warm LED follows each ring, behind the outer glass highlight.
    pavilion_ring('Recessed continuous warm strip',math.sqrt((R+.18)**2-(z-.36)**2),z-.36,.07,linear)
for k in range(24):
    a=k*math.tau/24
    tube('Radial curtain wall mullion',[spherepoint(R+.045,-math.pi/2+math.pi*j/128,a) for j in range(129)],.105,seam)
# One open vertical room: narrow inhabited balconies, joined by a continuous stair.
# Heights are walking surfaces in local coordinates (world waterline is -3m).
levels=[17.12,9.52,1.82,-6.,-13.8,-21.6,-29.4,-32.]
stairmat=material('Pavilion stair treads','#c8ac7e',.62,.12)
def gallery_outer(z):return math.sqrt(R*R-max(abs(z),abs(z-.32))**2)-.7
def gallery_inner(z):return gallery_outer(z)-4.8
def landing_angle(z):return 1.1/(gallery_inner(z)-3.3)
angles=[.35]
for hi,lo in zip(levels,levels[1:]):
    count=math.ceil((hi-lo)/.175)
    # At least 30cm going on the narrow edge; generous clearance between turns.
    angles.append(angles[-1]+landing_angle(hi)+count*.3/(min(gallery_inner(hi),gallery_inner(lo))-3.3)+landing_angle(lo))
for j,z in enumerate(levels):
    outer=gallery_outer(z);inner=gallery_inner(z);a=angles[j]
    if j==len(levels)-1:cylinder('Bottom observation floor',(0,0,z-.32),(0,0,z),outer,interior,128)
    else:gallery_floor('Open atrium balcony',inner,outer,z-.32,interior)
    pavilion_ring('Balcony perimeter cove',outer-.2,z-.38,.055,linear)
    # A radial landing connects each balcony to the stair, leaving the axis open.
    gap=landing_angle(z)
    vertices=[(r*math.cos(t),r*math.sin(t),h) for h in [z-.32,z] for r,t in [(inner-3.3,a-gap),(inner+.35,a-gap),(inner+.35,a+gap),(inner-3.3,a+gap)]]
    landing=mesh('Open stair landing',vertices,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],stairmat)
    for polygon in landing.data.polygons:polygon.use_smooth=False
    # Only the well-facing edge is guarded; the balcony side remains an opening.
    tube('Landing inner handrail',[((inner-3.23)*math.cos(a-gap+2*gap*i/12),(inner-3.23)*math.sin(a-gap+2*gap*i/12),z+1.1) for i in range(13)],.055,bronze)
    if j<len(levels)-1:
        gap=1.2/inner
        for h in [.55,1.1]:
            tube('Open balcony guardrail',[(inner*math.cos(a+gap+t*(math.tau-2*gap)/128),inner*math.sin(a+gap+t*(math.tau-2*gap)/128),z+h) for t in range(129)],.035 if h<1 else .055,seam)
        for k in range(72):
            theta=a+gap+k*(math.tau-2*gap)/71
            cylinder('Balcony baluster',(inner*math.cos(theta),inner*math.sin(theta),z),(inner*math.cos(theta),inner*math.sin(theta),z+1.1),.035,seam,8)
    # Small exhibits stay on the perimeter, never fill the shared central room.
    for k in range(8):
        theta=k*math.tau/8+.2
        if abs(math.atan2(math.sin(theta-a),math.cos(theta-a)))<.25:continue
        r=outer-2;x=r*math.cos(theta);y=r*math.sin(theta)
        seat=box('Perimeter gallery bench',(x,y,z+.48),(2.6,.7,.18),wood,.06);seat.rotation_euler.z=theta+math.pi/2
        for d in [-.85,.85]:cylinder('Bench leg',(x-d*math.sin(theta),y+d*math.cos(theta),z),(x-d*math.sin(theta),y+d*math.cos(theta),z+.4),.06,silver,8)
# Faceted wedge treads meet edge-to-edge; rails and twin stringers follow every flight.
for j,(hi,lo) in enumerate(zip(levels,levels[1:])):
    n=math.ceil((hi-lo)/.175);start=angles[j]+landing_angle(hi);end=angles[j+1]-landing_angle(lo);rails=[[],[]];beams=[[],[]]
    def stair_point(t,offset,height):
        a=start+(end-start)*t;r=gallery_inner(hi)*(1-t)+gallery_inner(lo)*t-1.65+offset
        return (r*math.cos(a),r*math.sin(a),height)
    for i in range(n):
        t=i/n;u=(i+1)/n;z=hi+(lo-hi)*u
        vertices=[stair_point(t,-1.65,z-.18),stair_point(t,1.65,z-.18),stair_point(u,1.65,z-.18),stair_point(u,-1.65,z-.18),stair_point(t,-1.65,z),stair_point(t,1.65,z),stair_point(u,1.65,z),stair_point(u,-1.65,z)]
        step=mesh('Continuous stair tread',vertices,[(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)],stairmat)
        for polygon in step.data.polygons:polygon.use_smooth=False
    for i in range(n+1):
        t=i/n;z=hi+(lo-hi)*t
        for side,offset in enumerate([-1.58,1.58]):
            rails[side].append(stair_point(t,offset,z+1.1));beams[side].append(stair_point(t,offset,z-.3))
            if i%3==0:cylinder('Stair baluster',stair_point(t,offset,z),stair_point(t,offset,z+1.1),.035,seam,8)
    for rail,beam in zip(rails,beams):
        tube('Continuous stair handrail',rail,.055,bronze);tube('Continuous stair stringer',beam,.13,silver)
# Light radial brackets carry balconies back to the structural shell ribs.
for z in levels[:-1]:
    for k in range(24):
        a=k*math.tau/24;r=gallery_outer(z)
        cylinder('Balcony shell bracket',((r-4.6)*math.cos(a),(r-4.6)*math.sin(a),z-.4),((math.sqrt(R*R-(z-1.2)**2)-.15)*math.cos(a),(math.sqrt(R*R-(z-1.2)**2)-.15)*math.sin(a),z-1.2),.10,silver,8)
# Entry stair rises from the retained pier to the annular public floor.
for i in range(9):box('Entry stair',(34.5-i*.48,0,-.18+i*.225),(.5,3.5,.25),interior,.025)
# Fixed landing on east side with human-scale railing, airlock and boat fenders.
box('Lateral landing',(40,0,-1),(17,15,1),concrete,.25)
box('Deck surface',(40,0,-.43),(16.5,14.5,.15),deck)
box('Entry airlock',(34.7,0,2),(5,4,5),silver,.3)
box('Entry glazing',(37.25,0,2),( .08,2.5,3.6),pavilionglass,.02)
box('Entry canopy',(37,0,4.8),(5,5,.25),bronze)
for x in [34,47]:
    for y in [-6,6]:
        cylinder('Guardrail post',(x,y,0),(x,y,1.2),.045,bronze)
for y in [-7,7]:
    tube('Landing guardrail',[(32,y,1),(48,y,1)],.045,bronze)
    for x in range(32,49,2):cylinder('Guardrail stanchion',(x,y,-.3),(x,y,1),.04,bronze)
for x in [33,47]:
    for y in [-7.2,7.2]:cylinder('Berthing fender',(x,y,-2),(x,y,0),.25,seam)
for y in [-.6,.6]:cylinder('Service ladder',(48,y,-4),(48,y,1),.045,bronze)
for z in range(-4,2):cylinder('Ladder rung',(48,-.6,z),(48,.6,z),.04,bronze)
# A thin inhabited ring carries the sphere on exactly eight seabed piles.
walk=SPEC['observatory']['walkway'];cy=SPEC['observatory']['center'][1]
z=walk['deckY']-cy;inner=walk['innerRadius'];outer=walk['outerRadius']
gallery_floor('Continuous promenade structure',inner,outer,z-.4,silver)
gallery_floor('Promenade walking surface',inner+.14,outer-.14,z-.08,wood,.08)
for radius in [inner+.08,outer-.08]:
    pavilion_ring('Bronze deck edge',radius,z+.04,.075,bronze)
    pavilion_ring('Recessed promenade light',radius,z-.19,.06,linear)
# Radial inlay joints articulate the broad deck; the east landing remains open.
for i in range(128):
    a=i*math.tau/128;c=math.cos(a);t=math.sin(a)
    tube('Fine radial deck inlay',[((inner+.22)*c,(inner+.22)*t,z+.005),((outer-.22)*c,(outer-.22)*t,z+.005)],.018,bronze)
for radius in [inner+.18,outer-.18]:
    for h in [.51,1.16]:
        tube('Open landing curved handrail',[(radius*math.cos(.19+i*(math.tau-.38)/192),radius*math.sin(.19+i*(math.tau-.38)/192),z+h) for i in range(193)],.05 if h>1 else .025,bronze)
    for i in range(96):
        a=i*math.tau/96
        if min(a,math.tau-a)<.19:continue
        c=math.cos(a);t=math.sin(a)
        cylinder('Promenade stanchion',(radius*c,radius*t,z),(radius*c,radius*t,z+1.16),.035,silver,8)
for i in range(walk['supportCount']):
    a=i*math.tau/walk['supportCount'];c=math.cos(a);t=math.sin(a);r=walk['supportRadius'];bottom=walk['supportBottom']-cy
    cylinder('Seabed support %02d'%i,(r*c,r*t,bottom),(r*c,r*t,z-.32),.82,concrete,24)
    # Small pile shoe is buried in the surveyed bed, no gravity slab under the sphere.
    cylinder('Pile shoe',(r*c,r*t,bottom),(r*c,r*t,bottom+1.4),1.5,concrete,24)
    for end in [inner+.25,outer-.25]:
        cylinder('Forked ring bearing',(r*c,r*t,z-3.2),(end*c,end*t,z-.38),.18,silver,12)
    # Searchlight fixture and lens share the runtime light's surveyed axis.
    lr=walk['lightRadius'];start=Vector((lr*c,lr*t,walk['lightY']-cy));direction=Vector(((walk['lightTargetRadius']-lr)*c,(walk['lightTargetRadius']-lr)*t,walk['lightTargetY']-walk['lightY'])).normalized()
    cylinder('Searchlight suspension',(lr*c,lr*t,z-.4),start,.07,silver,12)
    cylinder('Underdeck searchlight housing',start-direction*.35,start+direction*.42,.36,seam,24)
    cylinder('Underdeck searchlight lens',start+direction*.43,start+direction*.46,.29,linear,24)
    if i:
        seat=box('Promenade bench',((outer-1)*c,(outer-1)*t,z+.53),(2.6,.65,.22),wood,.08);seat.rotation_euler.z=a+math.pi/2
        for offset in [-.9,.9]:
            x=(outer-1)*c-offset*t;y=(outer-1)*t+offset*c
            cylinder('Bench leg',(x,y,z),(x,y,z+.44),.06,silver,8)
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
# A central armillary fountain replaces the axial pavilion. All dimensions are
# local metres: keep the 34.5 m court, four open approaches and outer promenade.
gold=material('Ring champagne bronze','#bfa477',.3,.72)
energy=material('Ring aquamarine energy','#60ccce',.24,.25)
pearl=material('Ring pearl light','#d4f6ee',.23,.1)
for mat,colour,strength in [(energy,(.09,.65,.7,1),1.4),(pearl,(.53,1.,.88,1),3.2)]:
    shader=mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Emission Color'].default_value=colour
    shader.inputs['Emission Strength'].default_value=strength

def court_sector(name,inner,outer,z,height,start,end,mat):
    vertices=[];faces=[];n=max(8,round((end-start)*32))
    for radius,h in [(inner,z),(outer,z),(outer,z+height),(inner,z+height)]:
        for i in range(n+1):
            a=start+(end-start)*i/n;vertices.append((radius*math.cos(a),radius*math.sin(a),h))
    for j in range(4):
        for i in range(n):
            k=j*(n+1)+i;other=((j+1)%4)*(n+1)+i
            faces.append((k,k+1,other+1,other))
    faces.extend([(0,n+1,2*(n+1),3*(n+1)),(n,4*(n+1)-1,3*(n+1)-1,2*(n+1)-1)])
    return mesh(name,vertices,faces,mat)

# Every moving assembly pivots at the fixed nucleus, above the retained basin.
ORBIT_HEIGHT=8.5

def orbit_parent(name,objects):
    pivot=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(pivot)
    pivot.location=(0,0,ORBIT_HEIGHT)
    bpy.context.view_layer.update()
    for obj in objects:
        world=obj.matrix_world.copy();obj.parent=pivot;obj.matrix_world=world

def orbit_point(radius,angle,tilt,turn,offset=0):
    x=radius*math.cos(angle);y=radius*math.sin(angle)
    yy=y*math.cos(tilt)-offset*math.sin(tilt)
    return (x*math.cos(turn)-yy*math.sin(turn),x*math.sin(turn)+yy*math.cos(turn),ORBIT_HEIGHT+y*math.sin(tilt)+offset*math.cos(tilt))

def orbit_band(name,radius,width,tilt,turn,start=0,end=math.tau,mat=gold):
    vertices=[];faces=[];n=max(24,round((end-start)*24))
    for r,z in [(radius-width/2,-.10),(radius+width/2,-.10),(radius+width/2,.10),(radius-width/2,.10)]:
        for i in range(n+1):vertices.append(orbit_point(r,start+(end-start)*i/n,tilt,turn,z))
    for j in range(4):
        for i in range(n):
            k=j*(n+1)+i;other=((j+1)%4)*(n+1)+i
            faces.append((k,k+1,other+1,other))
    faces.extend([(0,n+1,2*(n+1),3*(n+1)),(n,4*(n+1)-1,3*(n+1)-1,2*(n+1)-1)])
    return mesh(name,vertices,faces,mat)

cylinder('Courtyard limestone',(0,0,.02),(0,0,.24),34.5,paving,192)
# Flush paving inlays trace the astronomy of the sculpture without raised obstacles.
for r in [11.3,16.8,20.4,30.4,33.3]:annulus('Concentric bronze paving inlay',r,r+.055,.245,.012,gold)
for i in range(32):
    a=i*math.tau/32;r=15
    joint=box('Radial limestone joint',(r*math.cos(a),r*math.sin(a),.25),(7,.035,.015),frame,0)
    joint.rotation_euler.z=a
    a=i*math.tau/32;r=32
    joint=box('Promenade paving joint',(r*math.cos(a),r*math.sin(a),.25),(3.3,.035,.015),frame,0)
    joint.rotation_euler.z=a
# Four crescent gardens frame a generous, uncluttered circular gathering space.
for quadrant in range(4):
    a=quadrant*math.pi/2;start=a+.19;end=a+math.pi/2-.19
    court_sector('Crescent garden stone edge',21.1,29.6,.25,.35,start,end,paving)
    court_sector('Crescent planting bed',21.45,29.25,.60,.035,start+.012,end-.012,lawn)
    court_sector('Curved garden seat',20.8,21.7,.64,.20,start+.12,end-.12,roof)
    court_sector('Recessed seat light',20.88,20.94,.58,.055,start+.12,end-.12,pearl)
    # Low clipped planting at the court edge; taller trees stay behind the seats.
    for j in range(11):
        angle=start+.08+(end-start-.16)*j/10;r=23.2
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=(r*math.cos(angle),r*math.sin(angle),.88))
        obj=bpy.context.object;obj.name='Low crescent planting';obj.scale=(.85,.85,.55);obj.data.materials.append(foliage[1])
    for j in range(4):
        angle=start+.16+(end-start-.32)*j/3;r=26.1+(j%2)*.65
        x,y=r*math.cos(angle),r*math.sin(angle);h=4.2+(j%3)*.45
        cylinder('Garden tree trunk',(x,y,.63),(x,y,h),.17,bark,8)
        for k in range(3):
            angle=k*math.tau/3+j
            cylinder('Garden tree branch',(x,y,h-1.2),(x+math.cos(angle)*.85,y+math.sin(angle)*.85,h+.4),.075,bark,6)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2,radius=1,location=(x+math.cos(angle)*.65,y+math.sin(angle)*.65,h+.3+k*.3))
            obj=bpy.context.object;obj.name='Garden tree canopy';obj.scale=(1.65,1.65,1.35);obj.data.materials.append(foliage[j%2])
            for polygon in obj.data.polygons:polygon.use_smooth=True
    # Water rills sit on diagonals; the four axial approaches stay dry and clear.
    angle=a+math.pi/4
    for name,r,w,length,z,h,mat in [('Rill surround',14.1,1.3,7.2,.31,.12,roof),('Inset rill water',14.1,.92,6.9,.38,.035,water)]:
        obj=box(name,(r*math.cos(angle),r*math.sin(angle),z),(length,w,h),mat,.025);obj.rotation_euler.z=angle

# The shallow basin remains; the sculpture has no pedestal or physical support.
cylinder('Fountain apron',(0,0,.25),(0,0,.40),10.65,paving,128)
annulus('Fountain ivory coping',9.8,10.25,.4,.32,roof)
annulus('Fountain bronze lip',9.85,9.93,.71,.045,gold)
cylinder('Fountain still water',(0,0,.41),(0,0,.54),9.8,water,128)
# Three tilted flat metal rings with fine aqua channels, plus the inner gimbal.
for orbit,(radius,width,tilt,turn) in enumerate([(4.5,.34,math.radians(82),.2),(5.2,.32,math.radians(57),-.65),(6.35,.40,math.radians(24),.28),(2.25,.23,math.radians(73),-.4)]):
    before=set(bpy.context.scene.objects)
    orbit_band('Armillary bronze orbit',radius,width,tilt,turn)
    tube('Orbit aqua channel',[orbit_point(radius,math.tau*i/160,tilt,turn,.112) for i in range(161)],.027,energy)
    for i in range(4):
        a=i*math.pi/2
        # Small spear-shaped radial ornaments on the ring, with an inset spine.
        points=[orbit_point(r,angle,tilt,turn,.04) for r,angle in [(radius-.22,a-.05),(radius+.38,a-.055),(radius+.92,a),(radius+.38,a+.055),(radius-.22,a+.05)]]
        obj=mesh('Orbit pointed fin',points,[(0,1,2,3,4)],gold)
        solid=obj.modifiers.new('Fin thickness','SOLIDIFY');solid.thickness=.1
        tube('Fin turquoise spine',[orbit_point(radius+.12,a,tilt,turn,.115),orbit_point(radius+.69,a,tilt,turn,.115)],.04,energy)
    orbit_parent('Ring orbit '+str(orbit+1),set(bpy.context.scene.objects)-before)
# Broken luminous ribbons suggest circulating water while retaining clear gaps
# through the sculpture. Opaque geometry avoids overlapping transparency passes.
before=set(bpy.context.scene.objects)
for phase in [0,math.pi]:
    orbit_band('Suspended aquamarine ribbon',3.58,.62,1.2,.35,phase+.18,phase+2.7,energy)
    tube('Water ribbon bright edge',[orbit_point(3.8,phase+.18+2.52*i/96,1.2,.35,.12) for i in range(97)],.035,pearl)
orbit_parent('Ring orbit 5',set(bpy.context.scene.objects)-before)
bpy.ops.mesh.primitive_uv_sphere_add(segments=40,ring_count=24,radius=1.28,location=(0,0,ORBIT_HEIGHT))
obj=bpy.context.object;obj.name='Luminous pearl nucleus';obj.data.materials.append(pearl)
for polygon in obj.data.polygons:polygon.use_smooth=True
export('ring')

fingerprint=hashlib.sha256(pathlib.Path(__file__).read_bytes()+(ROOT/'lib/world/landmark-spec.json').read_bytes()).hexdigest()[:12]
(ROOT/'lib/world/landmark-version.ts').write_text("// Generated by build-landmarks.py.\nexport const LANDMARK_VERSION = '"+fingerprint+"';\n")
