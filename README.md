# VRChat Motion Controller
A Webcam Motion controller for VRChat.  
**THIS PROJECT IS EXPERIMENTAL AND STILL WORK IN PROGRESS, USE WITH OUR OWN RISK.**  

https://user-images.githubusercontent.com/15815422/156927345-90c3ec94-2cf4-44c6-b323-875403a4db4c.mp4

## Future Features
- [x] Face expression recognition.
- [ ] Motion controls
  - [ ] Hand gestures to interact with items.
    - [x] Forward / Backward
    - [x] Spin
    - [ ] Rotate
  - [x] Jump.
  - [x] Look left / right.
  - [x] Move.

## Install
- Install [Node.js](https://nodejs.org/en/)
- Install [Yarn](https://yarnpkg.com/)
- Run `yarn` to install dependencies.
- Run `yarn dev` to start development.
- Run `yarn build` to build.

## How To Use
- Start VRChat.
- Configure the app.
  - Click settings button.
  - Choose your webcam device in webcam tab.
  - Set your avatar face expression parameter and values in face tab.
- Click start button to start capture your motion and face.
- Available motions
  - Move your body forward / back / right / left to move.
  - Turn your face right / left to turn.
  - Flap your arms to jump.
  - Pinch your left finger and move forward / backward to move held object forward / backward.
  - Pinch your right finger and move up / down to spin held object up / down.
  - Pinch your right finger and move left / right to spin held object left / right.
