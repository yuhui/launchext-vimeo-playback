# Changelog

## 2.6.3 - 2024-02-09

### Fixed

- Resolved error that occurred with "Video Milestone" event.

## 2.6.2 - 2023-08-16

### Fixed

- Resolved another error that occurred with "Video Playing" event.

## 2.6.1 - 2023-08-02

### Fixed

- Resolved error that occurred with "Video Playing" event.

## 2.6.0 - 2023-06-28

### Changed

- Refactor code for getting data for data elements to its own module.
- Refactor code for enabling tracking in YouTube players to its own module.
- In "Video Playing" view, clarify what it means to _not_ track the event when other options have been selected.

### Fixed

- Ensure that a "Video Playing" event gets sent even when "Video Started", "Video Resumed" or "Video Replayed" event has been selected.

### Added

- Log an error when calling `_satellite.getVar()` to retrieve a data element, but without supplying the `event` argument.
- Log an error when expected inputs are invalid.

## 2.5.0 - 2023-01-05

### Changed

- Added a flag when enabling a video player with the Vimeo Player SDK.

### Added

- Bundled Adobe Coral for faster loading of styles.

## 2.4.1 - 2022-11-07

### FIXED

- Use fallback method to get the video URL when the video's privacy setting prevents the URL from being read.

### 2.4.0 - 2022-10-07

### Added

- Prepare Vimeo IFrame elements to work with the Vimeo Player SDK.
- Detect player and playback events, including Player Ready, Player Removed, Video Playing, Video Paused, Video Ended, Video Milestone, etc.
- Allow Vimeo Player SDK script to be loaded with a Rule action. With this ability, loading the script when preparing the Vimeo IFrame elements is optional.
- Set a selector in the action configuration to limit which Vimeo players to track.
