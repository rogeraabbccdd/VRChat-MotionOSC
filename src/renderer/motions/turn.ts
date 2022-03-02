import { NormalizedLandmarkList} from '@mediapipe/holistic'
import * as Kalidokit from 'kalidokit'
import { ipcRenderer } from '../electron'

export default (landmarks: NormalizedLandmarkList) => {
  if (!landmarks) return
  const riggedFace: Kalidokit.TFace|undefined = landmarks ? Kalidokit.Face.solve(landmarks, {
    runtime: 'mediapipe',
    video: '#webcam'
  }) : undefined 
  if (!riggedFace) return
  if (riggedFace.head.degrees.y > 30) {
    // Turn right
    ipcRenderer.send('LookHorizontal', 1)
  } else if (riggedFace.head.degrees.y < -30) {
    // Turn left
    ipcRenderer.send('LookHorizontal', -1)
  } else {
    // Reset
    ipcRenderer.send('LookHorizontal', 0)
  }
}
