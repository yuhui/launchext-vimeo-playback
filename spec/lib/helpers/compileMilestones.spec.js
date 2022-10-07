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

describe('compileMilestones helper delegate', () => {
  const helperDelegate = require('../../../src/lib/helpers/compileMilestones');
  const videoDuration = 120;
  const videoStartTime = 38284;
  const isLiveEvent = true;
  const percentage25Trigger = jasmine.createSpy();
  const percentage50FirstTrigger = jasmine.createSpy();
  const percentage50SecondTrigger = jasmine.createSpy();
  const seconds30Trigger = jasmine.createSpy();
  const milestoneTriggersArr = [
    {
      milestone: {
        amount: 25,
        type: 'fixed',
        unit: 'percent',
      },
      trigger: percentage25Trigger,
    },
    {
      milestone: {
        amount: 50,
        type: 'fixed',
        unit: 'percent',
      },
      trigger: percentage50FirstTrigger,
    },
    {
      milestone: {
        amount: 50,
        type: 'fixed',
        unit: 'percent',
      },
      trigger: percentage50SecondTrigger,
    },
    {
      milestone: {
        amount: 30,
        type: 'fixed',
        unit: 'seconds',
      },
      trigger: seconds30Trigger,
    },
  ];
  const milestoneVODExpectedObject = {
    fixed: {
      30: {
        '25%': [ percentage25Trigger ],
        '30s': [ seconds30Trigger ],
      },
      60: {
        '50%': [ percentage50FirstTrigger, percentage50SecondTrigger ],
      },
    },
  };
  const milestoneLiveExpectedObject = {
    fixed: {
      38314: {
        '30s': [ seconds30Trigger ],
      },
    },
  };

  it(
    'throws an error when "milestoneTriggersArr" input is not an array',
    () => {
      expect(() => {
        helperDelegate(null, videoDuration, videoStartTime, isLiveEvent);
      }).toThrowError('"milestoneTriggersArr" input is not an array');
    }
  );

  it(
    'throws an error when "videoDuration" input is not a number',
    () => {
      expect(() => {
        helperDelegate(milestoneTriggersArr, null, videoStartTime, isLiveEvent);
      }).toThrowError('"videoDuration" input is not a number');
    }
  );

  it(
    'throws an error when "videoStartTime" input is not a number',
    () => {
      expect(() => {
        helperDelegate(milestoneTriggersArr, videoDuration, null, isLiveEvent);
      }).toThrowError('"videoStartTime" input is not a number');
    }
  );

  it(
    'throws an error when "isLiveEvent" input is not a boolean',
    () => {
      expect(() => {
        helperDelegate(milestoneTriggersArr, videoDuration, videoStartTime, null);
      }).toThrowError('"isLiveEvent" input is not a boolean');
    }
  );

  it(
    'returns an object with the specified milestones for VOD videos set in the appropriate keys',
    () => {
      const result = helperDelegate(milestoneTriggersArr, videoDuration, 0, false);
      expect(result).toBeInstanceOf(Object);

      const milestoneTypes = Object.keys(result);
      expect(
        JSON.stringify(milestoneTypes)
      ).toEqual(
        JSON.stringify(Object.keys(milestoneVODExpectedObject))
      );

      milestoneTypes.forEach((milestoneType) => {
        const resultMilestoneType = result[milestoneType];
        const seconds = Object.keys(resultMilestoneType);
        expect(
          JSON.stringify(seconds)
        ).toEqual(
          JSON.stringify(Object.keys(milestoneVODExpectedObject[milestoneType]))
        );

        seconds.forEach((second) => {
          const resultMilestoneTypeSecond = resultMilestoneType[second];
          const labels = Object.keys(resultMilestoneTypeSecond);
          expect(
            JSON.stringify(labels)
          ).toEqual(
            JSON.stringify(Object.keys(milestoneVODExpectedObject[milestoneType][second]))
          );
        });
      });

      // since all of the keys have been verified, then test the arrays of triggers individually
      expect(result.fixed['30']['25%']).toBeInstanceOf(Array);
      expect(result.fixed['30']['25%'].length).toEqual(1);
      expect(result.fixed['30']['25%']).toContain(percentage25Trigger);
      expect(result.fixed['30']['30s']).toBeInstanceOf(Array);
      expect(result.fixed['30']['30s'].length).toEqual(1);
      expect(result.fixed['30']['30s']).toContain(seconds30Trigger);
      expect(result.fixed['60']['50%']).toBeInstanceOf(Array);
      expect(result.fixed['60']['50%'].length).toEqual(2);
      expect(result.fixed['60']['50%']).toContain(percentage50FirstTrigger);
      expect(result.fixed['60']['50%']).toContain(percentage50SecondTrigger);
    }
  );

  it(
    'returns an object with the specified milestones for live videos set in the appropriate keys',
    () => {
      const result = helperDelegate(
        milestoneTriggersArr, videoDuration, videoStartTime, isLiveEvent
      );
      expect(result).toBeInstanceOf(Object);

      const milestoneTypes = Object.keys(result);
      expect(
        JSON.stringify(milestoneTypes)
      ).toEqual(
        JSON.stringify(Object.keys(milestoneLiveExpectedObject))
      );

      milestoneTypes.forEach((milestoneType) => {
        const resultMilestoneType = result[milestoneType];
        const seconds = Object.keys(resultMilestoneType);
        expect(
          JSON.stringify(seconds)
        ).toEqual(
          JSON.stringify(Object.keys(milestoneLiveExpectedObject[milestoneType]))
        );

        seconds.forEach((second) => {
          const resultMilestoneTypeSecond = resultMilestoneType[second];
          const labels = Object.keys(resultMilestoneTypeSecond);
          expect(
            JSON.stringify(labels)
          ).toEqual(
            JSON.stringify(Object.keys(milestoneLiveExpectedObject[milestoneType][second]))
          );
        });
      });

      // since all of the keys have been verified, then test the arrays of triggers individually
      expect(result.fixed['38314']['30s']).toBeInstanceOf(Array);
      expect(result.fixed['38314']['30s'].length).toEqual(1);
      expect(result.fixed['38314']['30s']).toContain(seconds30Trigger);
    }
  );
});
