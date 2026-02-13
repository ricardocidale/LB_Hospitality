def calculate_revpar(total_room_revenue: float, available_rooms: int) -> float:
    if available_rooms <= 0:
        raise ValueError("Available rooms must be greater than zero")
    return total_room_revenue / available_rooms


def calculate_revpar_from_adr(adr: float, occupancy_rate: float) -> float:
    if not 0 <= occupancy_rate <= 1:
        raise ValueError("Occupancy rate must be between 0 and 1")
    return adr * occupancy_rate
