/**
 * Copyright 2022-2024 Yuhui. All rights reserved.
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

var window = require('@adobe/reactor-window');
var document = require('@adobe/reactor-document');
var loadScript = require('@adobe/reactor-load-script');
var Promise = require('@adobe/reactor-promise');

var compileMilestones = require('./compileMilestones');
var createGetVideoEvent = require('./createGetVideoEvent');
var getVideoStateData = require('./getVideoStateData');
var flooredVideoTime = require('./flooredVideoTime');
var registerPlayerElement = require('./registerPlayerElement');
var videoTimeDifference = require('./videoTimeDifference');

var logger = turbine.logger;

// constants related to Event Types used in this extension
var PLAYBACK_RATE_CHANGED = 'playback rate changed';
var PLAYER_ERROR = 'player error';
var PLAYER_READY = 'player ready';
var PLAYER_REMOVED = 'player removed'; // Extension-specific event
var VIDEO_BUFFER_ENDED = 'video buffer ended';
var VIDEO_BUFFER_STARTED = 'video buffer started';
var VIDEO_CUED = 'video cued';
var VIDEO_ENDED = 'video ended';
var VIDEO_LOADED = 'video loaded';
var VIDEO_MILESTONE = 'video milestone'; // Extension-specific event
var VIDEO_PAUSED = 'video paused';
var VIDEO_PLAYING = 'video playing';
var VIDEO_PROGRESS = 'video progress';
var VIDEO_REPLAYED = 'video replayed'; // no Extension trigger
var VIDEO_RESUMED = 'video resumed'; // no Extension trigger
var VIDEO_SEEKED = 'video seeked';
var VIDEO_STARTED = 'video started'; // no Extension trigger
var VIDEO_TIME_UPDATED = 'video time updated';
var VIDEO_VOLUME_CHANGED = 'video volume changed';
var ALL_EVENT_TYPES = [
  PLAYBACK_RATE_CHANGED,
  PLAYER_ERROR,
  PLAYER_READY,
  PLAYER_REMOVED,
  VIDEO_BUFFER_ENDED,
  VIDEO_BUFFER_STARTED,
  VIDEO_CUED,
  VIDEO_ENDED,
  VIDEO_LOADED,
  VIDEO_MILESTONE,
  VIDEO_PAUSED,
  VIDEO_PLAYING,
  VIDEO_PROGRESS,
  VIDEO_REPLAYED,
  VIDEO_RESUMED,
  VIDEO_SEEKED,
  VIDEO_STARTED,
  VIDEO_TIME_UPDATED,
  VIDEO_VOLUME_CHANGED,
];

// set of Event Types related to video playback
var VIDEO_EVENT_TYPES = [
  VIDEO_BUFFER_ENDED,
  VIDEO_BUFFER_STARTED,
  VIDEO_CUED,
  VIDEO_ENDED,
  VIDEO_LOADED,
  VIDEO_PAUSED,
  VIDEO_PLAYING,
  VIDEO_PROGRESS,
  VIDEO_REPLAYED,
  VIDEO_RESUMED,
  VIDEO_SEEKED,
  VIDEO_STARTED,
  // but *not* VIDEO_TIME_UPDATED because it needs to be detected every time it is triggered
];

// set of Event Types when video had started playing
var VIDEO_PLAYING_EVENT_TYPES = [
  VIDEO_REPLAYED,
  VIDEO_RESUMED,
  VIDEO_STARTED,
];

// set of Event Types when video had stopped playing
var VIDEO_STOPPED_EVENT_TYPES = [
  VIDEO_PAUSED,
  VIDEO_ENDED,
];

// set of Event Types when the player has been stopped
var PLAYER_STOPPED_EVENT_TYPES = VIDEO_STOPPED_EVENT_TYPES.concat([
  PLAYER_REMOVED,
]);

// constants related to setting up the Vimeo Player SDK
var IFRAME_ID_PREFIX = 'vimeoPlayback';
var IFRAME_URL_PATTERN = 'vimeo';
var IFRAME_SELECTOR = 'iframe[src*=' + IFRAME_URL_PATTERN + ']';
var PLAYER_SETUP_MODIFIED_STATUS = 'modified';
var PLAYER_SETUP_UPDATING_STATUS = 'updating';
var PLAYER_SETUP_COMPLETED_STATUS = 'completed';
var PLAYER_SETUP_READY_STATUS = 'ready';
var MAXIMUM_ATTEMPTS_TO_WAIT_FOR_VIDEO_PLATFORM_API = 5;
var VIDEO_PLATFORM = 'vimeo';
var VIMEO_PLAYER_SDK_URL = 'https://player.vimeo.com/api/player.js';

// constants related to video milestone tracking
var VIDEO_MILESTONE_PERCENT_UNIT = 'percent';
var VIDEO_MILESTONE_SECONDS_UNIT = 'seconds';
var VIDEO_MILESTONE_UNITS = [VIDEO_MILESTONE_PERCENT_UNIT, VIDEO_MILESTONE_SECONDS_UNIT];

/**
 * Registry of Event Types that have been configured in the Launch property.
 * {
 *   matchingSelector: {
 *     eventType: [
 *       {
 *         milestone: {
 *           amount: <number>,
 *           type: <string "fixed", "every">,
 *           unit: <string "percent", "seconds">,
 *         },
 *         trigger: trigger,
 *       },
 *     ],
 *   },
 * }
 */
var eventRegistry = {};

/**
 * Registry of players that have been enabled.
 * {
 *   playerId: player
 * }
 */
var playerRegistry = {};

/**
 * Handle an Event Type.
 *
 * @param {String} eventType The Event Type that has been triggered.
 * @param {Object} player The Vimeo player object.
 * @param {Object} nativeEvent The native Vimeo event object.
 * @param {Array} eventTriggers Array of triggers for this Event Type.
 * @param {Object} options (optional) Any options for this Event Type.
 * @param {Object} options.error (optional) Options related to Vimeo error reporting.
 * @param {String} options.error.message Vimeo error message.
 * @param {Number} options.error.method Vimeo method that caused the error.
 * @param {Number} options.error.name Vimeo error name.
 * @param {Object} options.milestone (optional) Options related to video milestone tracking.
 * @param {String} options.milestone.label Label to track with the video milestone.
 * @param {Array} options.additionalTriggers (optional) List of other triggers and their state
 * data to fire with this Event Type.
 * @param {Object} options.additionalTriggers[].stateData Object of state data for the additional
 * triggers to use with this Event Type.
 * @param {Array} options.additionalTriggers[].triggers Array of additional triggers to use with
 * this Event Type.
 */
var processEventType = function(eventType, player, nativeEvent, eventTriggers, options) {
  if (!eventTriggers || Object.keys(eventTriggers) === 0) {
    // don't continue if there are no triggers for this Event Type
    return;
  }

  var stateData;
  try {
    stateData = getVideoStateData(player, eventType);
  } catch (e) {
    logger.error(e);
    return;
  }

  // perform additional tasks based on the Event Type
  var element = player.element;
  var elementId = element.id;
  var logInfoMessage = 'Player ID ' + elementId + ': ' + eventType;

  switch (eventType) {
    case PLAYER_ERROR:
      stateData.errorMessage = options.error.message;
      stateData.errorMethod = options.error.method;
      stateData.errorName = options.error.name;
      break;
    case VIDEO_MILESTONE:
      if (player.launchExt && player.launchExt.playStopTime) {
        /**
         * replace videoCurrentTime with the one from the heartbeat
         * because the playhead could have changed since the milestone event was triggered
         */
        stateData.videoCurrentTime = player.launchExt.playStopTime;
      }
      stateData.videoMilestone = options.milestone.label;
      break;
  }

  stateData.videoCurrentTime = Math.floor(stateData.videoCurrentTime);
  stateData.videoDuration = Math.floor(stateData.videoDuration);

  // set playSegmentTime and playTotalTime with events where the video has stopped playing
  if (PLAYER_STOPPED_EVENT_TYPES.indexOf(eventType) > -1) {
    player.launchExt.playSegmentTime =
      player.launchExt.playStopTime - player.launchExt.playStartTime;

    /**
     * if the video was already paused before the player got removed,
     * then there is no playSegmentTime,
     * otherwise playTotalTime would be double-adding the played time wrongly
     */
    var videoHasEnded = player.launchExt.hasEnded;
    var videoHasPaused = player.launchExt.hasPaused;
    if (eventType === PLAYER_REMOVED && (videoHasPaused || videoHasEnded)) {
      player.launchExt.playSegmentTime = 0;
    }

    player.launchExt.playTotalTime += player.launchExt.playSegmentTime;
    player.launchExt.playPreviousTotalTime = player.launchExt.playTotalTime;

    stateData.videoPlayedTotalTime = Math.floor(player.launchExt.playTotalTime);
    stateData.videoPlayedSegmentTime = Math.round(player.launchExt.playSegmentTime);
  }

  logger.info(logInfoMessage);

  // handle each Rule trigger for this Event Type
  var getVideoEvent = createGetVideoEvent.bind(element);
  eventTriggers.forEach(function(trigger) {
    trigger(
      getVideoEvent(nativeEvent, stateData, VIDEO_PLATFORM)
    );
  });

  if (options.additionalTriggers) {
    var additionalTriggers = options.additionalTriggers;
    additionalTriggers.forEach(function(additionalEventTriggers) {
      var addedStateData = additionalEventTriggers.stateData;
      var addedTriggers = additionalEventTriggers.triggers;

      var updatedStateData = Object.assign({}, stateData, addedStateData);
      addedTriggers.forEach(function(trigger) {
        trigger(
          getVideoEvent(nativeEvent, updatedStateData, VIDEO_PLATFORM)
        );
      });
    });
  }
};

/**
 * Handle a Vimeo playback event.
 *
 * @param {Object} playbackEventType Event Type based on the Vimeo player's playback event.
 * @param {Object} player The Vimeo player object.
 * @param {Object} nativeEvent The native Vimeo event object.
 */
var processPlaybackEvent = function(playbackEventType, player, nativeEvent) {
  // get the Event Type for this playback event
  if (!playbackEventType) {
    return;
  }

  // don't continue if this player hasn't been setup by this extension
  var element = player.element;
  var elementIsSetup = element.dataset.launchextSetup === PLAYER_SETUP_READY_STATUS;
  if (!elementIsSetup) {
    return;
  }

  var eventType = playbackEventType;
  var previousEventType = player.launchExt.previousEventType;
  var triggers = player.launchExt.triggers;
  var options = {};

  var dataDuration = 0;
  var dataPercent = 0;
  var dataPlaybackRate = 1;
  var dataSeconds = 0;
  var dataVolume = 1;

  if (nativeEvent.data) {
    var data = nativeEvent.data;
    if (data.duration) {
      dataDuration = data.duration;
      if (Number.isNaN(dataDuration) || !Number.isFinite(dataDuration)) {
        // with live events, duration can be invalid
        dataDuration = 0;
      }
    }
    if (data.percent) {
      dataPercent = data.percent;
      if (Number.isNaN(dataPercent) || !Number.isFinite(dataPercent)) {
        // with live events, percent can be invalid
        dataPercent = 0;
      }
    }
    if (data.playbackRate) {
      dataPlaybackRate = data.playbackRate;
    }
    if (data.seconds) {
      dataSeconds = data.seconds;
    }
    if (data.volume) {
      dataVolume = data.volume;
    }
  }

  // these 2 variables are used in VIDEO_TIME_UPDATED
  var isTimeUpdateVeryDifferent;
  var currentTimeUpdateTime;

  /**
   * When the user skips in the video while it is playing, the normal event sequence is:
   * "paused" -> "playing" ("resumed") -> "progress" -> "seeked" -> "progress"
   *
   * But sometimes, the sequence could be:
   * "playing" ("resumed") -> "progress" -> "seeked" -> "progress"
   * i.e. there is no "paused" at the start.
   *
   * A conscious decision has been made to ignore such exceptions.
   */

  switch (playbackEventType) {
    case PLAYBACK_RATE_CHANGED:
      player.launchExt.videoPlaybackRate = dataPlaybackRate;
      break;
    case PLAYER_ERROR:
      options.error = nativeEvent.data;
      break;
    case VIDEO_ENDED:
      player.launchExt.playStopTime = dataSeconds;
      player.launchExt.videoCurrentTime = dataSeconds;
      player.launchExt.videoDuration = dataDuration;
      break;
    case VIDEO_PAUSED:
      player.launchExt.playStopTime = dataSeconds;
      player.launchExt.videoCurrentTime = dataSeconds;
      player.launchExt.videoDuration = dataDuration;

      /**
       * "pause" could have occurred with a "seek".
       * In that case, dataSeconds would be the new playhead position.
       * But player.launchExt.videoCurrentTime should be when the video had been paused,
       * so get that from player.launchExt.previousUpdateTime (which is set with "timeupdate").
       */
      isTimeUpdateVeryDifferent =
        videoTimeDifference(dataSeconds, player.launchExt.previousUpdateTime) > 1;
      if (isTimeUpdateVeryDifferent) {
        player.launchExt.playStopTime = player.launchExt.previousUpdateTime;
        player.launchExt.videoCurrentTime = player.launchExt.previousUpdateTime;
      }

      /**
       * The user could have "seeked" while the video was playing.
       * In that case, player.launchExt.playStartTime would still be the time when the video first
       * started playing.
       * So change that to player.launchExt.seekTime, i.e. the time when seeking occurred.
       */
      if (player.launchExt.seekTime) {
        player.launchExt.playStartTime = player.launchExt.seekTime;
        player.launchExt.seekTime = null;
      }

      break;
    case VIDEO_PLAYING:
      player.launchExt.playStartTime = dataSeconds;
      player.launchExt.videoCurrentTime = dataSeconds;
      player.launchExt.videoDuration = dataDuration;
      // clear seekTime, which would still be set if the user had seeked while paused
      if (player.launchExt.seekTime) {
        player.launchExt.seekTime = null;
      }

      /**
       * update eventType for VIDEO_PLAYING
       * because it could be set with another extension-specific event actually
       *
       * IMPORTANT! this must be run BEFORE the eventType has been processed
       */
      var triggerOnVideoStart = !!Object.getOwnPropertyDescriptor(triggers, VIDEO_STARTED);
      var triggerOnVideoReplay = !!Object.getOwnPropertyDescriptor(triggers, VIDEO_REPLAYED);
      var triggerOnVideoResume = !!Object.getOwnPropertyDescriptor(triggers, VIDEO_RESUMED);

      var videoHasNotStarted = !player.launchExt.hasStarted;
      var videoHasEnded = player.launchExt.hasEnded;
      var videoHasPaused = player.launchExt.hasPaused;

      if (videoHasNotStarted) {
        if (triggerOnVideoStart) {
          eventType = VIDEO_STARTED;
        }
        if (player.launchExt.isLiveEvent) {
          player.launchExt.videoStartTime = Math.floor(player.launchExt.videoCurrentTime);
        }
      } else if (triggerOnVideoReplay && videoHasEnded) {
        eventType = VIDEO_REPLAYED;
      } else if (triggerOnVideoResume && videoHasPaused) {
        eventType = VIDEO_RESUMED;
      }

      break;
    case VIDEO_PROGRESS:
      player.launchExt.videoLoadedFraction = dataPercent;
      player.launchExt.videoDuration = dataDuration;
      break;
    case VIDEO_SEEKED:
      player.launchExt.seekTime = dataSeconds;
      player.launchExt.videoDuration = dataDuration;
      break;
    case VIDEO_TIME_UPDATED:
      player.launchExt.previousUpdateTime = player.launchExt.videoUpdateTime;

      /**
       * "timeupdate" triggers about once every 250ms -- or even less!
       * But a conscious decision is made to only act on the event about once every 500ms.
       * This is so that other events that depend on the current time (e.g. milestones)
       * are more likely to get the "correct" time.
       *
       * So don't continue if "timeupdate" triggered within too short a time.
       */
      if (videoTimeDifference(dataSeconds, player.launchExt.previousUpdateTime) < 0.3) {
        break;
      }

      player.launchExt.playStopTime = dataSeconds;
      player.launchExt.videoCurrentTime = dataSeconds;
      player.launchExt.videoDuration = dataDuration;
      player.launchExt.videoUpdateTime = dataSeconds;

      isTimeUpdateVeryDifferent =
        videoTimeDifference(dataSeconds, player.launchExt.previousUpdateTime) > 1;
      if (isTimeUpdateVeryDifferent) {
        player.launchExt.playStopTime = player.launchExt.previousUpdateTime;
      }

      /**
       * need to get static value of the current time
       * because it could be updated before findMilestone() has run or completed
       */
      currentTimeUpdateTime = parseFloat(JSON.parse(JSON.stringify(player.launchExt.playStopTime)));
      findMilestone(player, currentTimeUpdateTime);

      break;
    case VIDEO_VOLUME_CHANGED:
      player.launchExt.videoVolume = dataVolume;
      break;
  }

  /**
   * for video playing Event Types:
   * check that the previous Event Type is not the same as this Event Type
   */
  if (VIDEO_EVENT_TYPES.indexOf(eventType) > -1) {
    if (previousEventType && previousEventType === eventType) {
      // don't continue if this Event Type is the same as the previous one
      return;
    }
  }

  var eventTriggers = triggers[eventType];
  if (VIDEO_PLAYING_EVENT_TYPES.indexOf(eventType) > -1) {
    /**
     * A VIDEO_PLAYING event still needs to get triggered because that event could have been setup
     * in another Rule.
     * Check for such triggers at triggers._additionalTriggers and add them to options.
     */
    var additionalTriggers = triggers._additionalTriggers[eventType];
    if (additionalTriggers && additionalTriggers.length > 0) {
      options.additionalTriggers = additionalTriggers;
    }
  }
  processEventType(eventType, player, nativeEvent, eventTriggers, options);

  /**
   * for video playing Event Types:
   * update the previous Event Type with this Event Type
   * to use with the next time a video playing event gets triggered
   */
  if (VIDEO_EVENT_TYPES.indexOf(eventType) > -1) {
    player.launchExt.previousEventType = eventType;
  }

  /**
   * update video playing states
   * IMPORTANT! this must be run AFTER the eventType has been processed
   */
  switch (eventType) {
    case VIDEO_ENDED:
      player.launchExt.hasEnded = true;
      break;
    case VIDEO_PAUSED:
      player.launchExt.hasPaused = true;
      break;
    case VIDEO_PLAYING:
    case VIDEO_REPLAYED:
    case VIDEO_RESUMED:
    case VIDEO_STARTED:
      if (!player.launchExt.hasStarted) {
        /**
         * the video has not started yet
         * (player.launchExt.hasStarted is set to "true" a few lines down)
         */
        if (
          player.launchExt.triggers
          && Object.getOwnPropertyDescriptor(player.launchExt.triggers, VIDEO_MILESTONE)
        ) {
          var milestones = compileMilestones(
            player.launchExt.triggers[VIDEO_MILESTONE],
            player.launchExt.videoDuration,
            player.launchExt.videoStartTime,
            player.launchExt.isLiveEvent
          );

          delete player.launchExt.triggers[VIDEO_MILESTONE];
          if (milestones) {
            player.launchExt.triggers[VIDEO_MILESTONE] = milestones;
          }
        }
      }

      // if the video is playing, then it has started and hasn't ended nor paused
      player.launchExt.hasStarted = true;
      player.launchExt.hasEnded = false;
      player.launchExt.hasPaused = false;

      break;
  }
};

/**
 * Check if a video milestone for the specified Vimeo player has been reached.
 *
 * @param {Object} player The Vimeo player object.
 * @param {Number} currentTime The video's current time when checking for a milestone.
 */
var findMilestone = function(player, currentTime) {
  if (
    !player.launchExt
    || !player.launchExt.triggers
    || !Object.getOwnPropertyDescriptor(player.launchExt.triggers, VIDEO_MILESTONE)
  ) {
    return;
  }

  var fixedMilestoneTriggers = player.launchExt.triggers[VIDEO_MILESTONE].fixed;
  var flooredCurrentTime = flooredVideoTime(currentTime);
  var currentMilestones = fixedMilestoneTriggers[flooredCurrentTime];
  if (!currentMilestones) {
    return;
  }

  /**
   * Create a new "native" event for the milestone.
   */
  var milestoneEvent = {
    target: player,
  };

  var currentMilestonesLabels = Object.keys(currentMilestones);
  currentMilestonesLabels.forEach(function(label) {
    var triggers = currentMilestones[label];
    var options = {
      milestone: {
        label: label,
      },
    };

    processEventType(VIDEO_MILESTONE, player, milestoneEvent, triggers, options);
  });
};

/**
 * Callback function when the player has finished loading and is ready to begin receiving API calls.
 *
 * @param {Object} event The Vimeo event object.
 * @param {Object} event.target The Vimeo player object.
 */
var playerReady = function(event) {
  // set a data attribute to indicate that this player has been setup
  var player = event.target;
  var element = player.element;
  if (!element.dataset.launchextSetup) {
    // this player wasn't setup by this extension
    return;
  }

  // update static metadata
  Promise.allSettled([
    player.getAutopause(),
    player.getColor(),
    player.getDuration(),
    player.getLoop(),
    player.getVideoHeight(),
    player.getVideoId(),
    player.getVideoTitle(),
    player.getVideoWidth(),
    player.getVideoUrl(),
  ]).then(function(responses) {
    player.launchExt = player.launchExt || {};

    if (responses[0].status === 'fulfilled') {
      player.launchExt.isAutopaused = responses[0].value;
      /**
       * If an error is returned, then it means that the user's browser does not support the
       * autopaused state. So player.launchExt.isAutopaused should be false.
       * But player.launchExt.isAutopaused has already been initialised to false, so no further
       * update is needed.
       */
    }
    if (responses[1].status === 'fulfilled') {
      player.launchExt.playerColour = responses[1].value;
    }
    if (responses[2].status === 'fulfilled') {
      player.launchExt.videoDuration = responses[2].value;
    }
    if (responses[3].status === 'fulfilled') {
      player.launchExt.isVideoLooped = responses[3].value;
    }
    if (responses[4].status === 'fulfilled') {
      player.launchExt.videoHeight = responses[4].value;
    }
    if (responses[5].status === 'fulfilled') {
      player.launchExt.videoId = responses[5].value;
    }
    if (responses[6].status === 'fulfilled') {
      player.launchExt.videoTitle = responses[6].value;
    }
    if (responses[7].status === 'fulfilled') {
      player.launchExt.videoWidth = responses[7].value;
    }

    if (responses[8].status === 'fulfilled') {
      player.launchExt.videoUrl = responses[8].value;
    } else {
      // error occurred, e.g. due to PrivacyError
      logger.debug('Video privacy setting prevents URL from being read, using fallback method');
      player.launchExt.videoUrl = 'https://vimeo.com/' + player.launchExt.videoId;
    }

    var isLiveEvent = player.launchExt.videoDuration === 0;
    player.launchExt.isLiveEvent = isLiveEvent;

    element.dataset.launchextSetup = PLAYER_SETUP_READY_STATUS;

    processPlaybackEvent(PLAYER_READY, player, event);
  });
};

/**
 * Callback function when the player has been removed from the DOM tree.
 *
 * ALERT! There is no such event in the Vimeo Player SDK.
 * Instead, a "remove" event listener is added to each Vimeo IFrame DOM element.
 *
 * This is also why there is an additional "player" parameter. Since the "remove" event is not a
 * native Vimeo event, there is no Vimeo player object found at event.target. So a player needs
 * to be passed in for subsequent functions to utilise.
 *
 * @see registerPlayers()
 *
 * @param {Object} event The native browser event object.
 * @param {Object} player The YouTube player object.
 */
var playerRemoved = function(event, player) {
  processPlaybackEvent(PLAYER_REMOVED, player, event);
};

/**
 * Check if the Vimeo IFrame Player API has been loaded.
 */
var vimeoPlayerSdkIsLoaded = function() {
  return !!window.Vimeo;
};

/**
 * Check if the Vimeo IFrame Player API has been loaded and is ready.
 */
var vimeoPlayerSdkIsReady = function() {
  return vimeoPlayerSdkIsLoaded()
    && !!window.Vimeo.Player
    && Object.prototype.toString.call(window.Vimeo.Player) === '[object Function]';
};

/**
 * Load the Vimeo IFrame Player API script asynchronously.
 * Returns with an error log if the API script could not be loaded.
 */
var loadVimeoPlayerSdk = function() {
  if (vimeoPlayerSdkIsLoaded()) {
    /**
     * The Vimeo Player SDK script had already been loaded elsewhere, e.g. in HTML
     * so setup the Vimeo players immediately
     */
    setupPendingPlayers();
    return;
  }

  // Load the Vimeo Player SDK script, then setup the Vimeo players
  loadScript(VIMEO_PLAYER_SDK_URL).then(function() {
    logger.info('Vimeo Player SDK was loaded successfully');
    setupPendingPlayers();
  }, function() {
    logger.error('Vimeo Player SDK could not be loaded');
  });
};

/**
 * Create the registry of Vimeo player elements that need processing.
 * When the Vimeo Player SDK is ready, the players that are in here will be processed to allow
 * for video playback tracking.
 */
var pendingPlayersRegistry = [];
/**
 * Save a Vimeo player element for processing later.
 *
 * @param {DOMElement} playerElement A Vimeo IFrame DOM element.
 */
var registerPendingPlayer = function(playerElement) {
  if (vimeoPlayerSdkIsReady()) {
    try {
      setupPlayer(playerElement);
    } catch (e) {
      pendingPlayersRegistry.push(playerElement);
    }
    return;
  }

  pendingPlayersRegistry.push(playerElement);
};
/**
 * Determine if any Vimeo player elements have been registered for setup.
 *
 * @return {boolean} true if there are elements in pendingPlayersRegistry, false otherwise.
 */
var pendingPlayersRegistryHasPlayers = function() {
  return pendingPlayersRegistry.length > 0;
};

/**
 * Setup a Vimeo IFrame player to work with the Vimeo Player SDK.
 * Assumes that the Vimeo Player SDK has been loaded successfully already.
 *
 * @param {DOMElement} element A Vimeo IFrame DOM element.
 */
var setupPlayer = function(element) {
  if (element.dataset.launchextSetup !== PLAYER_SETUP_MODIFIED_STATUS) {
    return;
  }
  element.dataset.launchextSetup = PLAYER_SETUP_UPDATING_STATUS;

  // merge the triggers from all matching selectors into one
  var triggers = {
    _additionalTriggers: {},
  };
  /**
   * triggers = {
   *   <string eventType> : [ trigger, trigger ],
   *   VIDEO_MILESTONE : [
   *     {
   *       milestone: {
   *         amount: <number>,
   *         unit: <string "percent", "seconds">,
   *       },
   *       trigger: trigger,
   *     },
   *   ],
   *   _additionalTriggers: {
   *     <string eventType> : [
   *       {
   *         stateData: <object>,
   *         triggers: [ trigger, trigger ],
   *       },
   *     ],
   *   },
   * }
   */

  var eventRegistryMatchingSelectors = Object.keys(eventRegistry);
  eventRegistryMatchingSelectors.forEach(function(matchingSelector) {
    if (matchingSelector !== 'no selector' && !element.matches(matchingSelector)) {
      return;
    }

    var eventTypes = Object.keys(eventRegistry[matchingSelector]);
    eventTypes.forEach(function(eventType) {
      var eventTriggers = eventRegistry[matchingSelector][eventType];

      if (eventType !== VIDEO_MILESTONE) {
        /**
         * VIDEO_MILESTONE triggers will be processed later in playerReady()
         * for all other eventTypes, concatenate only their triggers into one big array
         */
        eventTriggers = eventTriggers.map(function(eventTrigger) {
          return eventTrigger.trigger;
        });
      }

      triggers[eventType] = triggers[eventType] || [];
      triggers[eventType] = triggers[eventType].concat(eventTriggers);
    });
  });

  /**
   * Special case for VIDEO_STARTED, VIDEO_RESUMED and VIDEO_REPLAYED events:
   * A VIDEO_PLAYING event still needs to get triggered because that event could have been setup
   * in another Rule.
   * Copy any triggers that are used with a VIDEO_PLAYING event *but not with any of the
   * special events* to triggers._additionalTriggers.
   */
  var allVideoPlayingTriggers = triggers[VIDEO_PLAYING] || [];
  var videoPlayingTriggers = allVideoPlayingTriggers.filter(function(trigger) {
    var isVideoCreatedReplayedResumedTrigger = VIDEO_PLAYING_EVENT_TYPES.some(function(eventType) {
      var eventTypeTriggers = triggers[eventType];
      return eventTypeTriggers && eventTypeTriggers.indexOf(trigger) > -1;
    });
    return !isVideoCreatedReplayedResumedTrigger;
  });

  if (videoPlayingTriggers.length > 0) {
    VIDEO_PLAYING_EVENT_TYPES.forEach(function(eventType) {
      /**
       * there may not be any triggers for a special event, so make sure to test for the
       * existence of that special event's triggers first.
       */
      if (!triggers[eventType]) {
        return;
      }

      triggers._additionalTriggers[eventType] = triggers._additionalTriggers[eventType] || [];
      triggers._additionalTriggers[eventType].push({
        stateData: { playerState: VIDEO_PLAYING },
        triggers: videoPlayingTriggers,
      });
    });
  }

  var elementId = element.id;

  var player = new window.Vimeo.Player(element);

  // add additional properties for this player
  player.launchExt = {
    hasEnded: false,
    hasPaused: false,
    hasStarted: false,
    isLiveEvent: false,
    isAutopaused: false,
    isVideoLooped: false,
    playedMilestones: {},
    playerColour: null,
    playPreviousTotalTime: 0,
    playSegmentTime: 0,
    playStartTime: 0,
    playStopTime: 0,
    playTotalTime: 0,
    previousEventType: null,
    previousUpdateTime: 0,
    seekTime: null,
    triggers: triggers,
    videoCurrentTime: 0,
    videoDuration: null,
    videoHeight: null,
    videoId: null,
    videoLoadedFraction: 0,
    videoPlaybackRate: 1,
    videoStartTime: 0,
    videoTitle: null,
    videoUpdateTime: 0,
    videoUrl: null,
    videoVolume: 1,
    videoWidth: null,
  };

  player.ready().then(function() {
    playerReady({
      target: player,
    });
  });

  player.on('bufferend', function() {
    processPlaybackEvent(VIDEO_BUFFER_ENDED, player, {
      target: player,
    });
  });

  player.on('bufferstart', function() {
    processPlaybackEvent(VIDEO_BUFFER_STARTED, player, {
      target: player,
    });
  });

  player.on('ended', function(data) {
    processPlaybackEvent(VIDEO_ENDED, player, {
      data: data,
      target: player,
    });
  });

  player.on('error', function(data) {
    processPlaybackEvent(PLAYER_ERROR, player, {
      data: data,
      target: player,
    });
  });

  player.on('loaded', function(data) {
    processPlaybackEvent(VIDEO_LOADED, player, {
      data: data,
      target: player,
    });
  });

  player.on('pause', function(data) {
    processPlaybackEvent(VIDEO_PAUSED, player, {
      data: data,
      target: player,
    });
  });

  player.on('play', function(data) {
    processPlaybackEvent(VIDEO_PLAYING, player, {
      data: data,
      target: player,
    });
  });

  player.on('playbackratechange', function(data) {
    processPlaybackEvent(PLAYBACK_RATE_CHANGED, player, {
      data: data,
      target: player,
    });
  });

  player.on('progress', function(data) {
    processPlaybackEvent(VIDEO_PROGRESS, player, {
      data: data,
      target: player,
    });
  });

  player.on('seeked', function(data) {
    processPlaybackEvent(VIDEO_SEEKED, player, {
      data: data,
      target: player,
    });
  });

  player.on('timeupdate', function(data) {
    processPlaybackEvent(VIDEO_TIME_UPDATED, player, {
      data: data,
      target: player,
    });
  });

  player.on('volumechange', function(data) {
    processPlaybackEvent(VIDEO_VOLUME_CHANGED, player, {
      data: data,
      target: player,
    });
  });

  /**
   * Also, trigger when this element has been unloaded from the DOM.
   * 1. Listen for the "remove" event.
   * 2. Observe changes to this element via its parentNode.
   */
  element.addEventListener('remove', function(event) {
    var player = playerRegistry[this.id];
    playerRemoved(event, player);
  });
  observer.observe(element.parentNode, { childList: true });

  playerRegistry[elementId] = player;

  element.dataset.launchextSetup = PLAYER_SETUP_COMPLETED_STATUS;

  logger.info('Enabled video playback tracking for player ID ' + elementId);
};

/**
 * Setup Vimeo player elements to work with the Vimeo Player SDK.
 * Returns with an error log if Vimeo's YT object is unavailable.
 *
 * @param {integer} attempt The number of times that this function has been called. Default: 1.
 */
var setupPendingPlayers = function(attempt) {
  if (!pendingPlayersRegistryHasPlayers()) {
    return;
  }
  if (!attempt) {
    // Yes, I know I'm overriding an argument. Wait for ES6...
    attempt = 1;
  }

  if (!vimeoPlayerSdkIsReady()) {
    // try again
    if (attempt > MAXIMUM_ATTEMPTS_TO_WAIT_FOR_VIDEO_PLATFORM_API) {
      logger.error('Unexpected error! Vimeo Player SDK has not been initialised');
      return;
    }

    var timeout = Math.pow(2, attempt - 1) * 1000;
    setTimeout(function() {
      setupPendingPlayers(attempt + 1);
    }, timeout);
    return;
  }

  while (pendingPlayersRegistry.length > 0) {
    var playerElement = pendingPlayersRegistry.shift();
    setupPlayer(playerElement);
  }
};

/**
 * Register Vimeo IFrame players to work with the Vimeo Player SDK later, then load the API
 * script itself.
 * Returns with a debug log if no players are found with the specified selector.
 *
 * @param {Object} settings The (configuration or action) settings object.
 */
var registerPlayers = function(settings) {
  var elementSpecificitySetting = settings.elementSpecificity || 'any';
  var elementsSelectorSetting = settings.elementsSelector || '';
  var iframeSelector = elementSpecificitySetting === 'specific' && elementsSelectorSetting
    ? elementsSelectorSetting
    : IFRAME_SELECTOR;

  var elements = document.querySelectorAll(iframeSelector);
  var numElements = elements.length;
  if (numElements === 0) {
    /**
     * don't continue if there are no Vimeo players
     * since there's no point tracking what is not available
     */
    logger.debug('No Vimeo players found for the selector "' + iframeSelector + '"');
    return;
  }

  // compile the list of required parameters to add to the IFrame's src URL
  var parametersToAdd = {};

  elements.forEach(function(element, i) {
    var playerElement;
    try  {
      playerElement = registerPlayerElement(
        element,
        i,
        IFRAME_ID_PREFIX,
        IFRAME_URL_PATTERN,
        parametersToAdd
      );

      if (playerElement) {
        logger.debug('Found Vimeo player with ID ' + playerElement.id);
      }
    } catch (e) {
      logger.error(e, element);
      return;
    }

    if (!playerElement) {
      return;
    }

    registerPendingPlayer(playerElement);
  });

  if (pendingPlayersRegistryHasPlayers()) {
    var loadVimeoPlayerSdkSetting = settings.loadVimeoPlayerSdk || 'yes';
    switch (loadVimeoPlayerSdkSetting) {
      case 'yes':
        loadVimeoPlayerSdk();
        // the players will be processed when the Vimeo object is ready
        break;
      default:
        logger.debug(
          'Need Vimeo Player SDK to become ready before setting up players'
        );
        setupPendingPlayers();
        break;
    }
  }
};

/**
 * Detect when Vimeo players have been unloaded
 * - Observe changes to the DOM tree for removed players
 */
var observer = new MutationObserver(function(mutationsList) {
  mutationsList.forEach(function(mutation) {
    /**
     * check for removedNodes only
     * ignore other mutations
     */
    mutation.removedNodes.forEach(function(removedNode) {
      var removedIframeNode = removedNode.nodeName.toLowerCase() === 'iframe';
      var removedPlayer = removedNode.id && removedNode.id in playerRegistry;
      if (removedIframeNode && removedPlayer) {
        var removeEvent = new Event('remove');

        /**
         * the next line calls the event listener that was added to the element (removedNode) in
         * registerPlayers().
         */
        removedNode.dispatchEvent(removeEvent);

        delete playerRegistry[removedNode.id];
        observer.disconnect();
      }
    });
  });
});

/**
 * Detect when Vimeo players have been unloaded:
 * - Listen for window unloaded event
 */
window.addEventListener('beforeunload', function(event) {
  var playerIds = Object.keys(playerRegistry);
  playerIds.forEach(function(playerId) {
    var player = playerRegistry[playerId];
    playerRemoved(event, player);
  });
});

module.exports = {
  /**
   * Event Types (exposed from constants)
   */
  playbackRateChanged: PLAYBACK_RATE_CHANGED,
  playerError: PLAYER_ERROR,
  playerReady: PLAYER_READY,
  playerRemoved: PLAYER_REMOVED,
  videoBufferEnded: VIDEO_BUFFER_ENDED,
  videoBufferStarted: VIDEO_BUFFER_STARTED,
  videoCued: VIDEO_CUED,
  videoEnded: VIDEO_ENDED,
  videoLoaded: VIDEO_LOADED,
  videoMilestone: VIDEO_MILESTONE,
  videoPaused: VIDEO_PAUSED,
  videoPlaying: VIDEO_PLAYING,
  videoProgress: VIDEO_PROGRESS,
  videoSeeked: VIDEO_SEEKED,
  videoTimeUpdated: VIDEO_TIME_UPDATED,
  videoVolumeChanged: VIDEO_VOLUME_CHANGED,

  /**
   * Load the Vimeo Player SDK script based on the user's settings.
   *
   * @param {Object} settings The (configuration or action) settings object.
   */
  loadVimeoPlayerSdkScript: function(settings) {
    loadVimeoPlayerSdk(settings); // `settings` argument is actually not needed
  },

  /**
   * Enable Vimeo video playback tracking based on the user's settings.
   *
   * @param {Object} settings The (configuration or action) settings object.
   */
  enableVideoPlaybackTracking: function(settings) {
    registerPlayers(settings);
  },

  /**
   * Register the Event Types for triggering from Rules.
   *
   * @param {String} eventType The Event Type that triggered the Rule.
   * @param {Object} settings The event settings object.
   * @param {ruleTrigger} trigger The trigger callback.
   */
  registerEventTrigger: function(eventType, settings, trigger) {
    if (ALL_EVENT_TYPES.indexOf(eventType) === -1) {
      return;
    }

    var matchingSelector = 'no selector';
    if (settings.matchingSelector) {
      matchingSelector = settings.matchingSelector;
    }

    eventRegistry[matchingSelector] = eventRegistry[matchingSelector] || {};

    // usually, there will only be one eventType when this function is called
    // but with VIDEO_PLAYING, there can be more than one eventTypes
    // so use an array to store the eventType(s)
    var eventTypes = [];
    if (eventType === VIDEO_PLAYING) {
      var trackStarted = settings.trackStarted === 'yes';
      var trackReplayed = settings.trackReplayed === 'yes';
      var trackResumed = settings.trackResumed === 'yes';
      var doTrackPlaying = settings.doNotTrack !== 'yes';
      // change eventType to match the user-selected play event type
      if (trackStarted) {
        eventTypes.push(VIDEO_STARTED);
      }
      if (trackReplayed) {
        eventTypes.push(VIDEO_REPLAYED);
      }
      if (trackResumed) {
        eventTypes.push(VIDEO_RESUMED);
      }
      if ((!trackStarted && !trackReplayed && !trackResumed) || doTrackPlaying) {
        eventTypes.push(VIDEO_PLAYING);
      }
    } else {
      eventTypes = [eventType];
    }

    eventTypes.forEach(function(eventType) {
      eventRegistry[matchingSelector][eventType] = (
        eventRegistry[matchingSelector][eventType] || []
      );
    });

    var eventTrigger = {
      trigger: trigger,
    };
    if (eventType === VIDEO_MILESTONE) {
      if (settings.fixedMilestoneAmounts && settings.fixedMilestoneUnit) {
        var milestoneUnit = settings.fixedMilestoneUnit;
        var milestoneAmounts = settings.fixedMilestoneAmounts;

        var isValidMilestoneUnit = VIDEO_MILESTONE_UNITS.indexOf(milestoneUnit) > -1;
        var isArrayMilestoneAmounts = Array.isArray(milestoneAmounts);

        if (isValidMilestoneUnit && isArrayMilestoneAmounts) {
          var milestoneTriggers = milestoneAmounts.map(function(milestoneAmount) {
            var amount = parseInt(milestoneAmount, 10);
            if (Number.isNaN(amount)) {
              return;
            }

            var milestone = {
              amount: amount,
              type: 'fixed',
              unit: milestoneUnit,
            };
            return Object.assign({ milestone: milestone }, eventTrigger);
          }).filter(function(milestoneTrigger) {
            return !!milestoneTrigger;
          });

          if (milestoneTriggers.length > 0) {
            eventRegistry[matchingSelector][eventType] = (
              eventRegistry[matchingSelector][eventType].concat(milestoneTriggers)
            );
          }
        }
      }
    } else {
      eventTypes.forEach(function(eventType) {
        eventRegistry[matchingSelector][eventType].push(eventTrigger);
      });
    }
  },
};
