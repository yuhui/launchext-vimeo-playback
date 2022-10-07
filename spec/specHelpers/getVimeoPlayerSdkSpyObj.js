/**
 * Copyright 2022 Yuhui. All rights reserved.
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

/**
 * Return a `vimeoPlayerSdk` spy object for use with event and action unit testing.
 */
module.exports = () => {
  const vimeoPlayerSdkSpyObj = jasmine.createSpyObj(
    'vimeoPlayerSdk',
    [
      'enableVideoPlaybackTracking',
      'loadVimeoPlayerSdkScript',
      'registerEventTrigger',
    ],
    {
      playbackRateChanged: 'playback rate changed',
      playerError: 'player error',
      playerReady: 'player ready',
      playerRemoved: 'player removed',
      videoBufferEnded: 'video buffer ended',
      videoBufferStarted: 'video buffer started',
      videoCued: 'video cued',
      videoEnded: 'video ended',
      videoLoaded: 'video loaded',
      videoMilestone: 'video milestone',
      videoPaused: 'video paused',
      videoPlaying: 'video playing',
      videoProgress: 'video progress',
      videoSeeked: 'video seeked',
      videoTimeUpdated: 'video time updated',
      videoVolumeChanged: 'video volume changed',
    }
  );

  return vimeoPlayerSdkSpyObj;
};
