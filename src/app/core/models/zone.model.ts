export interface Zone {
  id: string;
  name: string;
  location?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneRequest {
  name: string;
  location?: string;
}
