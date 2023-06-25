module.exports = {
  "extensions": {
    "vimeo-playback": {
      "displayName": "Vimeo Playback",
      "settings": {}
    }
  },
  "dataElements": {
    "Vimeo player state": {
      "settings": {},
      "cleanText": false,
      "forceLowerCase": false,
      "modulePath": "vimeo-playback/src/lib/dataElements/playerState.js",
      "storageDuration": ""
    },
    "Vimeo video current time": {
      "settings": {},
      "cleanText": false,
      "forceLowerCase": false,
      "modulePath": "vimeo-playback/src/lib/dataElements/videoCurrentTime.js",
      "storageDuration": ""
    },
    "Vimeo video duration": {
      "settings": {},
      "cleanText": false,
      "forceLowerCase": false,
      "modulePath": "vimeo-playback/src/lib/dataElements/videoDuration.js",
      "storageDuration": ""
    }
  },
  "rules": [{
    "id": "RL1608090626599",
    "name": "Page Top, Click",
    "events": [{
      "modulePath": "sandbox/pageTop.js",
      "settings": {}
    }, {
      "modulePath": "sandbox/click.js",
      "settings": {}
    }],
    "actions": [{
      "modulePath": "vimeo-playback/src/lib/actions/enableVideoPlaybackTracking.js",
      "settings": {
        "elementSpecificity": "any",
        "elementsSelector": "",
        "loadVimeoPlayerSdk": "yes"
      }
    }]
  }, {
    "id": "RL1608090868708",
    "name": "Player Ready, Player Removed, Video Playing, Video Paused, Video Ended, Video Loaded, Video Seeked, Video Time Updated",
    "events": [{
      "modulePath": "vimeo-playback/src/lib/events/playerReady.js",
      "settings": {}
    }, {
      "modulePath": "vimeo-playback/src/lib/events/playerRemoved.js",
      "settings": {}
    }, {
      "modulePath": "vimeo-playback/src/lib/events/videoPlaying.js",
      "settings": {
        "trackStarted": "yes",
        "trackResumed": "yes",
        "trackReplayed": "yes",
        "doNotTrack": "yes"
      }
    }, {
      "modulePath": "vimeo-playback/src/lib/events/videoPaused.js",
      "settings": {}
    }, {
      "modulePath": "vimeo-playback/src/lib/events/videoEnded.js",
      "settings": {}
    }, {
      "modulePath": "vimeo-playback/src/lib/events/videoSeeked.js",
      "settings": {}
    }, {
      "modulePath": "vimeo-playback/src/lib/events/videoTimeUpdated.js",
      "settings": {}
    }],
    "actions": [{
      "modulePath": "sandbox/logEventInfo.js",
      "settings": {}
    }]
  }, {
    "id": "RL1611236793890",
    "name": "Vimeo Milestone 25%, 50%, 75%, 90%, and 5, 10, 15 seconds",
    "events": [{
      "modulePath": "vimeo-playback/src/lib/events/videoMilestone.js",
      "settings": {
        "fixedMilestoneAmounts": [25, 50, 75, 90],
        "fixedMilestoneUnit": "percent"
      }
    }, {
      "modulePath": "vimeo-playback/src/lib/events/videoMilestone.js",
      "settings": {
        "fixedMilestoneAmounts": [5, 10, 15],
        "fixedMilestoneUnit": "seconds"
      }
    }],
    "actions": [{
      "modulePath": "sandbox/logEventInfo.js",
      "settings": {}
    }]
  }],
  "property": {
    "name": "Sandbox property",
    "settings": {
      "id": "PR12345",
      "domains": ["adobe.com", "example.com"],
      "linkDelay": 100,
      "trackingCookieName": "sat_track",
      "undefinedVarsReturnEmpty": false
    }
  },
  "company": {
    "orgId": "ABCDEFGHIJKLMNOPQRSTUVWX@AdobeOrg"
  },
  "environment": {
    "id": "EN00000000000000000000000000000000",
    "stage": "development"
  },
  "buildInfo": {
    "turbineVersion": "27.5.0",
    "turbineBuildDate": "2023-04-22T09:40:37.361Z",
    "buildDate": "2023-04-22T09:40:37.361Z",
    "environment": "development"
  }
}