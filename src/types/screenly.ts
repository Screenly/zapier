// The interface declarations do not include all the fields in the API response.
// For more information, see the API documentation: https://developer.screenly.io/api_v4/

export interface Asset {
  id: string;
  title: string;
  source_url: string;
  status: string;
  created_at: string;
  disable_verification: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  predicate: string;
}

export interface PlaylistItem {
  asset_id: string;
  playlist_id: string;
  duration?: number;
}

export interface PlaylistLabel {
  playlist_id: string;
}

export interface Label {
  id: string;
  name: string;
}
