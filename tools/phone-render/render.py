# The Mobile page hero: a phone (titanium frame, glass, Dynamic Island, side
# buttons) showing Nexus's mbsx "New swap" screen, rendered with Cycles on a
# transparent background.
#
# The display is cut out (holdout): the page draws the app's screens there as
# animated SVG, so they stay sharp, using the display corners this script
# writes to out.png.json. tools/phone-render/build.sh runs the whole thing.
import bpy, bmesh, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = argv[0] if argv else os.path.join(HERE, 'phone.png')
SAMPLES = int(argv[1]) if len(argv) > 1 else 256
RES = (int(argv[2]), int(argv[3])) if len(argv) > 3 else (1400, 2300)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# --- geometry helpers ------------------------------------------------------
def rrect(w, h, r, seg=24):
    pts = []
    corners = [(w/2 - r, h/2 - r, 0), (-w/2 + r, h/2 - r, 90), (-w/2 + r, -h/2 + r, 180), (w/2 - r, -h/2 + r, 270)]
    for cx, cy, a0 in corners:
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def slab(name, w, h, r, z0, z1, bevel=0.0, bseg=6, seg=24):
    bm = bmesh.new()
    pts = rrect(w, h, r, seg)
    bot = [bm.verts.new((x, y, z0)) for x, y in pts]
    top = [bm.verts.new((x, y, z1)) for x, y in pts]
    bm.faces.new(list(reversed(bot)))
    bm.faces.new(top)
    n = len(pts)
    for i in range(n):
        bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    if bevel:
        m = ob.modifiers.new('bevel', 'BEVEL')
        m.width = bevel; m.segments = bseg; m.limit_method = 'ANGLE'; m.angle_limit = math.radians(40)
        m.harden_normals = False
    for p in me.polygons:
        p.use_smooth = True
    return ob

def flat(name, w, h, r, z, seg=32):
    """A rounded-rect face with UVs spanning its bounds."""
    bm = bmesh.new()
    pts = rrect(w, h, r, seg)
    vs = [bm.verts.new((x, y, z)) for x, y in pts]
    f = bm.faces.new(vs)
    uv = bm.loops.layers.uv.new()
    for l in f.loops:
        x, y, _ = l.vert.co
        l[uv].uv = ((x + w / 2) / w, (y + h / 2) / h)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    return ob

def mat(name, **p):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    for k, v in p.items():
        b.inputs[k].default_value = v
    return m

# --- dimensions (cm) -------------------------------------------------------
SW = 6.76                       # display width
SH = SW * 2556 / 1179           # display height, the screenshot's aspect
BEZ = 0.17
W, H = SW + 2 * BEZ, SH + 2 * BEZ
R = 1.18                        # outer corner radius
D = 0.80                        # thickness
PT = SW / 393                   # one UI point

# frame: blue titanium, brushed
ti = mat('titanium', **{'Base Color': (0.30, 0.35, 0.44, 1), 'Metallic': 1.0, 'Roughness': 0.22,
                        'Anisotropic': 0.55, 'Coat Weight': 0.3, 'Coat Roughness': 0.12})
frame = slab('frame', W, H, R, -D / 2, D / 2 - 0.02, bevel=0.16, bseg=10)
frame.data.materials.append(ti)

# black glass front and back
glass = mat('glass', **{'Base Color': (0.004, 0.004, 0.006, 1), 'Roughness': 0.04, 'Coat Weight': 1.0, 'Coat Roughness': 0.02})
front = slab('front', W - 0.06, H - 0.06, R - 0.03, D / 2 - 0.04, D / 2 + 0.005, bevel=0.03, bseg=4)
front.data.materials.append(glass)
back = slab('back', W - 0.06, H - 0.06, R - 0.03, -D / 2 - 0.005, -D / 2 + 0.04, bevel=0.03, bseg=4)
back.data.materials.append(mat('backglass', **{'Base Color': (0.05, 0.07, 0.11, 1), 'Roughness': 0.35}))

# the display: cut out (holdout), so the page can draw the live screen
# underneath this image, mapped by the corners written to SCREEN_JSON
hold = bpy.data.materials.new('display')
hold.use_nodes = True
nt = hold.node_tree
nt.nodes.clear()
ho = nt.nodes.new('ShaderNodeHoldout')
out = nt.nodes.new('ShaderNodeOutputMaterial')
nt.links.new(ho.outputs['Holdout'], out.inputs['Surface'])
display = flat('display', SW, SH, R - BEZ - 0.06, D / 2 + 0.0065)
display.data.materials.append(hold)

# side buttons
# seated in the frame, standing proud of it by about half a millimetre
key_mat = mat('keys', **{'Base Color': (0.22, 0.26, 0.33, 1), 'Metallic': 1.0, 'Roughness': 0.38})
def button(name, x, y, h):
    b = slab(name, 0.12, h, 0.06, -0.13, 0.13, bevel=0.035, bseg=5, seg=8)
    b.rotation_euler = (0, math.radians(90), 0)
    b.location = (x, y, 0)
    b.data.materials.append(key_mat)
button('power', W / 2 - 0.01, H / 2 - 4.4, 1.6)
button('action', -W / 2 + 0.01, H / 2 - 3.0, 0.55)
button('vol_up', -W / 2 + 0.01, H / 2 - 4.25, 1.0)
button('vol_down', -W / 2 + 0.01, H / 2 - 5.55, 1.0)

# --- pose ------------------------------------------------------------------
rig = bpy.data.objects.new('rig', None)
scene.collection.objects.link(rig)
for ob in list(scene.objects):
    if ob is not rig and ob.parent is None:
        ob.parent = rig
# No roll: the screen's text stays level, so it lands on the pixel grid and
# stays sharp even on 1x displays. No tilt either, so vertical strokes stay
# upright (no shear); a gentle turn keeps it 3D.
rig.rotation_euler = (0, math.radians(-11), 0)

# --- lights ----------------------------------------------------------------
def area(name, loc, size, energy, color, shape='RECTANGLE', size_y=None):
    l = bpy.data.lights.new(name, 'AREA')
    l.energy = energy; l.color = color; l.shape = shape
    l.size = size; l.size_y = size_y or size
    o = bpy.data.objects.new(name, l)
    o.location = loc
    scene.collection.objects.link(o)
    d = o.constraints.new('TRACK_TO'); d.target = rig; d.track_axis = 'TRACK_NEGATIVE_Z'; d.up_axis = 'UP_Y'
    return o

area('key', (-18, 14, 26), 14, 9000, (1.0, 0.97, 0.94))
area('fill', (22, -6, 18), 18, 1600, (0.85, 0.9, 1.0))
# strips that run the length of the frame, so its edges catch light
area('edge_right', (24, 2, 14), 1.5, 9000, (0.75, 0.86, 1.0), 'RECTANGLE', 40)
area('edge_right_hi', (30, 6, 30), 2, 6000, (1.0, 1.0, 1.0), 'RECTANGLE', 36)
edge_left = area('edge_left', (-24, 4, 10), 1.5, 700, (1.0, 0.95, 0.9), 'RECTANGLE', 40)
area('edge_top', (2, 34, 16), 2, 5000, (0.9, 0.95, 1.0), 'RECTANGLE', 30)
area('rim_blue', (26, 10, -14), 3, 14000, (0.05, 0.42, 1.0), 'RECTANGLE', 30)
area('rim_violet', (-26, -8, -12), 3, 12000, (0.66, 0.33, 0.97), 'RECTANGLE', 30)
area('top', (0, 30, 4), 10, 3500, (0.8, 0.88, 1.0))

# A soft diagonal reflection across the glass: a long light near the camera,
# seen only in reflections.
# The broad lights shape the body only (light linking): on the display
# their highlight would sit over the UI as a flat white panel.
body = bpy.data.collections.new('body')
for name in ('frame', 'front', 'back', 'power', 'action', 'vol_up', 'vol_down'):
    body.objects.link(scene.objects[name])
for name in ('key', 'fill', 'top'):
    scene.objects[name].light_linking.receiver_collection = body
    scene.objects[name].visible_glossy = False

# The left strip lights the side buttons only, and softly: on the frame
# beside them it left a hard glassy glint, and brighter keys read as glass
# rather than matte titanium.
keys = bpy.data.collections.new('keys')
for name in ('power', 'action', 'vol_up', 'vol_down'):
    keys.objects.link(scene.objects[name])
edge_left.light_linking.receiver_collection = keys

streak = area('streak', (-9, 7, 60), 9, 140, (1, 1, 1), 'RECTANGLE', 80)
streak.constraints.clear()
streak.rotation_euler = (math.radians(0), math.radians(-8), math.radians(-38))

world = bpy.data.worlds.new('world')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.012, 0.016, 0.03, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0

# --- camera ----------------------------------------------------------------
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
scene.collection.objects.link(cam)
# Orthographic, so the display projects to an exact parallelogram and the
# page can map the live screen onto it with a plain 2D (affine) transform.
cam.data.type = 'ORTHO'
cam.data.ortho_scale = 16.6
cam.data.sensor_fit = 'VERTICAL'
cam.location = (0, 0, 60)
scene.camera = cam

# --- render ----------------------------------------------------------------
scene.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
for backend in ('OPTIX', 'CUDA'):
    try:
        prefs.compute_device_type = backend
        prefs.get_devices()
        if any(d.type == backend for d in prefs.devices):
            for d in prefs.devices:
                d.use = d.type == backend
            scene.cycles.device = 'GPU'
            break
    except Exception:
        pass
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x, scene.render.resolution_y = RES
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '16'
scene.render.filepath = OUT
bpy.ops.render.render(write_still=True)

# Where the display's top-left, top-right and bottom-left corners land, in
# pixels of the full render (y down), for the page's screen transform.
from bpy_extras.object_utils import world_to_camera_view
import json
bpy.context.view_layer.update()
mw = display.matrix_world
def px(x, y):
    v = world_to_camera_view(scene, cam, mw @ Vector((x, y, D / 2 + 0.0065)))
    return [v.x * RES[0], (1 - v.y) * RES[1]]
json.dump({'size': [393, 852], 'render': list(RES),
           'tl': px(-SW / 2, SH / 2), 'tr': px(SW / 2, SH / 2), 'bl': px(-SW / 2, -SH / 2),
           'radius_pt': (R - BEZ - 0.06) / PT}, open(OUT + '.json', 'w'))
print('device', scene.cycles.device)
