import { NormalizedLandmarkList} from '@mediapipe/holistic'
import { ipcRenderer } from '../electron'
import { Pose2DLandmark } from './landmarks'

const origNose = {
  x: 0,
  y: 0,
  z: 0,
  set: false
}

export const resetMovePos = () => {
  origNose.set = false
}

let lastDirection = ''

export default (landmarks: NormalizedLandmarkList) => {
  if (!landmarks) return

  if (!origNose.set) {
    origNose.x = landmarks[Pose2DLandmark.NOSE].x
    origNose.y = landmarks[Pose2DLandmark.NOSE].y
    origNose.z = landmarks[Pose2DLandmark.NOSE].z
    origNose.set = true
  }

  // console.log(landmarks[Pose2DLandmark.NOSE])
  // y < origin = front
  // y > origin = back
  // x > origin = left
  // x < origin = right
  const diffY = landmarks[Pose2DLandmark.NOSE].y - origNose.y
  const diffX = landmarks[Pose2DLandmark.NOSE].x - origNose.x
  const diffXAbs = Math.abs(diffX)
  const diffYAbs = Math.abs(diffY)
  let direction = ''
  if (diffXAbs > diffYAbs && Math.abs(diffXAbs - diffYAbs) > 0.15) {
    if (diffX > 0) direction = 'left'
    else direction = 'right'
  } else if (diffYAbs > diffXAbs) {
    if (diffY > 0)  direction = 'back'
    else direction = 'front'
  }

  if (direction !== lastDirection || direction === '') {
    ipcRenderer.send('MoveRight', 0)
    ipcRenderer.send('MoveLeft', 0)
    ipcRenderer.send('MoveForward', 0)
    ipcRenderer.send('MoveBackward', 0)
    ipcRenderer.send('Run', 0)
  }

  switch (direction) {
    case 'left':
      ipcRenderer.send('MoveLeft', 1)
      break
    case 'right':
      ipcRenderer.send('MoveRight', 1)
      break
    case 'front':
      if (diffYAbs > 0.05) ipcRenderer.send('Run', 1)
      else ipcRenderer.send('Run', 0)
      ipcRenderer.send('MoveForward', 1)
      break
    case 'back':
      if (diffYAbs > 0.05) ipcRenderer.send('Run', 1)
      else ipcRenderer.send('Run', 0)
      ipcRenderer.send('MoveBackward', 1)
      break
  }
  
  lastDirection = direction
}
