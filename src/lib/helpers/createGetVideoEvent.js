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
 * Create a synthetic playback event that can be sent to an Extension event's trigger
 * callback.
 * This synthetic event *MUST* be bound to the calling video DOM element.
 *
 * @param {String} eventType The Event Type that has been triggered.
 * @param {Object} nativeEvent The native video event object.
 * @param {Object} stateData Data about the current state of the video player.
 * See `getVideoStateData()`.
 * @param {String} videoPlatform Name of the video player's platform.
 *
 * @return {Event} Event object that is specific to the video playback's state.
 *
 * @this {DOMElement} The video DOM element that caused the event.
 *
 * @throws Will throw an error if eventType is not a string.
 * @throws Will throw an error if stateData is not an object.
 */
module.exports = function(eventType, nativeEvent, stateData, videoPlatform) {
  var toString = Object.prototype.toString;
  if (toString.call(eventType) !== '[object String]') {
    throw new Error('"eventType" input is not a string');
  }
  if (toString.call(stateData) !== '[object Object]') {
    throw new Error('"stateData" input is not an object');
  }

  var event = {
    element: this,
    target: this,
    nativeEvent: nativeEvent,
    state: eventType,
  };
  event[videoPlatform] = stateData;
  return event;
};
