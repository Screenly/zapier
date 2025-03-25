// Utility functions for Screenly Zapier integration

import { ZObject, Bundle } from 'zapier-platform-core';
import { READY_STATES } from './constants.js';

const handleError = (response: any, customMessage: string) => {
  if (response.status >= 400) {
    throw new Error(customMessage);
  }

  return response.json;
};

const makeRequest = async (z: ZObject, url: string, options: object = {}): Promise<object> => {
  const response = await z.request({
    url,
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Token ${z.authData.api_key}`,
    },
  });

  return handleError(response, 'Screenly API Error');
};

const waitForAssetReady = async (z: ZObject, assetId: string, authToken: string) => {
  let assetStatus;
  do {
    const statusResponse = await z.request({
      url: `https://api.screenlyapp.com/api/v4/assets?id=eq.${assetId}`,
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
) => {
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
  { assetId, playlistId, duration }: { assetId: string; playlistId: string; duration: number }
) => {
  const payload: any = {
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
) => {
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
) => {
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

const getLabel = async (z: ZObject, bundle: Bundle, { name }: { name: string }) => {
  const queryParams: any = { name: `eq.${name}` };
  const queryString = Object.keys(queryParams)
    .map((key) => `${key}=${queryParams[key]}`)
    .join('&');

  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/labels/?${queryString}`,
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
) => {
  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/labels/playlists?label_id=eq.${labelId}`,
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
) => {
  const response = await z.request({
    url: `https://api.screenlyapp.com/api/v4/playlists/?id=eq.${playlistId}/`,
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

export default {
  handleError,
  makeRequest,
  waitForAssetReady,
  createAsset,
  createPlaylistItem,
  assignPlaylistToScreen,
  createPlaylist,
  getLabel,
  getPlaylistsByLabel,
  deletePlaylist,
};
