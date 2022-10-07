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

describe('createGetVideoEvent helper delegate', () => {
  const createGetVideoEventDelegate = require('../../../src/lib/helpers/createGetVideoEvent');
  const element = jasmine.createSpy();
  const eventType = 'test event type';
  const nativeEvent = {};
  const stateData = {};
  const videoPlatform = 'vimeo';
  const getVideoEvent = createGetVideoEventDelegate.bind(element);

  it(
    'throws an error when "eventType" input is not a string',
    () => {
      expect(() => {
        getVideoEvent(null, nativeEvent, stateData, videoPlatform);
      }).toThrowError('"eventType" input is not a string');
    }
  );

  it(
    'throws an error when "stateData" input is not an object',
    () => {
      expect(() => {
        getVideoEvent(eventType, nativeEvent, null), videoPlatform;
      }).toThrowError('"stateData" input is not an object');
    }
  );

  it(
    'returns an object with the specified inputs set in the appropriate keys',
    () => {
      const result = getVideoEvent(eventType, nativeEvent, stateData, videoPlatform);
      expect(result).toBeDefined();
      expect(result.element).toEqual(element);
      expect(result.target).toEqual(element);
      expect(result.nativeEvent).toEqual(nativeEvent);
      expect(result.state).toEqual(eventType);
      expect(Object.keys(result)).toContain(videoPlatform);
      expect(result[videoPlatform]).toEqual(stateData);
    }
  );
});
