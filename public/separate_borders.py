"""
Script to separate India's international land borders from coastal borders.
Reads india-map.geojson and creates two output files:
- india-land-borders.geojson (borders with Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar)
- india-coastal-borders.geojson (Arabian Sea, Bay of Bengal, Indian Ocean coastlines)
"""

import json
from pathlib import Path

# Define geographic regions for international land borders
# These are approximate bounding boxes for border regions

LAND_BORDER_REGIONS = [
    # Pakistan border (western)
    {"name": "Pakistan", "lat_min": 23, "lat_max": 37, "lon_min": 68, "lon_max": 74.5},
    
    # China border (northern - Ladakh, Himachal, Uttarakhand, Sikkim, Arunachal)
    {"name": "China-West", "lat_min": 32, "lat_max": 37, "lon_min": 74, "lon_max": 80},
    {"name": "China-Central", "lat_min": 29, "lat_max": 32, "lon_min": 78, "lon_max": 89},
    {"name": "China-East", "lat_min": 27, "lat_max": 30, "lon_min": 89, "lon_max": 97.5},
    
    # Nepal border
    {"name": "Nepal", "lat_min": 26, "lat_max": 30.5, "lon_min": 80, "lon_max": 88.2},
    
    # Bhutan border
    {"name": "Bhutan", "lat_min": 26.5, "lat_max": 28.5, "lon_min": 88.5, "lon_max": 92.2},
    
    # Bangladesh border
    {"name": "Bangladesh-North", "lat_min": 24, "lat_max": 26.5, "lon_min": 88, "lon_max": 92.5},
    {"name": "Bangladesh-East", "lat_min": 21.5, "lat_max": 25, "lon_min": 91.5, "lon_max": 92.8},
    {"name": "Bangladesh-South", "lat_min": 20.5, "lat_max": 24, "lon_min": 88.5, "lon_max": 92.5},
    
    # Myanmar border (eastern)
    {"name": "Myanmar", "lat_min": 20, "lat_max": 29, "lon_min": 93.5, "lon_max": 97.5},
]


def is_in_land_border_region(lon, lat):
    """Check if a coordinate is in a land border region."""
    for region in LAND_BORDER_REGIONS:
        if (region["lat_min"] <= lat <= region["lat_max"] and 
            region["lon_min"] <= lon <= region["lon_max"]):
            return True
    return False


def is_coastal_region(lon, lat):
    """Check if a coordinate is in a coastal region."""
    # Arabian Sea coast (western coast, low latitude or Gujarat coast)
    if lon < 77 and lat < 24:
        return True
    
    # Southern tip and Lakshadweep
    if lat < 12:
        return True
    
    # Bay of Bengal coast (eastern coast, below Bangladesh)
    if lon > 79 and lat < 22 and lon < 88:
        return True
    
    # Andaman and Nicobar Islands (definitely coastal)
    if lon > 92 and lat < 14:
        return True
    
    return False


def extract_boundary_segments(coordinates):
    """Extract line segments from polygon coordinates."""
    segments = []
    
    if isinstance(coordinates[0][0], (int, float)):
        # Simple polygon ring
        for i in range(len(coordinates) - 1):
            segments.append([coordinates[i], coordinates[i + 1]])
    elif isinstance(coordinates[0][0], list):
        # Nested structure
        for ring in coordinates:
            segments.extend(extract_boundary_segments(ring))
    
    return segments


def classify_segment(segment):
    """
    Classify a line segment as 'land' or 'coastal'.
    A segment is classified based on the average position of its endpoints.
    """
    lon1, lat1 = segment[0]
    lon2, lat2 = segment[1]
    
    avg_lon = (lon1 + lon2) / 2
    avg_lat = (lat1 + lat2) / 2
    
    # Check both endpoints and average
    land_count = 0
    coastal_count = 0
    
    for lon, lat in [(lon1, lat1), (lon2, lat2), (avg_lon, avg_lat)]:
        if is_in_land_border_region(lon, lat):
            land_count += 1
        if is_coastal_region(lon, lat):
            coastal_count += 1
    
    # Prioritize land border classification if any point matches
    if land_count >= 2:
        return 'land'
    elif coastal_count >= 2:
        return 'coastal'
    elif land_count >= 1:
        return 'land'
    elif coastal_count >= 1:
        return 'coastal'
    else:
        # Default: if northern (lat > 26) and near edges, likely land border
        # Otherwise, likely internal boundary (skip)
        return None


def merge_consecutive_segments(segments):
    """Merge consecutive segments into LineStrings."""
    if not segments:
        return []
    
    lines = []
    current_line = [segments[0][0], segments[0][1]]
    
    for i in range(1, len(segments)):
        seg = segments[i]
        if current_line[-1] == seg[0]:
            current_line.append(seg[1])
        else:
            if len(current_line) >= 2:
                lines.append(current_line)
            current_line = [seg[0], seg[1]]
    
    if len(current_line) >= 2:
        lines.append(current_line)
    
    return lines


def main():
    # Read input file
    input_path = Path(__file__).parent / "india-map.geojson"
    
    print(f"Reading {input_path}...")
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    land_segments = []
    coastal_segments = []
    
    print("Processing features...")
    for feature in data.get('features', []):
        geometry = feature.get('geometry', {})
        geom_type = geometry.get('type', '')
        coordinates = geometry.get('coordinates', [])
        
        if geom_type == 'Polygon':
            coords_list = [coordinates]
        elif geom_type == 'MultiPolygon':
            coords_list = coordinates
        else:
            continue
        
        for polygon_coords in coords_list:
            segments = extract_boundary_segments(polygon_coords)
            
            for segment in segments:
                classification = classify_segment(segment)
                if classification == 'land':
                    land_segments.append(segment)
                elif classification == 'coastal':
                    coastal_segments.append(segment)
    
    print(f"Found {len(land_segments)} land border segments")
    print(f"Found {len(coastal_segments)} coastal border segments")
    
    # Merge consecutive segments into lines
    land_lines = merge_consecutive_segments(land_segments)
    coastal_lines = merge_consecutive_segments(coastal_segments)
    
    print(f"Merged into {len(land_lines)} land border lines")
    print(f"Merged into {len(coastal_lines)} coastal border lines")
    
    # Create output GeoJSON for land borders
    land_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "type": "land_border",
                    "description": "India's international land borders with Pakistan, China, Nepal, Bhutan, Bangladesh, Myanmar"
                },
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": land_lines
                }
            }
        ]
    }
    
    # Create output GeoJSON for coastal borders
    coastal_geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "type": "coastal_border",
                    "description": "India's coastline - Arabian Sea, Bay of Bengal, Indian Ocean"
                },
                "geometry": {
                    "type": "MultiLineString",
                    "coordinates": coastal_lines
                }
            }
        ]
    }
    
    # Write output files
    land_output = Path(__file__).parent / "india-land-borders.geojson"
    coastal_output = Path(__file__).parent / "india-coastal-borders.geojson"
    
    print(f"Writing {land_output}...")
    with open(land_output, 'w', encoding='utf-8') as f:
        json.dump(land_geojson, f, indent=2)
    
    print(f"Writing {coastal_output}...")
    with open(coastal_output, 'w', encoding='utf-8') as f:
        json.dump(coastal_geojson, f, indent=2)
    
    print("Done!")
    print(f"\nOutput files created:")
    print(f"  - {land_output}")
    print(f"  - {coastal_output}")


if __name__ == "__main__":
    main()
