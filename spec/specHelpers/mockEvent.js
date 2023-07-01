/**
 * Copyright 2022-2023 Yuhui. All rights reserved.
 *
 * Licensed under the GNU General Public License, Version 3.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.gnu.org/licenses/gpl-3.0.html
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const mockPlayer = require('./mockPlayer');

/**
 * Return a base `event` object for use with data element unit testing.
 */
module.exports = (dataElement, playerState) => {
  const player = mockPlayer;
  const { launchExt } = player;
  const {
    isAutopaused,
    isLiveEvent,
    isVideoLooped,
    playerColour,
    playSegmentTime,
    playTotalTime,
    videoCurrentTime,
    videoDuration,
    videoHeight,
    videoId,
    videoLoadedFraction,
    videoPlaybackRate,
    videoTitle,
    videoUrl,
    videoVolume,
    videoWidth,
  } = launchExt;

  const event = {
    vimeo: {
      playerAutopaused: isAutopaused,
      playerColour: playerColour,
      videoCurrentTime: videoCurrentTime,
      videoDuration: videoDuration,
      videoHeight: videoHeight,
      videoId: videoId,
      videoLoadedFraction: videoLoadedFraction,
      videoMuted: videoVolume === 0,
      videoLooped: isVideoLooped,
      videoPlaybackRate: videoPlaybackRate,
      videoTitle: videoTitle,
      videoType: isLiveEvent ? 'live' : 'video-on-demand',
      videoUrl: videoUrl,
      videoVolume: videoVolume,
      videoWidth: videoWidth,
    },
  };

  let defaultPlayerState = 'video playing';
  switch (dataElement) {
    case 'errorMessage':
    case 'errorMethod':
    case 'errorName':
      defaultPlayerState = 'player error';
      event.vimeo.errorName = 'ContrastError';
      event.vimeo.errorMethod = 'setColor';
      event.vimeo.errorMessage = '#984220 does not meet the minimum contrast ratio.';
      break;
    case 'videoMilestone':
      defaultPlayerState = 'video milestone';
      event.vimeo.videoMilestone = '25%';
      break;
    case 'videoPlayedSegmentTime':
    case 'videoPlayedTotalTime':
      defaultPlayerState = 'video paused';
      event.vimeo.videoPlayedTotalTime = playTotalTime;
      switch (dataElement) {
        case 'videoPlayedSegmentTime':
          event.vimeo.videoPlayedSegmentTime = playSegmentTime;
          break;
      }
      break;
  }

  const eventPlayerState = playerState || defaultPlayerState;
  event.vimeo.playerState = eventPlayerState;
  event.$type = `vimeo-playback.${eventPlayerState.replace(/\s/g, '-')}`;

  return event;
};
