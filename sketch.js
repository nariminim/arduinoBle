// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn, send1Btn, send2Btn, send3Btn;
let circleColor;

// 가속도 센서 관련 변수
let accelBtn, accelStatusP, accelDataP;
let accelX = 0, accelY = 0, accelZ = 0;
let isAccelActive = false;
let ballX, ballY;
let ballVx = 0, ballVy = 0;
let ballAngle = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);

  // 원의 색상 초기값 설정 (기본: 회색)
  circleColor = color(128);

  // BLE 연결
  connectBtn = createButton("Scan & Connect");
  connectBtn.mousePressed(connectAny);
  connectBtn.size(120, 30);
  connectBtn.position(20, 40);

  statusP = createP("Status: Not connected");
  statusP.position(22, 60);

  // Send 버튼들
  send1Btn = createButton("send 1");
  send1Btn.mousePressed(() => sendNumber(1));
  send1Btn.size(120, 30);
  send1Btn.position(20, 100);

  send2Btn = createButton("send 2");
  send2Btn.mousePressed(() => sendNumber(2));
  send2Btn.size(120, 30);
  send2Btn.position(20, 140);

  send3Btn = createButton("send 3");
  send3Btn.mousePressed(() => sendNumber(3));
  send3Btn.size(120, 30);
  send3Btn.position(20, 180);

  // 가속도 센서 활성화 버튼
  accelBtn = createButton("가속도 센서 활성화");
  accelBtn.mousePressed(requestAccelPermission);
  accelBtn.size(150, 30);
  accelBtn.position(20, 220);

  accelStatusP = createP("가속도 센서: 비활성화");
  accelStatusP.position(22, 250);

  accelDataP = createP("X: 0, Y: 0, Z: 0");
  accelDataP.position(22, 270);

  // 원의 초기 위치 (화면 중앙)
  ballX = width / 2;
  ballY = height / 2;
}

function draw() {
  background(255);
  
  // 중앙에 크기 200인 원 그리기 (기존 기능 유지)
  fill(circleColor);
  noStroke();
  ellipse(width / 2, height / 2, 200);

  // 가속도 센서로 움직이는 작은 원 그리기
  if (isAccelActive) {
    // 가속도 값에 따른 물리 시뮬레이션
    updateBallPhysics();

    // 회전 각도 계산 (가속도 기반)
    ballAngle += accelX * 0.1;

    // 원 그리기 (회전 적용)
    push();
    translate(ballX, ballY);
    rotate(ballAngle);
    fill(0, 0, 255); // 파란색
    noStroke();
    ellipse(0, 0, 20); // 지름 20
    pop();
  } else {
    // 비활성화 시 중앙에 고정
    fill(0, 0, 255);
    noStroke();
    ellipse(width / 2, height / 2, 20);
  }
}

// 공의 물리 업데이트
function updateBallPhysics() {
  // 가속도를 속도 변화로 변환 (스케일 조정)
  const friction = 0.95; // 마찰 계수
  const maxSpeed = 10; // 최대 속도
  
  ballVx += accelX * 0.5;
  ballVy += accelY * 0.5;
  
  // 마찰 적용
  ballVx *= friction;
  ballVy *= friction;
  
  // 최대 속도 제한
  ballVx = constrain(ballVx, -maxSpeed, maxSpeed);
  ballVy = constrain(ballVy, -maxSpeed, maxSpeed);
  
  // 위치 업데이트
  ballX += ballVx;
  ballY += ballVy;
  
  // 경계 충돌 처리 (반사)
  const radius = 10; // 반지름
  if (ballX < radius || ballX > width - radius) {
    ballVx *= -0.8; // 반사 + 감쇠
    ballX = constrain(ballX, radius, width - radius);
  }
  if (ballY < radius || ballY > height - radius) {
    ballVy *= -0.8; // 반사 + 감쇠
    ballY = constrain(ballY, radius, height - radius);
  }
}

// ---- BLE Connect ----
async function connectAny() {
  try {
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [SERVICE_UUID],
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE_UUID);
    writeChar = await service.getCharacteristic(WRITE_UUID);
    statusP.html("Status: Connected to " + (device.name || "device"));
  } catch (e) {
    statusP.html("Status: Error - " + e);
    console.error(e);
  }
}

// ---- Write 1 byte to BLE ----
async function sendNumber(n) {
  // 버튼에 따라 원의 색상 변경
  if (n === 1) {
    circleColor = color(255, 0, 0); // Red
  } else if (n === 2) {
    circleColor = color(0, 255, 0); // Green
  } else if (n === 3) {
    circleColor = color(0, 0, 255); // Blue
  }

  if (!writeChar) {
    statusP.html("Status: Not connected");
    return;
  }
  try {
    await writeChar.writeValue(new Uint8Array([n & 0xff]));
    statusP.html("Status: Sent " + n);
  } catch (e) {
    statusP.html("Status: Write error - " + e);
  }
}

// ---- 가속도 센서 활성화 ----
function requestAccelPermission() {
  // iOS 13+ 에서는 사용자 제스처가 필요
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(response => {
        if (response == 'granted') {
          startAccel();
        } else {
          accelStatusP.html("가속도 센서: 권한 거부됨");
          isAccelActive = false;
        }
      })
      .catch(console.error);
  } else {
    // Android나 구형 iOS에서는 직접 시작
    startAccel();
  }
}

function startAccel() {
  window.addEventListener('devicemotion', handleMotionEvent);
  isAccelActive = true;
  accelStatusP.html("가속도 센서: 활성화됨");
  accelBtn.html("가속도 센서 비활성화");
  accelBtn.mousePressed(stopAccel);
}

function stopAccel() {
  window.removeEventListener('devicemotion', handleMotionEvent);
  isAccelActive = false;
  accelStatusP.html("가속도 센서: 비활성화");
  accelBtn.html("가속도 센서 활성화");
  accelBtn.mousePressed(requestAccelPermission);
  // 속도 초기화
  ballVx = 0;
  ballVy = 0;
  ballX = width / 2;
  ballY = height / 2;
}

function handleMotionEvent(event) {
  // 가속도 값 읽기 (m/s²)
  if (event.accelerationIncludingGravity) {
    accelX = event.accelerationIncludingGravity.x || 0;
    accelY = event.accelerationIncludingGravity.y || 0;
    accelZ = event.accelerationIncludingGravity.z || 0;
    
    // 텍스트 출력 업데이트
    accelDataP.html(`X: ${accelX.toFixed(2)}, Y: ${accelY.toFixed(2)}, Z: ${accelZ.toFixed(2)}`);
  }
}
