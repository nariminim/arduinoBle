// 소문자 (아두이노와 동일하게 입력)
const SERVICE_UUID = "19b10000-e8f2-537e-4f6c-d104768a1214"; 
const WRITE_UUID = "19b10001-e8f2-537e-4f6c-d104768a1214"; 
let writeChar, statusP, connectBtn, send1Btn, send2Btn, send3Btn;
let circleColor;

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
}

function draw() {
  background(255);
  
  // 중앙에 크기 200인 원 그리기
  fill(circleColor);
  noStroke();
  ellipse(width / 2, height / 2, 200);
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
