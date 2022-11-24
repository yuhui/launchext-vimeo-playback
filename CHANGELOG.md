2.4.1 (released 7 November 2022)
--------------------------------

- Use fallback method to get the video URL when the video's privacy setting prevents the URL from being read.

2.4.0 (released 7 October 2022)
-------------------------------

- Prepares Vimeo IFrame elements to work with the Vimeo Player SDK.
- Detects player and playback events, including Player Ready, Player Removed, Video Playing, Video Paused, Video Ended, Video Milestone, etc.
- Allows Vimeo Player SDK script to be loaded with a Rule action. With this ability, loading the script when preparing the Vimeo IFrame elements is optional.
- Set a selector in the action configuration to limit which Vimeo players to track.
