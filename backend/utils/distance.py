import math

def haversine_distance(lat1, lng1, lat2, lng2):
    """
    Calculate the great-circle distance between two points on Earth using the Haversine formula.
    
    Args:
        lat1, lng1: Latitude and longitude of first point (decimal degrees)
        lat2, lng2: Latitude and longitude of second point (decimal degrees)
    
    Returns:
        Distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    # Convert decimal degrees to radians
    lat1_rad = math.radians(lat1)
    lng1_rad = math.radians(lng1)
    lat2_rad = math.radians(lat2)
    lng2_rad = math.radians(lng2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlng = lng2_rad - lng1_rad
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    distance = R * c
    
    return round(distance, 2)


def find_nearest_hospitals(emergency_lat, emergency_lng, hospitals, limit=5):
    """
    Find the nearest hospitals to an emergency location.
    
    Args:
        emergency_lat, emergency_lng: Emergency location coordinates
        hospitals: List of hospital dictionaries with 'lat' and 'lng' keys
        limit: Maximum number of hospitals to return
    
    Returns:
        List of hospitals sorted by distance with 'distance' key added
    """
    hospitals_with_distance = []
    
    for hospital in hospitals:
        distance = haversine_distance(
            emergency_lat, 
            emergency_lng, 
            hospital.get('lat', 17.6868), 
            hospital.get('lng', 83.2185)
        )
        hospital_with_dist = {**hospital, 'distance': distance}
        hospitals_with_distance.append(hospital_with_dist)
    
    # Sort by distance
    sorted_hospitals = sorted(hospitals_with_distance, key=lambda x: x['distance'])
    
    return sorted_hospitals[:limit]
