"""
map_visualizer.py — canonical route HTML exporter.

Uses the EXACT same route objects as the live preview (no recomputation).
Stops are Shapely-snapped onto polyline geometry.
Dark-matter tiles, trunk/feeder hierarchy, hub glow — identical to preview.
"""
import os
import folium
from folium.plugins import PolyLineTextPath

try:
    from shapely.geometry import LineString, Point
    _SHAPELY = True
except ImportError:
    _SHAPELY = False


# ── colour / weight constants (matches render_routes_and_hubs in app.py) ─────
_TRUNK_COLOR  = "#00E5FF"
_TRUNK_WEIGHT = 6
_FEEDER_COLOR = "#FF5252"
_FEEDER_WEIGHT = 3
_HUB_COLOR    = "#FFC107"
_STOP_COLOR   = "#9AA4B2"


def _snap_stops_to_polyline(polyline_coords, stop_coords):
    """
    Project each stop onto the nearest point of the route polyline
    using Shapely.  Falls back to original coords if Shapely unavailable.

    polyline_coords : [[lat, lon], ...]
    stop_coords     : [[lat, lon], ...] or [(lat, lon), ...]
    Returns         : list of [lat, lon]
    """
    if not _SHAPELY or len(polyline_coords) < 2:
        return [[s[0], s[1]] for s in stop_coords]

    # Build LineString in (lon, lat) → x, y convention
    line = LineString([(c[1], c[0]) for c in polyline_coords])
    snapped = []
    for s in stop_coords:
        pt = Point(s[1], s[0])
        proj = line.interpolate(line.project(pt))
        snapped.append([proj.y, proj.x])   # back to [lat, lon]
    return snapped


def create_bus_maps(df, routes, hubs_df=None, output_dir="outputs"):
    """
    Generate one downloadable HTML per route, using canonical route geometry.

    Parameters
    ----------
    df        : stops DataFrame (lat, lon, stop_name)
    routes    : {route_id: [(lat, lon, name), ...]}  — same object as preview
    hubs_df   : DataFrame with lat, lon, hub_id  (optional)
    output_dir: output folder

    Returns
    -------
    list of HTML file paths
    """
    os.makedirs(output_dir, exist_ok=True)

    center = [df["lat"].mean(), df["lon"].mean()]
    paths = []

    for rid, stop_list in routes.items():
        if not stop_list:
            continue

        is_trunk = str(rid).startswith("TRUNK")
        color  = _TRUNK_COLOR  if is_trunk else _FEEDER_COLOR
        weight = _TRUNK_WEIGHT if is_trunk else _FEEDER_WEIGHT
        dash   = None if is_trunk else "8 5"
        label  = "🚀 Trunk" if is_trunk else "🚌 Feeder"

        # ── raw coords from canonical route ──────────────────────────
        raw_coords = [[s[0], s[1]] for s in stop_list]

        # ── snap stops to polyline ────────────────────────────────────
        snapped_stops = _snap_stops_to_polyline(raw_coords, raw_coords)

        # ── build map ────────────────────────────────────────────────
        m = folium.Map(
            location=center,
            zoom_start=12,
            tiles="CartoDB dark_matter",
            control_scale=True,
        )

        # route polyline (exact geometry, arrow direction markers)
        poly = folium.PolyLine(
            snapped_stops,
            color=color,
            weight=weight,
            opacity=0.95,
            dash_array=dash,
            tooltip=f"{label}: {rid}",
        )
        poly.add_to(m)

        # direction arrows
        try:
            PolyLineTextPath(
                poly,
                "▶",
                repeat=True,
                offset=10,
                attributes={"font-size": "14", "fill": color},
            ).add_to(m)
        except Exception:
            pass

        # stop markers exactly on polyline
        for i, (slat, slon) in enumerate(snapped_stops):
            orig_name = stop_list[i][2] if len(stop_list[i]) > 2 else f"Stop {i+1}"
            folium.CircleMarker(
                location=[slat, slon],
                radius=5,
                color=color,
                fill=True,
                fill_color=color,
                fill_opacity=0.9,
                popup=folium.Popup(
                    f"<b>{orig_name}</b><br>Stop {i+1}/{len(snapped_stops)}",
                    max_width=180,
                ),
                tooltip=orig_name,
            ).add_to(m)

        # hub markers for this route's area
        if hubs_df is not None and len(hubs_df) > 0:
            for _, h in hubs_df.iterrows():
                # glow ring
                folium.CircleMarker(
                    [h["lat"], h["lon"]],
                    radius=16, color="#FFD54F",
                    fill=True, fill_opacity=0.12, weight=0,
                ).add_to(m)
                # core
                folium.CircleMarker(
                    [h["lat"], h["lon"]],
                    radius=10,
                    color=_HUB_COLOR, fill=True,
                    fill_color=_HUB_COLOR, fill_opacity=0.95,
                    popup=folium.Popup(
                        f"<b>{h['hub_id']}</b><br>"
                        f"📊 Centrality: {h.get('centrality', '—')}",
                        max_width=200,
                    ),
                    tooltip=h["hub_id"],
                ).add_to(m)

        # auto-fit to route
        if snapped_stops:
            m.fit_bounds(snapped_stops)

        # ── save ──────────────────────────────────────────────────────
        file_path = os.path.join(output_dir, f"bus_route_{rid}.html")
        m.save(file_path)
        paths.append(file_path)

    return paths
