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

const SEVENTEEN = 17;
const SIX = 6;

describe('videoTimeDifference helper delegate', () => {
  beforeAll(() => {
    this.helperDelegate = require('../../../src/lib/helpers/videoTimeDifference');
  });

  it(
    'equals 11 when the inputs are 17 and 6',
    () => {
      const result = this.helperDelegate(SEVENTEEN, SIX);
      expect(result).toEqual(11);
    }
  );

  it(
    'equals 11 when the inputs are 6 and 17',
    () => {
      const result = this.helperDelegate(SIX, SEVENTEEN);
      expect(result).toEqual(11);
    }
  );
});
