import { NormalizedLandmarkList} from '@mediapipe/holistic'
import { ipcRenderer } from '../electron'
import { Pose2DLandmark } from './landmarks'

let jump: boolean = false

export default (landmarks: NormalizedLandmarkList) => {
  if (!landmarks || landmarks.length === 0) return
  // 13 < 11, 14 < 12 = hands up
  // 13 > 11, 14 > 12 = hands down
  // https://google.github.io/mediapipe/images/mobile/pose_tracking_full_body_landmarks.png
  if (
    landmarks[Pose2DLandmark.RIGHT_ELBOW].y < landmarks[Pose2DLandmark.RIGHT_SHOULDER].y &&
    landmarks[Pose2DLandmark.RIGHT_SHOULDER].y - landmarks[Pose2DLandmark.RIGHT_ELBOW].y > 0.025 &&
    landmarks[Pose2DLandmark.LEFT_ELBOW].y < landmarks[Pose2DLandmark.LEFT_SHOULDER].y &&
    landmarks[Pose2DLandmark.LEFT_SHOULDER].y - landmarks[Pose2DLandmark.LEFT_ELBOW].y > 0.025
  ) {
    jump = true
  }
  if (
    jump &&
    landmarks[Pose2DLandmark.RIGHT_ELBOW].y > landmarks[Pose2DLandmark.RIGHT_SHOULDER].y &&
    landmarks[Pose2DLandmark.LEFT_ELBOW].y > landmarks[Pose2DLandmark.LEFT_SHOULDER].y
  ) {
    jump = false
    ipcRenderer.send('jump')
  }
}
