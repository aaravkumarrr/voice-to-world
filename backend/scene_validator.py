"""
scene_validator.py

Validates a generated scene (the JSON Claude returns for /generate-scene)
against the same two failure modes that caused every real bug found during
development today:

  1. GAPS — an object floating disconnected from everything else, because
     its position was computed (or guessed) independently of any real
     neighboring object.

  2. BAD ROTATION — an object whose rotation doesn't actually orient it
     "upright" relative to the planet's surface at its own position, because
     rotation was computed using an assumption that doesn't match how
     Three.js actually applies Euler rotations.

This module does NOT know which objects are "supposed" to connect to which
(Claude's JSON doesn't say). The practical compromise: check every object
against its single nearest neighbor. If even the closest other object is
farther away than touching distance allows, that object is almost certainly
floating — if it were meant to connect to something, the nearest thing
would be it.

Import and use:
    from scene_validator import validate_scene
    violations = validate_scene(scene_json)
    if violations:
        # build a retry prompt, see format_violations_for_retry()
"""

import math

PLANET_RADIUS = 5.0
PLANET_CENTER = (0.0, 0.0, 0.0)

# How much two "touching" objects are allowed to overlap (same constant used
# throughout development) and how much slack to allow before something
# counts as a real gap rather than floating-point noise.
OVERLAP_MARGIN = 0.1
GAP_TOLERANCE = 0.15  # extra slack on TOP of the overlap margin, since
                      # Claude-generated coordinates won't be as precise as
                      # hand-computed ones; avoid flagging near-misses.

# Shapes whose "radius" is well-approximated by 0.5 * scale on the relevant axis.
RADIUS_LIKE_SHAPES = {
    "sphere", "cylinder", "cone", "capsule", "torus", "torusknot",
    "tetrahedron", "octahedron", "dodecahedron", "icosahedron", "cube"
}


def _hex_to_int(value):
    """Scene values may arrive as ints already, or as hex strings like '0x44aa88'."""
    if isinstance(value, str):
        return int(value, 16)
    return value


def _effective_radius(obj):
    """Best-effort radius estimate for gap checking. Lathe shapes have no
    single radius (their profile varies by height) -- they're excluded from
    radius-based checks entirely rather than given a wrong number."""
    shape = obj.get("shape")
    scale = obj.get("scale", [1, 1, 1])
    if shape not in RADIUS_LIKE_SHAPES:
        return None
    return 0.5 * max(scale[0], scale[2])  # cross-sectional radius, not height


def _distance(p1, p2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))


def _rotation_matrix_column1(x, y, z):
    """
    Returns what a default +Y axis maps to after applying Euler rotation
    [x,y,z] in Three.js's actual order ('XYZ'), using the real matrix
    construction (verified directly against Three.js's Matrix4 source during
    development -- NOT a simplified hand-derived shortcut, which was the
    root cause of a real, confirmed bug earlier in this project).
    """
    a, b = math.cos(x), math.sin(x)
    c, d = math.cos(y), math.sin(y)
    e, f = math.cos(z), math.sin(z)
    ae, af, be, bf = a * e, a * f, b * e, b * f
    rx = -c * f
    ry = ae - bf * d
    rz = be + af * d
    return (rx, ry, rz)


def _expected_up(position):
    """The only physically correct 'up' for an object resting on the planet's
    surface: the normalized direction from the planet's center to that object."""
    dx = position[0] - PLANET_CENTER[0]
    dy = position[1] - PLANET_CENTER[1]
    dz = position[2] - PLANET_CENTER[2]
    length = math.sqrt(dx * dx + dy * dy + dz * dz)
    if length < 1e-6:
        return (0, 1, 0)
    return (dx / length, dy / length, dz / length)


def check_rotations(objects, angle_tolerance_deg=20):
    """
    Returns a list of violation dicts for objects whose rotation doesn't
    plausibly match their expected 'up' direction on the planet's surface.
    A generous tolerance (default 20 degrees) is used deliberately --
    this check is meant to catch GROSSLY wrong rotations (the kind that
    caused the original bug, where objects leaned in entirely the wrong
    direction), not to demand pixel-perfect alignment.
    """
    violations = []
    tolerance_rad = math.radians(angle_tolerance_deg)

    for idx, obj in enumerate(objects):
        rotation = obj.get("rotation")
        position = obj.get("position")
        if not rotation or not position:
            continue  # no rotation specified is valid (defaults to identity)

        actual_up = _rotation_matrix_column1(rotation[0], rotation[1], rotation[2])
        expected_up = _expected_up(position)

        dot = sum(a * b for a, b in zip(actual_up, expected_up))
        dot = max(-1.0, min(1.0, dot))  # clamp for floating point safety
        angle_between = math.acos(dot)

        if angle_between > tolerance_rad:
            violations.append({
                "type": "bad_rotation",
                "object_index": idx,
                "shape": obj.get("shape"),
                "position": position,
                "rotation": rotation,
                "angle_off_degrees": round(math.degrees(angle_between), 1),
                "message": (
                    f"Object {idx} ({obj.get('shape')}) at position {position} has a "
                    f"rotation that points {round(math.degrees(angle_between),1)} degrees "
                    f"away from the correct 'up' direction for its location on the planet."
                )
            })
    return violations


def check_gaps(objects):
    """
    Returns a list of violation dicts for objects that appear to be floating:
    their nearest other object is farther away than touching distance allows.
    Objects without a usable radius (lathe shapes, objects missing scale/position)
    are skipped rather than guessed at.
    """
    violations = []
    n = len(objects)

    radii = [_effective_radius(o) for o in objects]
    positions = [o.get("position") for o in objects]

    for i in range(n):
        if radii[i] is None or positions[i] is None:
            continue

        best_dist = None
        best_j = None
        for j in range(n):
            if i == j or positions[j] is None or radii[j] is None:
                continue
            d = _distance(positions[i], positions[j])
            needed = radii[i] + radii[j] - OVERLAP_MARGIN
            slack = d - needed
            if best_dist is None or slack < best_dist:
                best_dist = slack
                best_j = j

        if best_dist is not None and best_dist > GAP_TOLERANCE:
            violations.append({
                "type": "gap",
                "object_index": i,
                "shape": objects[i].get("shape"),
                "position": positions[i],
                "nearest_object_index": best_j,
                "excess_distance": round(best_dist, 3),
                "message": (
                    f"Object {i} ({objects[i].get('shape')}) at position {positions[i]} "
                    f"appears to be floating: even its nearest neighbor (object {best_j}) "
                    f"is {round(best_dist,3)} units farther away than touching distance allows."
                )
            })
    return violations


def validate_scene(scene_json, rotation_tolerance_deg=20):
    """
    Main entry point. Takes the parsed scene JSON (a dict with an "objects"
    key) and returns a combined list of violation dicts from both checks.
    An empty list means the scene passed validation.
    """
    objects = scene_json.get("objects", [])
    violations = []
    violations.extend(check_gaps(objects))
    violations.extend(check_rotations(objects, angle_tolerance_deg=rotation_tolerance_deg))
    return violations


def format_violations_for_retry(violations, max_items=15):
    """
    Turns a violations list into plain-English feedback suitable for sending
    back to Claude in a retry prompt. Caps the number of items listed to
    keep the retry prompt a reasonable size for large scenes.
    """
    if not violations:
        return ""

    lines = ["The previous scene had the following problems that must be fixed:"]
    for v in violations[:max_items]:
        lines.append(f"- {v['message']}")
    if len(violations) > max_items:
        lines.append(f"...and {len(violations) - max_items} more similar issues.")
    return "\n".join(lines)