import { useCallback, useEffect, useRef, useState } from 'react'
import * as faceapi from 'face-api.js'

const MODEL_URL = '/models'

const getDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)

const getEyeAspectRatio = (eyePoints) => {
  if (!eyePoints || eyePoints.length < 6) return 0
  const verticalA = getDistance(eyePoints[1], eyePoints[5])
  const verticalB = getDistance(eyePoints[2], eyePoints[4])
  const horizontal = getDistance(eyePoints[0], eyePoints[3]) || 1
  return (verticalA + verticalB) / (2 * horizontal)
}

export const useFocusTracker = () => {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const tickRef = useRef(null)

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [isTracking, setIsTracking] = useState(false)
  const [focusScore, setFocusScore] = useState(0)
  const [error, setError] = useState(null)

  const blinkCountRef = useRef(0)
  const wasBlinkRef = useRef(false)
  const frameCountRef = useRef(0)
  const scoreSumRef = useRef(0)

  const loadModels = useCallback(async () => {
    if (modelsLoaded) return
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ])
      setModelsLoaded(true)
    } catch (e) {
      setError('face-api 모델을 로드하지 못했습니다.')
    }
  }, [modelsLoaded])

  const stopTracking = useCallback(() => {
    setIsTracking(false)
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startTracking = useCallback(async () => {
    try {
      await loadModels()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      blinkCountRef.current = 0
      wasBlinkRef.current = false
      frameCountRef.current = 0
      scoreSumRef.current = 0
      setFocusScore(0)
      setIsTracking(true)

      tickRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks(true)

        if (!detection) {
          setFocusScore((prev) => Math.max(0, prev - 2))
          return
        }

        const landmarks = detection.landmarks
        const leftEye = landmarks.getLeftEye()
        const rightEye = landmarks.getRightEye()
        const jaw = landmarks.getJawOutline()
        const nose = landmarks.getNose()

        const ear = (getEyeAspectRatio(leftEye) + getEyeAspectRatio(rightEye)) / 2
        const blinkThreshold = 0.18
        if (ear < blinkThreshold && !wasBlinkRef.current) {
          blinkCountRef.current += 1
          wasBlinkRef.current = true
        } else if (ear >= blinkThreshold) {
          wasBlinkRef.current = false
        }

        // 간단한 정면 추정: 턱 윤곽 중심 대비 코끝의 x 오프셋
        const faceCenterX = (jaw[0].x + jaw[16].x) / 2
        const noseTipX = nose[3].x
        const halfFaceWidth = Math.max((jaw[16].x - jaw[0].x) / 2, 1)
        const yawRatio = Math.abs((noseTipX - faceCenterX) / halfFaceWidth)

        const gazeScore = Math.max(0, 100 - yawRatio * 140)
        const blinkPenalty = Math.min(30, blinkCountRef.current * 2)
        const frameScore = Math.max(0, Math.min(100, gazeScore - blinkPenalty))

        frameCountRef.current += 1
        scoreSumRef.current += frameScore
        const avg = scoreSumRef.current / frameCountRef.current
        setFocusScore(Math.round(avg))
      }, 1000)
    } catch (e) {
      setError('카메라 권한 또는 트래킹 시작에 실패했습니다.')
      stopTracking()
    }
  }, [loadModels, stopTracking])

  useEffect(() => stopTracking, [stopTracking])

  return {
    videoRef,
    focusScore,
    isTracking,
    modelsLoaded,
    error,
    startTracking,
    stopTracking,
  }
}

export default useFocusTracker
