import { NormalizedLandmarkList} from '@mediapipe/holistic'
import { ipcRenderer } from '../electron'
import { HandLandmarks } from './landmarks'

// Code taken and edit from:
// https://handsfree.js.org/ref/plugin/pinchers.html
// https://handsfree.js.org/ref/plugin/pinchScroll.html

// Ideas  
// Is pinch = /input/GrabAxisRight
// Not pinch = /input/DropAxisRight
// pinch up / down = /input/SpinHoldUD
// pinch left / right = /input/SpinHoldLR
// pinch forward / backward = /input/MoveHoldFB

// Sides
const sides = ['right', 'left']

// Config
const config = {
  // Number of pixels the middle and thumb tips must be near each other to drag
  threshold: 15,
  // Number of frames where a hold is not registered before releasing a drag
  numThresholdErrorFrames: 5,
  // Speed multiplier
  speed: 1,
  maxDownedFrames: 1
}

// Whether the fingers are touching
const thresholdMet = {
  right: false,
  left: false
}
const framesSinceLastGrab = {
  right: 0,
  left: 0
}
// The original grab point for each finger
const origPinch = {
  right: {x: 0, y: 0, z: 0},
  left: {x: 0, y: 0, z: 0},
}
const curPinch = {
  right: {x: 0, y: 0, z: 0},
  left: {x: 0, y: 0, z: 0}
}
// Just downel
const pinchDowned = {
  right: 0,
  left: 0
}
const pinchUp = {
  right: 0,
  left: 0
}

export default (landmarks: {right: NormalizedLandmarkList, left: NormalizedLandmarkList}) => {
  // Loop through hands
  for (const side of sides) {
    if (!landmarks[side] || landmarks[side].length === 0) continue

    // Check if fingers are touching
    const a = landmarks[side][HandLandmarks.THUMB_TIP].x - landmarks[side][HandLandmarks.INDEX_FINGER_TIP].x
    const b = landmarks[side][HandLandmarks.THUMB_TIP].y - landmarks[side][HandLandmarks.INDEX_FINGER_TIP].y
    const c = Math.sqrt(a*a + b*b) * 480
    const threshold = thresholdMet[side] = c < config.threshold

    if (threshold) {
      // Set the current pinch
      curPinch[side] = landmarks[side][HandLandmarks.THUMB_TIP]
      
      // Store the original pinch
      if (framesSinceLastGrab[side] > config.numThresholdErrorFrames) {
        origPinch[side] = landmarks[side][HandLandmarks.THUMB_TIP]
      }
      framesSinceLastGrab[side] = 0
    }
    ++framesSinceLastGrab[side]
  }

  // Check is pinching
  const pinchState = {
    right: '',
    left: ''
  }

  for (const side of sides) {
    // Click
    if (!!landmarks[side] && thresholdMet[side]) {
      pinchDowned[side]++
    } else {
      pinchUp[side] = pinchDowned[side]
      pinchDowned[side] = 0
    }
    
    // Set the state
    if (pinchDowned[side] > 0 && pinchDowned[side] <= config.maxDownedFrames) {
      pinchState[side] = 'start'
    } else if (pinchDowned[side] > config.maxDownedFrames) {
      pinchState[side] = 'held'
    } else if (pinchUp[side]) {
      pinchState[side] = 'released'
    } else {
      pinchState[side] = ''
    }
  }

  // Set item rotate and move
  const diff = {
    x: curPinch.right.x - origPinch.right.x,
    y: curPinch.left.y - origPinch.left.y,
    z: curPinch.right.z - origPinch.right.z
  }
  if (pinchState.right === 'held') {
    // Left / Right
    if (Math.abs(diff.x) > 0.1) {
      ipcRenderer.send('SpinHoldLR', Math.sign(diff.x))
    } else {
      ipcRenderer.send('SpinHoldLR', 0)
    }
    // Up / Down
    if (Math.abs(diff.z) > 0.03) {
      ipcRenderer.send('SpinHoldUD', Math.sign(diff.z) * -1)
    } else {
      ipcRenderer.send('SpinHoldUD', 0)
    }
  } else if (pinchState.right === 'start') {
    ipcRenderer.send('GrabAxisRight')
  } else if (pinchState.right === 'released') {
    ipcRenderer.send('DropAxisRight')
  }
  if (pinchState.left === 'held') {
    // Forward / Backward
    if (Math.abs(diff.y) > 0.01) {
      ipcRenderer.send('MoveHoldFB', Math.sign(diff.y))
    } else {
      ipcRenderer.send('MoveHoldFB', 0)
    }
  }
}
