2.3.0 (released 7 October 2022)
-------------------------------

- Prepares Vimeo IFrame elements with the required `enablejsapi` and `origin` parameters.
- Detects player and playback events, including Player Ready, Player Removed, Video Playing, Video Paused, Video Ended, Video Milestone, etc.
- Allows Vimeo Player SDK script to be loaded with a Rule action. With this ability, loading the script when preparing the Vimeo IFrame elements is optional.
- Set a selector in the action configuration to limit which Vimeo players to track.
