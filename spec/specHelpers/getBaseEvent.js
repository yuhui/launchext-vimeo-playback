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
 * Return a base `event` object for use with data element unit testing.
 */
module.exports = function(optionalProperties) {
  const baseEvent = {
    state: 'video playing',
    vimeo: {
      playerAutopaused: false,
      playerColour: '#ccc',
      videoCurrentTime: 12,
      videoDuration: 90210,
      videoHeight: 360,
      videoId: 'abc123x',
      videoLoadedFraction: 0.6789,
      videoLooped: false,
      videoMuted: false,
      videoPlaybackRate: 1.5,
      videoTitle: 'Something something video',
      videoType: 'video-on-demand',
      videoUrl: 'https://vimeo.com/abc123x',
      videoVolume: 0.8,
      videoWidth: 640,
    },
  };

  if (optionalProperties) {
    optionalProperties.forEach((optionalProperty) => {
      switch (optionalProperty) {
        case 'errorMessage':
        case 'errorMethod':
        case 'errorName':
          baseEvent.state = 'player error';
          baseEvent.vimeo.errorName = 'ContrastError';
          baseEvent.vimeo.errorMethod = 'setColor';
          baseEvent.vimeo.errorMessage = '#984220 does not meet the minimum contrast ratio.';
          break;
        case 'videoMilestone':
          baseEvent.vimeo.videoMilestone = '25%';
          break;
        case 'videoPlayedSegmentTime':
        case 'videoPlayedTotalTime':
          baseEvent.state = 'video paused';
          baseEvent.vimeo.videoPlayedTotalTime = 53703;
          switch (optionalProperty) {
            case 'videoPlayedSegmentTime':
              baseEvent.vimeo.videoPlayedSegmentTime = 9;
              break;
          }
          break;
      }
    });
  }

  return baseEvent;
};
