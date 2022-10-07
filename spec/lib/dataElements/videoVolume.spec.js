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

describe('videoVolume data element delegate', () => {
  const dataElementDelegate = require('../../../src/lib/dataElements/videoVolume');
  const getBaseEvent = require('../../specHelpers/getBaseEvent');

  beforeEach(() => {
    this.event = getBaseEvent();

    // this data element does not have any custom settings
    this.settings = {};
  });

  describe('with invalid "event" argument', () => {
    it(
      'should be undefined when "vimeo" property is missing',
      () => {
        delete this.event.vimeo;
        const result = dataElementDelegate(this.settings, this.event);
        expect(result).toBeUndefined();
      }
    );

    it(
      'should be undefined when "videoVolume" property is missing',
      () => {
        delete this.event.vimeo.videoVolume;
        const result = dataElementDelegate(this.settings, this.event);
        expect(result).toBeUndefined();
      }
    );
  });

  describe('with valid "event" argument', () => {
    it(
      'should be a number between 0 and 1',
      () => {
        const result = dataElementDelegate(this.settings, this.event);
        expect(result).toBeInstanceOf(Number);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    );
  });

});
