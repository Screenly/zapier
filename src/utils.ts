// Utility functions for Screenly Zapier integration

import { ZObject, Bundle, HttpResponse } from 'zapier-platform-core';
import { READY_STATES, ZAPIER_TAG, ASSET_STATUS_QUERY } from './constants.js';
import {
  Asset,
  PlaylistItem,
  Playlist,
  Label,
  PlaylistLabel,
} from './types/screenly.js';

const handleError = <T>(
  response: HttpResponse<T>,
  customMessage: string
): T => {
  if (response.status >= 400) {
    throw new Error(customMessage);
  }

  return response.data;
};

const waitForAssetReady = async (
  z: ZObject,
  assetId: string,
  authToken: string
): Promise<string> => {
  let assetStatus;
  do {
    const params = new URLSearchParams({ id: `eq.${assetId}` });
    const statusResponse = await z.request({
      url: `https://api.screenlyapp.com/api/v4/assets?${params.toString()}`,
      headers: {
        Authorization: `Token ${authToken}`,
      },
    });

    const assets = handleError(statusResponse, 'Failed to check asset status');
    assetStatus = assets[0].status;

    // Log status for debugging
    z.console.log(`Asset ${assetId} status: ${assetStatus}`);
  } while (!READY_STATES.includes(assetStatus));

  return assetStatus;
};

const createAsset = async (
  z: ZObject,
  bundle: Bundle,
  {
    title,
    sourceUrl,
    disableVerification = false,
  }: { title: string; sourceUrl: string; disableVerification?: boolean }
): Promise<Asset> => {
  const response = await z.request({
    url: 'https://api.screenlyapp.com/api/v4/assets/',
    method: 'POST',
    headers: {
      Authorization: `Token ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: {
      title,
      source_url: sourceUrl,
      disable_verification: disableVerification,
      metadata: {
        tags: [ZAPIER_TAG],
      },
    },
  });

  const assets = handleError(response, 'Failed to upload asset');

  if (assets.length === 0) {
    throw new Error('No assets returned from the Screenly API');
  }

  return assets[0];
};

const createPlaylistItem = async (
  z: ZObject,
  bundle: Bundle,
  {
    assetId,
    playlistId,
    duration,
  }: { assetId: string; playlistId: string; duration: number }
): Promise<PlaylistItem> => {
  const payload: PlaylistItem = {
    asset_id: assetId,
    playlist_id: playlistId,
  };

  if (duration) {
    payload.duration = duration;
  }

  const response = await z.request({
    url: 'https://api.screenlyapp.com/api/v4/playlist-items/',
    method: 'POST',
    headers: {
      Authorization: `Token ${bundle.authData.api_key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: payload,
  });

  const items = handleError(response, 'Failed to add asset to playlist');

  if (items.length === 0) {
    throw new Error('No playlist items returned from the Screenly API');
  }

  return items[0];
};

const assignPlaylistToScreen = async (
  z: ZObject,
  bundle: Bundle,
  { screenId, playlistId }: { screenId: string; playlistId: string }
): Promise<{ screen_id: string; playlist_id: string; message: string }> => {
  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/labels/playlists`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
    body: {
      playlist_id: playlistId,
      label_id: screenId,
    },
    skipThrowForStatus: true,
  });

  if (response.status === 409) {
    z.console.log('Playlist already assigned to screen');
  } else {
    handleError(response, 'Failed to assign playlist to screen');
  }

  return {
    screen_id: screenId,
    playlist_id: playlistId,
    message: 'Successfully assigned playlist to screen',
  };
};

const createPlaylist = async (
  z: ZObject,
  bundle: Bundle,
  { title, predicate }: { title: string; predicate: string }
): Promise<Playlist> => {
  const response = await z.request({
    url: 'https://api.screenlyapp.com/api/v4/playlists',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
    body: {
      title,
      predicate,
    },
  });

  const playlists = handleError(response, 'Failed to create playlist');

  if (playlists.length === 0) {
    throw new Error('No playlists returned from the Screenly API');
  }

  return playlists[0];
};

const getLabel = async (
  z: ZObject,
  bundle: Bundle,
  { name }: { name: string }
): Promise<Label> => {
  const params = new URLSearchParams({ name: `eq.${name}` });

  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/labels/?${params.toString()}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
  });

  const labels = handleError(response, 'Failed to fetch labels');
  if (labels.length === 0) {
    throw new Error('No labels returned from the Screenly API');
  }
  return labels[0];
};

const getPlaylistsByLabel = async (
  z: ZObject,
  bundle: Bundle,
  { labelId }: { labelId: string }
): Promise<PlaylistLabel[]> => {
  const params = new URLSearchParams({ label_id: `eq.${labelId}` });
  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/labels/playlists?${params.toString()}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
  });

  return handleError(response, 'Failed to fetch playlist to labels');
};

const deletePlaylist = async (
  z: ZObject,
  bundle: Bundle,
  { playlistId }: { playlistId: string }
): Promise<boolean> => {
  const params = new URLSearchParams({ id: `eq.${playlistId}` });
  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/playlists/?${params.toString()}`,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
    skipThrowForStatus: true,
  });

  return response.status === 200;
};

const deleteAsset = async (
  z: ZObject,
  bundle: Bundle,
  { assetId }: { assetId: string }
): Promise<boolean> => {
  const params = new URLSearchParams({ id: `eq.${assetId}` });
  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/assets/?${params.toString()}`,
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
    skipThrowForStatus: true,
  });

  return response.status === 200;
};

const getAssetsCreatedByZapier = async (
  z: ZObject,
  bundle: Bundle
): Promise<Asset[]> => {
  const queryParams = [
    'metadata->tags=cs.["created_by_zapier"]',
    ASSET_STATUS_QUERY,
  ].join('&');

  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/assets/?${queryParams}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${bundle.authData.api_key}`,
      Prefer: 'return=representation',
    },
  });

  return handleError(response, 'Failed to fetch assets');
};

export default {
  handleError,
  waitForAssetReady,
  createAsset,
  createPlaylistItem,
  assignPlaylistToScreen,
  createPlaylist,
  getLabel,
  getPlaylistsByLabel,
  deletePlaylist,
  deleteAsset,
  getAssetsCreatedByZapier,
};
