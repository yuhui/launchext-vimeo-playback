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

const proxyquire = require('proxyquire').noCallThru();
const eventState = 'video time updated';

describe(`"${eventState}" event delegate`, () => {
  it(
    'sends the trigger to the vimeoPlayerSdk helper module once only',
    () => {
      const getVimeoPlayerSdkSpyObj = require('../../specHelpers/getVimeoPlayerSdkSpyObj');
      const vimeoPlayerSdkSpyObj = getVimeoPlayerSdkSpyObj();

      const eventDelegate = proxyquire('../../../src/lib/events/videoTimeUpdated', {
        '../helpers/vimeoPlayerSdk': vimeoPlayerSdkSpyObj,
      });
      const settings = {};
      const trigger = jasmine.createSpy();

      eventDelegate(settings, trigger);
      const result = vimeoPlayerSdkSpyObj.registerEventTrigger;
      expect(result).toHaveBeenCalledTimes(1);
      expect(result).toHaveBeenCalledWith(eventState, settings, trigger);
    }
  );
});
