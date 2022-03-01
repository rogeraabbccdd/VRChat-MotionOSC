<script setup lang="ts">
// ***********************************
// Import Packages
// ***********************************
// Electron
import { ipcRenderer } from './electron'
// Vue
import { reactive, ref, nextTick, watch } from 'vue'
// Face API
import * as faceAPI from 'face-api.js'
// Mediapipe
import {
  Holistic,
  Results as HolisticResults,
  NormalizedLandmarkList,
  POSE_CONNECTIONS,
  HAND_CONNECTIONS,
  FACEMESH_TESSELATION
} from '@mediapipe/holistic'
import { Camera } from '@mediapipe/camera_utils'
import { drawLandmarks, drawConnectors } from '@mediapipe/drawing_utils'
// Motions
import * as motionControls from './motions'

// ***********************************
// HTML Elements
// ***********************************
const elWebcam = ref<HTMLVideoElement | null>(null)
const elCanvasHolistic = ref<HTMLCanvasElement | null>(null)
const elCanvasFaceApi = ref<HTMLCanvasElement | null>(null)

// ***********************************
// Face API
// ***********************************
// Timer
let faceTimer = 0
// Options
const faceOptions = new faceAPI.TinyFaceDetectorOptions({
  inputSize: 512, // 160 224 320 416 512 608
  scoreThreshold: 0.5 // 0.1 ~ 0.9
})
// Initialize face API
const initFaceAPI = async (): Promise<void> => {
  await faceAPI.nets.tinyFaceDetector.loadFromUri('/models')
  await faceAPI.loadFaceLandmarkModel('/models')
  await faceAPI.loadFaceExpressionModel('/models')
}
// Detect faces
const RunFaceExpression = async (): Promise<void> => {
  // Get Result
  const result = await faceAPI.detectSingleFace(
    elWebcam.value as HTMLVideoElement,
    faceOptions
  ).withFaceExpressions()
  if (!result) return
  const expression:string = result.expressions.asSortedArray()[0].expression
  // Send to backend
  ipcRenderer.send('setFace', { parameter: formFace.parameter, value: formFace[expression] })
  // Draw result to canvas
  if (!elCanvasFaceApi.value || !elWebcam.value) return
  const dims = faceAPI.matchDimensions(elCanvasFaceApi.value, elWebcam.value, true)
  const resizedResult = faceAPI.resizeResults(result, dims)
  faceAPI.draw.drawDetections(elCanvasFaceApi.value, resizedResult)
  faceAPI.draw.drawFaceExpressions(elCanvasFaceApi.value, resizedResult, 0.05)
}

// ***********************************
// Mediapipe
// ***********************************
// some keys are missing in HolisticResults
const holistic = new Holistic({
  locateFile (file) {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1635989137/${file}`
  }
})
// Set holistic options
holistic.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
  refineFaceLandmarks: true
})
// Set camera
let camera: Camera|null = null
// Init holistic
const initHolistic = async (): Promise<void> => {
  holistic.onResults(onHolisticResults)
  await holistic.initialize()
}
const onHolisticResults = (results: HolisticResults): void => {
  if (!results) return
  // Get landmarks from result
  const faceLandmarks: NormalizedLandmarkList = results.faceLandmarks
  const pose2DLandmarks: NormalizedLandmarkList = results.poseLandmarks
  const rightHandLandmarks: NormalizedLandmarkList = results.rightHandLandmarks
  const leftHandLandmarks: NormalizedLandmarkList = results.leftHandLandmarks
  // Detect Jump
  motionControls.jump(pose2DLandmarks)
  // Detect item control gestures
  motionControls.item({ right: rightHandLandmarks, left: leftHandLandmarks })
  // Detect face turn
  motionControls.turn(faceLandmarks)
  // Draw canvas
  if (!elWebcam.value || !elCanvasHolistic.value) return
  const canvasCtx = elCanvasHolistic.value.getContext('2d')
  if (!canvasCtx) return
  canvasCtx.save()
  canvasCtx.clearRect(0, 0, elCanvasHolistic.value.width, elCanvasHolistic.value.height)
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
    color: '#00cff7',
    lineWidth: 4
  })
  drawLandmarks(canvasCtx, results.poseLandmarks, {
    color: '#ff0364',
    lineWidth: 2
  })
  drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_TESSELATION, {
    color: '#C0C0C070',
    lineWidth: 1
  })
  if (results.faceLandmarks && results.faceLandmarks.length === 478) {
    // draw pupils
    drawLandmarks(canvasCtx, [results.faceLandmarks[468], results.faceLandmarks[468 + 5]], {
      color: '#ffe603',
      lineWidth: 2
    })
  }
  drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {
    color: '#eb1064',
    lineWidth: 5
  })
  drawLandmarks(canvasCtx, results.leftHandLandmarks, {
    color: '#00cff7',
    lineWidth: 2
  })
  drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {
    color: '#22c3e3',
    lineWidth: 5
  })
  drawLandmarks(canvasCtx, results.rightHandLandmarks, {
    color: '#ff0364',
    lineWidth: 2
  })
}

// ***********************************
// Webcam
// ***********************************
// Available devices
const devices = reactive<MediaDeviceInfo[]>([])
// Current device index
const currentDevice = ref<number>(-1)
// Current device stream
let currentDeviceStream: MediaStream|null = null
// Get available devices
const getDevices = async (): Promise<void> => {
  try {
    // Check browser compatibility
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('mediaDevices is not supported by your browser')
    }
    // Get devices
    const d = await navigator.mediaDevices.enumerateDevices()
    // Update devices array
    devices.length = 0
    for (const dd of d) {
      if (dd.kind === 'videoinput') {
        devices.push(dd)
      }
    }
  } catch (error) {
    console.error(error)
  }
}
// Get current device stream
const getDeviceStream = async (): Promise<void> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !navigator.mediaDevices.enumerateDevices) {
      throw new Error('mediaDevices is not supported by your browser')
    }
    currentDeviceStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: devices[currentDevice.value].deviceId ? { exact: devices[currentDevice.value].deviceId } : undefined }
    })
  } catch (error) {
    console.error(error)
  }
}

// ***********************************
// Events
// ***********************************
// Is tracking now?
const isTracking = ref<boolean>(false)
// Start tracking
const start = async (): Promise<void> => {
  isTracking.value = true
  // Get video stream from device
  await getDeviceStream()
  if (!elWebcam.value || !elCanvasHolistic.value || !elCanvasFaceApi.value) return
  // Update DOM elements
  Object.assign(elWebcam.value, {
    srcObject: currentDeviceStream,
    width: 640,
    height: 480,
    autoplay: true
  })
  // Wait for next DOM render
  await nextTick()
  // elCanvasHolistic.value.width = 640
  // elCanvasHolistic.value.height = 480
  // elCanvasFaceApi.value.width = 640
  // elCanvasFaceApi.value.height = 480
  // Start mediapipe holistic
  camera = new Camera(elWebcam.value, {
    async onFrame () {
      if (elWebcam.value) await holistic.send({ image: elWebcam.value })
    },
    width: 640,
    height: 480
  })
  await camera.start()
  // Start face detection
  faceTimer = window.setInterval(() => {
    void RunFaceExpression()
  }, 500)
}
// Stop tracking
const stop = (): void => {
  isTracking.value = false
  clearInterval(faceTimer)
  camera.stop()
  camera = null
  elCanvasHolistic.value.getContext('2d').clearRect(0, 0, elCanvasHolistic.value.width, elCanvasHolistic.value.height)
  elCanvasFaceApi.value.getContext('2d').clearRect(0, 0, elCanvasFaceApi.value.width, elCanvasFaceApi.value.height)
}
// Restart tracking
watch(currentDevice, () => {
  if (isTracking.value) {
    stop()
    void start()
  }
})

// ***********************************
// Init
// ***********************************
// Init devices array
void getDevices()
// Init face API
void initFaceAPI()
// Init Holistic
void initHolistic()

// ***********************************
// Pages and forms
// ***********************************
const page = ref<number>(1)
const settings = ref<boolean>(false)
const formFace = reactive({
  parameter: 'Change_LockFaceReaction',
  neutral: 0,
  happy: 2,
  sad: 9,
  angry: 14,
  fearful: 6,
  disgusted: 19,
  surprised: 8
})
</script>

<template lang="pug">
.container
  .row
    .col-12.mb-3
      h1.text-center.text-vrc-primary VRChat Motion Controller
    .col-12.mb-3
      .text-center#guide(ref='elGuide')
        //- Video element for webcam stream
        video#webcam(ref="elWebcam" autoplay muted playsinline width="640" height="480")
        canvas#canvas-holistic(ref="elCanvasHolistic" width="640" height="480")
        canvas#canvas-faceapi(ref="elCanvasFaceApi" width="640" height="480")
    .col-12.mb-3.text-center
        button.btn.btn-vrc-danger.mx-1(type='button' v-if='isTracking' @click='stop')
          font-awesome-icon(:icon='["fas", "stop"]')
        button.btn.btn-vrc-success.mx-1(type='button' v-else @click='start' :disabled="currentDevice === -1")
          font-awesome-icon(:icon='["fas", "play"]')
        button.btn.btn-vrc.mx-1(type='button' data-bs-toggle="modal" data-bs-target="#modal-settings")
          font-awesome-icon(:icon='["fas", "gear"]')
  #modal-settings.modal.fade
    .modal-dialog.modal-fullscreen 
      .modal-content.bg-vrc-modal
        .modal-header
          h5.modal-title.h4.text-vrc-primary Settings
          button.btn-vrc-danger(type="button" data-bs-dismiss="modal" aria-label="Close")
            font-awesome-icon(:icon='["fas", "xmark"]')
        .modal-body.row
          .col-2
            ul.nav.nav-pills.flex-column
              li.nav-item
                a.nav-link.nav-vrc(@click='page = 1' :class="{active: page === 1}") Webcam
              li.nav-item
                a.nav-link.nav-vrc(@click='page = 2' :class="{active: page === 2}") Face
          .col-10(v-if='page === 1')
            .row.mb-3
              label.col-12.col-form-label.text-vrc-primary(for="input-device") Device
              .col-11
                select#input-device.form-select(v-model.number="currentDevice")
                  option(selected :value="-1") Select Device
                  option(v-for='(device, index) in devices' :key='device.deviceId' :value='index') {{ device.label }}
              .col-1
                button.btn.btn-vrc.mx-1(type='button' @click='getDevices')
                  font-awesome-icon(:icon='["fas", "arrow-rotate-right"]')
          .col-10(v-if='page === 2')
            .row.mb-3(v-for='(value, key) in formFace' :key='key')
              label.col-12.col-form-label.text-vrc-primary(:for="'input-'+key") {{ key.charAt(0).toUpperCase() + key.slice(1) }}
              .col-12
                input.form-control(type='text' v-model='formFace[key]' :id="'input-'+key")
        .modal-footer
          button.btn.btn-vrc-danger(type='button' data-bs-dismiss='modal') Close
</template>
