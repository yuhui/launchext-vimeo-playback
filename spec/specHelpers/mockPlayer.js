/**
 * Copyright 2023 Yuhui. All rights reserved.
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
 * Return a `player` object for use with helper unit testing.
 */
module.exports = {
  launchExt: {
    isAutopaused: false,
    isLiveEvent: false,
    isVideoLooped: false,
    playerColour: '#ccc',
    playStartTime: 3,
    playStopTime: 12,
    playSegmentTime: 9,
    playTotalTime: 53703,
    videoCurrentTime: 12,
    videoDuration: 90210,
    videoHeight: 360,
    videoId: 123456,
    videoLoadedFraction: 0.6789,
    videoPlaybackRate: 1.5,
    videoTitle: 'Something something video',
    videoUrl: 'https://vimeo.com/123456',
    videoVolume: 0.8,
    videoWidth: 640,
  },
};
