import "./style.css";

import * as faceapi from "face-api.js";

const mapActions = {
  face: (canvas, resizedDetections) => {
    faceapi.draw.drawDetections(canvas, resizedDetections); // 人脸检测
  },

  landmark: (canvas, resizedDetections) => {
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); // 特征点标记
  },

  expression: (canvas, resizedDetections) => {
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections); // 表情
  },

  agegender: (canvas, resizedDetections) => {
    resizedDetections.forEach((result) => {
      // 手动绘制：年龄 性别
      const { age, gender, genderProbability } = result;
      new faceapi.draw.DrawTextField([`${~~age} years`, `${gender} {${genderProbability.toFixed(1)}}`], result.detection.box.bottomLeft).draw(canvas);
    });
  },
};

// 切换显示
let intervalID;
const menu = document.querySelector(".menu");
menu.addEventListener("click", (e) => {
  clearInterval(intervalID);
  const action = e.target.dataset.action;
  detectFace(action);
});
const videoEl = document.querySelector("#video");
const view = document.querySelector(".view");

// 开启摄像头
async function getCamera() {
  try {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoEl.srcObject = mediaStream;
  } catch (error) {
    console.error(error);
  }
}

// 加载模型
async function loadModels(path) {
  await faceapi.nets.tinyFaceDetector.loadFromUri(path);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(path);
  await faceapi.nets.faceExpressionNet.loadFromUri(path);
  await faceapi.nets.ageGenderNet.loadFromUri(path);
  getCamera();
}

let canvas;
// 监测人脸
function detectFace(action = "face") {
  if (canvas) view.removeChild(canvas);
  canvas = faceapi.createCanvasFromMedia(videoEl);
  const ctx = canvas.getContext("2d");
  const { clientWidth, clientHeight } = videoEl;

  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  view.append(canvas);

  intervalID = setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceExpressions()
      .withAgeAndGender();

    // console.log(' ', detections)
    const resizedDetections = faceapi.resizeResults(detections, { width: clientWidth, height: clientHeight }); // 绘制结果

    ctx.clearRect(0, 0, clientWidth, clientHeight); // 清除每一次检测的 canvas

    mapActions[action](canvas, resizedDetections);

    // faceapi.draw.drawDetections(canvas, resizedDetections) // 人脸检测
    // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections); // 特征点标记
    // faceapi.draw.drawFaceExpressions(canvas, resizedDetections) // 表情

    // resizedDetections.forEach( (result) => { // 手动绘制：年龄 性别
    //   const {age, gender, genderProbability} = result
    //   new faceapi.draw.DrawTextField([
    //     `${~~age} years`,
    //     `${gender} {${genderProbability.toFixed(1)}}`
    //   ], result.detection.box.bottomLeft)
    //   .draw(canvas)
    // })
  }, 200);
}

loadModels("./models");
// videoEl.addEventListener("play", detectFace);
