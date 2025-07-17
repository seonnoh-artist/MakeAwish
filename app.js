let password = '1738'; // 원하는 비밀번호로 수정
let enteredPassword = '';
let startHour = 10; // 전시 시간 설정 
let endHour = 20;

function checkPassword() {
  enteredPassword = document.getElementById('password').value;

  if (enteredPassword === password) {

    document.activeElement.blur(); // 키보드 내려가기

    setTimeout(() => {
      const form = document.getElementById('password-form');
      form.style.display = 'none';
      form.innerHTML = '';

      const form2 = document.getElementById('time-setting-form');
      form2.style.display = 'none';
      form2.innerHTML = '';

      document.getElementById('art-container').style.display = 'block';
      initializeArt();
    }, 50);
  } else {
    alert('Incorrect password');
  }
}

function loadExhibitionTime() {
  const savedStart = localStorage.getItem('startHour');
  const savedEnd = localStorage.getItem('endHour');
  if (savedStart !== null) startHour = parseInt(savedStart);
  if (savedEnd !== null) endHour = parseInt(savedEnd);

  document.getElementById('start-hour').value = startHour;
  document.getElementById('end-hour').value = endHour;
}

function saveExhibitionTime() {
  const s = parseInt(document.getElementById('start-hour').value);
  const e = parseInt(document.getElementById('end-hour').value);


  if (s < e) {
    startHour = s;
    endHour = e;
    localStorage.setItem('startHour', startHour);
    localStorage.setItem('endHour', endHour);
    alert('전시 시간이 ' + startHour + '-' + endHour + '시로 저장되었습니다.');
  } else {
    alert('전시 시간 설정이 잘못되었습니다다.');
  }
}

function changeHour(type, delta) {
  const input = document.getElementById(`${type}-hour`);
  let val = parseInt(input.value || '0') + delta;
  if (val < 0) val = 24;
  if (val > 24) val = 0;
  input.value = val;
}


// 여기서부터는 원래 p5.js 코드
let yoff = 10; // 2nd dimension of perlin noise
let bg;
let cur_Img;
let particleImage = [];
let chk = false;
let count = 20;
let dimension = 0.07;
let wave_chk = false;
let star_num = 30;
let load_star_num = 5;
let group_star = [];
let free_star;
let t = 270;
let framecnt = 0;
let lastTouchtime = 0;
let touchTimeout = 300; //ms ,  터치 종료로 간주할 시간 
let touch_chk = false;

// 마이크 기능 추가 25.7.17
let mic;
let vol = 0;
let started = false;
let micSensitivity = 0.02;
let lastVol = 0;
let freezeCount = 0;
let vol_wave_scale = 0;
let waveHeight = 0; // 파도의 높이를 마이크로 조정
let green_value = 0; // 투명
let stroke_value =1;


// ==================== 기기 감지 ====================

function detectDevice() {
  const ua = navigator.userAgent.toLowerCase();
  const isIpad = ua.includes("ipad") || (ua.includes("macintosh") && 'ontouchend' in document);
  const isIphone = ua.includes("iphone");

  if (isIpad) {
    micSensitivity = 0.005;
    log_str = "iPad";
  } else if (isIphone) {
    micSensitivity = 0.05;
    log_str = "iPhone";
  } else {
    micSensitivity = 0.3;
    log_str = "ETC";
  }

  console.log("Device detected → micSensitivity:", micSensitivity);
}

function printLog() {
  /*
  fill(255);
  textSize(20);
  text(log_str, 100, 100);
  let volume_str = mic.getLevel();
  text("vol: " + nf(volume_str, 1, 6), 100, 300);
  text("satrtHour: " + startHour, 100, 200);
  text("endHour: " + endHour, 100, 250);*/
}


//별 그리기 클래스
class star {
  constructor(p_star, size, p_x, p_y) {
    this.p_star = p_star;
    this.size = size;
    this.p_x = p_x;
    this.p_y = p_y;
    this.timeout = 10;
  }

  display() {
    tint(255, random(100, 200)); //별의 밝기를 랜덤으로 그린다. 
    image(this.p_star, this.p_x, this.p_y, this.size, this.size);
  }

  update(star, size, x, y) {
    this.p_star = star;
    this.p_x = x;
    this.p_y = y;
    this.size = size;
  }
}

function preload() {
  bg = loadImage("data/shootingStar_bk.jpg",
    () => { console.log('shootingStar_bk.jpg loaded successfully'); },
    () => { console.error('Failed to load shootingStar_bk.jpg'); }
  );

  for (let i = 0; i < load_star_num; i++) {
    particleImage[i] = loadImage("data/star" + i + ".png",
      () => { console.log('star' + i + '.png loaded successfully'); },
      () => { console.error('Failed to load star' + i + '.png'); }
    );
  }
}

function initializeArt() {
  const cnv = createCanvas(windowWidth, windowHeight); // 원래 setup()의 createCanvas() 부분만 여기
  cnv.parent('art-container');
  cnv.position(0, 0); //좌표 틀어짐 방지 
  resizeCanvas(windowWidth, windowHeight); //강제 크기 재설정
  // image(bg, 0, 0, width, height);
  //bg.loadPixels();
  // console.log("로드픽셀");

  // 랜덤별
  let particle_random = int(random(load_star_num));
  let p_star = particleImage[particle_random]; //이상해서 테스트...8.21 2024
  let size = random(50, 150);
  let p_x = random(width);
  let p_y = random(height);
  free_star = new star(p_star, size, p_x, p_y);

  group_star = []; // 기존 별 배열 초기화화

  for (let i = 0; i < star_num; i++) {
    let particle_random = int(random(load_star_num));
    let p_star = particleImage[particle_random]; //이상해서 테스트...8.21 2024
    let size = random(30, 100);
    let p_x = random(width);
    let p_y = random(height);
    console.log(
      i + "p_x" + p_x + "py " + p_y + "random" + particle_random + "size" + size
    );
    group_star[i] = new star(p_star, size, p_x, p_y); // 별을 마구마구 만든다.
  }
  console.log('group_star.length = ', group_star.length);
  console.log('group_star[0] =', group_star[0]);

  detectDevice();  // 마이크 기능 추가 

}

function handleReleased() {
  wave_chk = false;
  count = 20;
  // console.log("release...");
  /*
  fill(255, 255);
  textSize(30);
  text("released... ", 200, 50);  */
}

// ==================== 마이크 활성화 ====================
function mousePressed() {
  if (!started) {
    userStartAudio().then(() => {
      mic = new p5.AudioIn();
      mic.start();
      started = true;
    });
  }
}
//=======================마이크 재활성화=====================
function restartMic() {

  fill(255);
  textSize(32);
  text("마이크재시작.", w, h);
  if (mic) {
    mic.stop(); //기존 마이크 중지
  }
  mic = new p5.AudioIn();
  mic.start();
  started = true;
}
//======================마이크 모니터링=======================
function monitorMic() {
  let currentVol = mic.getLevel();
  if (currentVol === lastVol) {
    freezeCount++;
  } else {
    freezeCount = 0;
  }
  lastVol = currentVol;

  const now = millis();
  if (freezeCount > 100 && (now - lastRestartedTime) > 3000) {
    console.warn("마이크 재시작 시도");
    restartMic();
    freezeCount = 0;
    lastRestartedTime = now;
  }

  if (getAudioContext().state !== 'running') {   //오디오 컨텍스트 중단시 재시작(중요)
    userStartAudio();
  }
}


function draw() {

  /*  // 설정시간 로그 
  fill(255);
  textSize(20);
  text("satrtHour: " + startHour, 100, 200);
  text("endHour: " + endHour, 100, 250);*/

  // 전시 시간 설정  9시~22시
  let now = hour();

  if (now >= startHour && now < endHour) {
    frameRate(60);
  } else {
    background(0, 0, 0);  // 전력을 가장 낮춘다. 
    fill(255, 255, 255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text('전시 시간이 아닙니다.', width / 2, height / 2);
    frameRate(1);
    return;
  }




  /*//테스트용   
    let now = minute() % 2;
  
    if (now >= 0 && now < 1) {
      frameRate(60);
    } else {
      background(0, 0, 0);  // 전력을 가장 낮춘다. 
      fill(255, 255, 255);
      textSize(32);
      textAlign(CENTER, CENTER);
      text('전시 시간이 아닙니다.', width / 2, height / 2);
      frameRate(1);
      return;
    }*/



  if (!bg) {   // 데이터 없으면 가져온다..... //아이패드에서 자주 있는 에러임.
    image(bg, 0, 0, width, height);
    bg.loadPixels();
    return;
  }


  // 마이크 기능을 추가
  if (!started) {
    fill(255);
    textSize(32);
    text("화면을 클릭해 마이크 호출해 주세요.", width / 2, height / 2);
    return;
  }

  monitorMic(); //마이크 모니터링

  vol = mic.getLevel();

  /*
  fill(255, 0, 0, 255);
  textSize(30);
  text("started... ", 200, 50);*/


  // console.log("count" + count);
  framecnt++;
  if (framecnt == 100) framecnt = 0;

  let random_delay_frame_cnt = int(random(5, 20));
  // 랜덤으로 딜레이되는 시간만큼 별을 그려준다. (계속 고정)
  if (framecnt % random_delay_frame_cnt == 0) {
    let particle_random = int(random(load_star_num));
    let p_star = particleImage[particle_random];
    let size = random(30, 100);
    let p_x = random(width);
    let p_y = random(height);

    if (free_star) {     //실제로 이니셜라이즈되어서 존재하면 그린다. 
      free_star.update(p_star, size, p_x, p_y);
      free_star.display();
    } else {
      free_star = new star(p_star, size, p_x, p_y); //없으면가져온다. 
    }
  }

  //터치떼면 일렁일렁하다가 최종으로 원본이미지 출력  처음 count값 20
  /*
  if (count > 100 ) {
    console.log("꿀렁" + count);
    count--;
    noStroke();

    for (let x = 0; x < bg.width; x = x + 30) {
      for (let y = 0; y < bg.height; y = y + 30) {
        //꿈틀꿈틀 움직임을 원으로 표현
        let b_loc = (x + y * bg.width) * 4; //2024.8.22 x행 y열의 픽셀 위치
        let p_red = bg.pixels[b_loc + 0];
        let p_green = bg.pixels[b_loc + 1];
        let p_blue = bg.pixels[b_loc + 2]; /// 2024.8.21
        fill(p_red, p_green, p_blue, 30); //투명도는 30으로 낮게 설정
        let random_r = random(80, 120);
        ellipse(x, y, random_r, random_r);
      }
    }
  } */
  if (count > 0) {
    // 마지막 몇초전은 점점 선명한 배경이미지로 그려준다.
    count--;

    /*
    let alpha = 255 - count * 50;
    tint(255, alpha);*/

    //tint(255, 255, 255, 50);
    // image(bg, 0, 0, width, height);
    blend(bg, 0, 0, bg.width, bg.height, 0, 0, width, height, LIGHTEST);

    /*fill(255, 255);
    textSize(30);
    text("img ", 50, 50);*/
    // console.log("img...");

  } else if (count == 0) {  //이미지 선명해지면 별이 여러개 생성된다. 
    // tint(255, 255, 100, 10); //yelllow
    tint(255, 255, 255, 50); //yelllow
    image(bg, 0, 0, width, height);
    count--;
    for (let i = 0; i < star_num; i++) {
      let particle_random = int(random(load_star_num));
      let p_star = particleImage[particle_random];
      let size = random(30, 100);
      let p_x = random(width);
      let p_y = random(height);

      if (group_star[i]) {     //실제로 이니셜라이즈되어서 존재하면 그린다. 
        group_star[i].update(p_star, size, p_x, p_y);
        group_star[i].display();
      } else {
        group_star[i] = new star(p_star, size, p_x, p_y); // 없으면 별을 마구마구 만든다.
      }
    }
  } else {
    if (count > -200) {
      //100만큼 기다렸다가 파도 그린다.
      count--;
      yoff = 0;
    } else {
      wave_chk = true; //파도 체크를 켠다. 
    }
  }

  //동그라미 그린다. 
  noStroke();
  for (let i = 0; i <1; i++) {  //여러번 그린다...........25.7.17
    //  console.log('count' + count);
    let b_x = int(random(0, bg.width));
    let b_y = int(random(0, bg.height));
    let b_loc = (b_x + b_y * bg.width) * 4; //2024.8.22 x행 y열의 픽셀 위치
    let ran_rid = random(50, 500);
    let p_red = bg.pixels[b_loc + 0];
    let p_green = bg.pixels[b_loc + 1];
    let p_blue = bg.pixels[b_loc + 2];
    fill(p_red, p_green, p_blue, 20); //투명도는 10d으로 낮게 설정
    b_x = map(b_x, 0, bg.width, 0, width);
    b_y = map(b_y, 0, bg.height, 0, height);
    ellipse(b_x, b_y, ran_rid, ran_rid);
  }

  let xoff = 0; // Option #1: 2D Noise
  let x_value = 0;

  if (mouseIsPressed == true) {
    fill(40, 90, 180, 5); //청록
    dimension = 0.05;
    x_value = 30;
  } else {
    dimension = 0.05;
    x_value = 30;
  }


  noFill();
  //파도를 그린다.
  // 마이크 베리에이션 

  vol_wave_scale = map(vol, 0, micSensitivity, 0, 1, true);
  x_value = max(10, 30 - vol_wave_scale * 20); // 진폭을 마이크값으로 조정
  waveHeight = map(vol, 0, micSensitivity, 30, 200, true); // 파도의 높이를 마이크로 조정
  green_value = map(vol_wave_scale, 0, 1, 160, 180); // 투명도   
  stroke_value = max(1, 1+ vol_wave_scale);

  strokeWeight(stroke_value);
  noFill();
  strokeJoin(ROUND); //선을 부드럽게
  //stroke(0, 160, 180, alpha);*/


  if (wave_chk == true) {
    t += 0.01;
    let alpha = map(sin(t), -1, 1, 30, 100);
    //  stroke(0, 160, 180, alpha);
    stroke(0, green_value, 180, alpha);
    if (t > 360) t = 0;

    /* fill(255);
     textSize(16);
     text("t: " + nf(alpha, 5, 2), 10, 20);*/
    //웨이브 체크가 켜질때 (터치이후 약간의 텀을 준다
    //stroke(0, 0, 255, 10);
    //  let c = color(0, 160, 180);
    // We are going to draw a polygon out of the wave points
    beginShape();
    //이벤트가 없는 상태엥서 파도를 그린다.
    // Iterate over horizontal pixels
    let end_y = 0;
    for (let x = 0; x <= width; x += x_value) {
      // Calculate a y value according to noise, map to
      //let y = map(noise(xoff, yoff), 0, 1, height * 0.5, height * 0.7) ;// Option #1: 2D Noise    
      let y = map(noise(xoff, yoff), 0, 1, height * 0.5 - waveHeight / 2, height * 0.7 + waveHeight / 2); // 파도의높이를 조정 마이크로. 
      end_y = y;
      // Set the vertex
      vertex(x, y);
      // Increment x dimension for noise
      xoff += dimension;

    }

    yoff += 0.01;
    vertex(width + 100, end_y);
    vertex(width + 100, height);
    vertex(0, height);
    // stroke(180,200,210,   50);
    endShape(CLOSE);
  }

  if (mouseIsPressed == true) {
    // 별 생성해서 터치 따라다닌다.
    ran_rid = random(50, 150);
    tint(255, random(100, 255));
    let rand_img = 0;
    rand_img = int(random(4));
    // console.log("rand_img" + rand_img);
    image(particleImage[rand_img], mouseX, mouseY, ran_rid, ran_rid);
    t = 270;
    lastTouchtime = millis(); // 마지막 시간을 기록합니다. 
    touch_chk = true;
  }

  //터치종료후
  if (touch_chk && (millis() - lastTouchtime > touchTimeout)) {
    handleReleased(); // 터치가 끝난 것으로 간주합니다. 
    touch_chk = false;
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js')
    .then(function (registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    })
    .catch(function (error) {
      console.log('Service Worker registration failed:', error);
    });
}
