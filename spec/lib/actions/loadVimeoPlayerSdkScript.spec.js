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

const proxyquire = require('proxyquire').noCallThru();

const mockTurbine = require('../../specHelpers/mockTurbine');
const mockVimeoPlayerSdk = require('../../specHelpers/mockVimeoPlayerSdk');

describe('loadVimeoPlayerSdkScript action delegate', () => {
  const vimeoPlayerSdk = mockVimeoPlayerSdk();

  beforeAll(() => {
    global.turbine = mockTurbine;
    this.actionDelegate = proxyquire('../../../src/lib/actions/loadVimeoPlayerSdkScript', {
      '../helpers/vimeoPlayerSdk': vimeoPlayerSdk,
    });
  });

  beforeEach(() => {
    // this action does not have any custom settings
    this.settings = {};
    this.event = {
      '$type': 'dom-ready',
    };
    this.actionDelegate(this.settings, this.event);
  });

  afterAll(() => {
    delete global.turbine;
  });

  it(
    'calls the action from the vimeoPlayerSdk helper module once only',
    () => {
      const result = vimeoPlayerSdk.loadVimeoPlayerSdkScript;
      expect(result).toHaveBeenCalledOnceWith(this.settings);
    }
  );

  it(
    'logs a debug message for the event type',
    () => {
      const logDebug = global.turbine.logger.debug;
      expect(logDebug).toHaveBeenCalledWith(
        `Loading Vimeo Player SDK script on ${this.event.$type}`
      );
    }
  );
});
