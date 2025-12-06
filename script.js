// 协议数据
const protocols = {
    sleep: {
        name: '睡眠呼吸',
        type: 'single',
        pattern: [4, 7, 8],
        defaultCycles: 8
    },
    neuro: {
        name: '神经重塑协议',
        type: 'sequence',
        totalRounds: 3,
        steps: [
            { name: '激活呼吸', pattern: [4, 7, 8], cycles: 1 },
            { name: '通路创建呼吸', pattern: [6, 2, 4], cycles: 1 },
            { name: '整合呼吸', pattern: [8, 4, 8], cycles: 1 },
            { name: '显化锁定呼吸', pattern: [10, 10, 10], cycles: 1 }
        ]
    }
};

// 状态管理
let state = {
    selectedProtocol: 'sleep',
    sleepCycles: 8, // 睡眠呼吸的循环次数
    totalRounds: 3,
    currentRound: 1,
    currentStep: 0,
    currentCycle: 1,
    currentPhase: 'prepare', // prepare, inhale, hold, exhale
    phaseTimeLeft: 3,
    isPaused: false,
    enableTick: true,
    enableVoice: true,
    enableBackgroundMusic: true,
    backgroundVolume: 0.5,
    volume: 0.8
};

// 内置的轻音乐（1s 三和弦），避免提交二进制文件
const EMBEDDED_BACKGROUND_WAV =
    'data:audio/wav;base64,UklGRmisAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YUSsAAAAAM0BlQNUBQMHoAglCo4LUAt0D6wQzBC4EkMQlxK+E80S6BKsEd0QLBIkExIQzBPwERQV8BCgEmwP2BPQEAwXhBbEFqQWlBR8FSwWABf4FBgX8BQwF/gTgBE0E0wQXBDkERwTqBFQE+wQQBGwE2wP3AmkBeQEdAfMCkQK7AmMC+gJnAvgCWgL2AnQC1wJgAuYCbQKxAnYCxgJ8ArkCbgLOApACzwKTAu4CgQKAAlkB5gD9//T/uwCbAUMCrwBRAqoAPwEMAI0B7wBTAlcAnwG8ACQBNQD2AH0BlgAMAUUAjQEFAOkBzAD7ACIB7wDrAfIADgH7APMBBQAGAeYAuQH0AMAB/wABAd0ABgEBAAMAAQAAAP//AQACAP///wAA/wEA/v//AQQAAAH6AAAB+wABAfgAAAH8AAAB+QAAAfsAAAAFAAAA7wAAAPoAAQEAAP//AAACAAAAAAAAAP7//wAAAP//AAAB////AAEAAP//AP//AQH//wABAAEAAAMAAQABAAAAAgABAAEAAAABAAEAAAAAAAAAAAAAAAAA';

let timer = null;
let audioContext = null;
let wakeLock = null; // 屏幕唤醒锁
let backgroundBuffer = null;
let backgroundSource = null;
let backgroundGainNode = null;

// 初始化
function init() {
    // 协议选择
    document.querySelectorAll('.protocol-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.protocol-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            state.selectedProtocol = this.dataset.protocol;
            updateRoundsVisibility();
        });
    });

    // 轮数控制
    document.getElementById('decreaseRounds').addEventListener('click', () => {
        if (state.selectedProtocol === 'sleep') {
            if (state.sleepCycles > 1) {
                state.sleepCycles--;
                updateRoundsDisplay();
            }
        } else {
            if (state.totalRounds > 1) {
                state.totalRounds--;
                updateRoundsDisplay();
            }
        }
    });

    document.getElementById('increaseRounds').addEventListener('click', () => {
        if (state.selectedProtocol === 'sleep') {
            if (state.sleepCycles < 20) {
                state.sleepCycles++;
                updateRoundsDisplay();
            }
        } else {
            if (state.totalRounds < 10) {
                state.totalRounds++;
                updateRoundsDisplay();
            }
        }
    });

    // 音量控制
    const volumeSlider = document.getElementById('volumeSlider');
    volumeSlider.addEventListener('input', (e) => {
        state.volume = e.target.value / 100;
        document.getElementById('volumeValue').textContent = e.target.value + '%';
    });

    const bgVolumeSlider = document.getElementById('bgVolumeSlider');
    bgVolumeSlider.addEventListener('input', (e) => {
        state.backgroundVolume = e.target.value / 100;
        document.getElementById('bgVolumeValue').textContent = e.target.value + '%';
        updateBackgroundVolume();
    });

    // 声音设置
    document.getElementById('tickSound').addEventListener('change', (e) => {
        state.enableTick = e.target.checked;
    });

    document.getElementById('voiceGuide').addEventListener('change', (e) => {
        state.enableVoice = e.target.checked;
    });

    document.getElementById('backgroundMusicToggle').addEventListener('change', (e) => {
        state.enableBackgroundMusic = e.target.checked;
        if (state.enableBackgroundMusic) {
            startBackgroundMusic();
        } else {
            stopBackgroundMusic();
        }
    });

    // 开始按钮
    document.getElementById('startBtn').addEventListener('click', startPractice);

    // 控制按钮
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('stopBtn').addEventListener('click', stopPractice);
    document.getElementById('restartBtn').addEventListener('click', restart);

    updateRoundsVisibility();
}

function updateRoundsVisibility() {
    const roundsControl = document.getElementById('roundsControl');
    // 两种模式都显示轮数控制
    roundsControl.style.display = 'block';
    updateRoundsDisplay();
}

function updateRoundsDisplay() {
    const roundsLabel = document.querySelector('.rounds-label');

    if (state.selectedProtocol === 'sleep') {
        roundsLabel.textContent = '呼吸循环次数';
        document.getElementById('roundsValue').textContent = state.sleepCycles;
        document.getElementById('decreaseRounds').disabled = state.sleepCycles <= 1;
        document.getElementById('increaseRounds').disabled = state.sleepCycles >= 20;
    } else {
        roundsLabel.textContent = '协议重复次数';
        document.getElementById('roundsValue').textContent = state.totalRounds;
        document.getElementById('decreaseRounds').disabled = state.totalRounds <= 1;
        document.getElementById('increaseRounds').disabled = state.totalRounds >= 10;
    }
}

// 请求屏幕保持唤醒
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('屏幕保持唤醒已启用');

            // 监听锁释放事件
            wakeLock.addEventListener('release', () => {
                console.log('屏幕唤醒锁已释放');
            });
        } else {
            console.log('此浏览器不支持 Wake Lock API');
        }
    } catch (err) {
        console.error('请求屏幕唤醒失败:', err);
    }
}

// 释放屏幕唤醒锁
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release().then(() => {
            wakeLock = null;
        });
    }
}

// 开始练习
async function startPractice() {
    // 请求屏幕保持唤醒
    requestWakeLock();

    // 初始化音频（移动端需要用户交互才能启用音频）
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // 恢复音频上下文（处理移动端自动播放限制）
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    await startBackgroundMusic();

    // 重置状态
    state.currentRound = 1;
    state.currentStep = 0;
    state.currentCycle = 1;
    state.currentPhase = 'prepare';
    state.phaseTimeLeft = 3;
    state.isPaused = false;

    // 切换界面
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('practiceScreen').classList.remove('hidden');

    updateUI();

    // 播报协议名称和第一个步骤名称，播报完成后再开始计时
    const protocol = protocols[state.selectedProtocol];
    if (state.enableVoice) {
        if (protocol.type === 'sequence') {
            // 先播报协议名称
            speak(protocol.name);
            // 延迟播报第一个步骤名称（3秒后）
            setTimeout(() => {
                speak(protocol.steps[0].name);
                // 再延迟3.5秒后开始计时（等步骤名称播完）
                setTimeout(() => {
                    startTimer();
                }, 3500);
            }, 3000);
        } else {
            speak(protocol.name);
            // 延迟2秒后开始计时
            setTimeout(() => {
                startTimer();
            }, 2000);
        }
    } else {
        // 没有语音时直接开始计时
        startTimer();
    }
}

// 计时器
function startTimer() {
    if (timer) clearInterval(timer);

    timer = setInterval(() => {
        if (state.isPaused) return;

        state.phaseTimeLeft--;

        if (state.phaseTimeLeft > 0) {
            // 播放节奏音
            if (state.enableTick && state.currentPhase !== 'prepare') {
                playTick();
            }
            updateUI();
        } else {
            // 进入下一阶段
            nextPhase();
        }
    }, 1000);
}

// 下一阶段
function nextPhase() {
    const protocol = protocols[state.selectedProtocol];

    if (state.currentPhase === 'prepare') {
        state.currentPhase = 'inhale';
        const pattern = getCurrentPattern();
        state.phaseTimeLeft = pattern[0];
        if (state.enableVoice) speak('吸气');
    } else if (state.currentPhase === 'inhale') {
        state.currentPhase = 'hold';
        const pattern = getCurrentPattern();
        state.phaseTimeLeft = pattern[1];
        if (state.enableVoice) speak('憋气');
    } else if (state.currentPhase === 'hold') {
        state.currentPhase = 'exhale';
        const pattern = getCurrentPattern();
        state.phaseTimeLeft = pattern[2];
        if (state.enableVoice) speak('呼气');
    } else if (state.currentPhase === 'exhale') {
        // 一个循环完成
        nextCycle();
    }

    updateUI();
}

// 下一个循环
function nextCycle() {
    const protocol = protocols[state.selectedProtocol];

    if (protocol.type === 'single') {
        state.currentCycle++;
        if (state.currentCycle > state.sleepCycles) {
            completePractice();
            return;
        }
        // 单一模式直接开始吸气
        state.currentPhase = 'inhale';
        const pattern = getCurrentPattern();
        state.phaseTimeLeft = pattern[0];
        if (state.enableVoice) speak('吸气');
        updateUI();
    } else {
        const currentStepData = protocol.steps[state.currentStep];
        state.currentCycle++;

        if (state.currentCycle > currentStepData.cycles) {
            // 当前步骤完成，进入下一步骤
            state.currentStep++;
            state.currentCycle = 1;

            if (state.currentStep >= protocol.steps.length) {
                // 一轮完成
                state.currentRound++;
                state.currentStep = 0;

                if (state.currentRound > state.totalRounds) {
                    completePractice();
                    return;
                }

                if (state.enableVoice) speak('第' + state.currentRound + '轮');
            }

            // 开始新步骤，暂停计时器，播报名称后再恢复
            if (timer) clearInterval(timer);

            const nextStep = protocol.steps[state.currentStep];
            if (state.enableVoice) {
                speak(nextStep.name);
                // 延迟开始吸气，给步骤名称播报留出时间（3.5秒足够播完）
                setTimeout(() => {
                    state.currentPhase = 'inhale';
                    const pattern = getCurrentPattern();
                    state.phaseTimeLeft = pattern[0];
                    speak('吸气');
                    updateUI();
                    startTimer(); // 重新启动计时器
                }, 3500);
            } else {
                // 没有语音时直接开始
                state.currentPhase = 'inhale';
                const pattern = getCurrentPattern();
                state.phaseTimeLeft = pattern[0];
                updateUI();
                startTimer(); // 重新启动计时器
            }
        } else {
            // 同一步骤内的循环，直接开始吸气
            state.currentPhase = 'inhale';
            const pattern = getCurrentPattern();
            state.phaseTimeLeft = pattern[0];
            if (state.enableVoice) speak('吸气');
            updateUI();
        }
    }
}

// 获取当前模式
function getCurrentPattern() {
    const protocol = protocols[state.selectedProtocol];
    if (protocol.type === 'single') {
        return protocol.pattern;
    } else {
        return protocol.steps[state.currentStep].pattern;
    }
}

// 更新UI
function updateUI() {
    const protocol = protocols[state.selectedProtocol];
    const breathCircle = document.getElementById('breathCircle');
    const phaseText = document.getElementById('phaseText');
    const countdown = document.getElementById('countdown');

    // 更新圆圈状态
    breathCircle.className = 'breath-circle ' + state.currentPhase;

    // 更新文字
    const phaseNames = {
        prepare: '准备',
        inhale: '吸气',
        hold: '憋气',
        exhale: '呼气'
    };
    phaseText.textContent = phaseNames[state.currentPhase] || '准备';
    countdown.textContent = state.phaseTimeLeft;

    // 更新进度信息
    if (protocol.type === 'single') {
        document.getElementById('progressInfo').textContent =
            `${protocol.name} - 循环 ${state.currentCycle}/${state.sleepCycles}`;
        document.getElementById('stepInfo').style.display = 'none';
    } else {
        document.getElementById('progressInfo').textContent =
            `${protocol.name} - 第 ${state.currentRound}/${state.totalRounds} 轮`;

        const stepData = protocol.steps[state.currentStep];
        const pattern = stepData.pattern.join('-');
        document.getElementById('stepInfo').style.display = 'block';
        document.querySelector('.step-name').textContent =
            `${stepData.name} (${pattern})`;
        document.getElementById('cycleCount').textContent =
            `${state.currentCycle}/${stepData.cycles}`;
    }
}

// 暂停/继续
function togglePause() {
    state.isPaused = !state.isPaused;
    document.getElementById('pauseBtn').textContent = state.isPaused ? '继续' : '暂停';
}

// 停止练习
function stopPractice() {
    if (timer) clearInterval(timer);
    releaseWakeLock(); // 释放屏幕唤醒锁
    stopBackgroundMusic();
    document.getElementById('practiceScreen').classList.add('hidden');
    document.getElementById('setupScreen').classList.remove('hidden');
}

// 完成练习
function completePractice() {
    if (timer) clearInterval(timer);
    releaseWakeLock(); // 释放屏幕唤醒锁
    stopBackgroundMusic();
    document.getElementById('practiceScreen').classList.add('hidden');
    document.getElementById('completionScreen').classList.remove('hidden');
    if (state.enableVoice) speak('练习完成');
    playCompletionSound();
}

// 重新开始
function restart() {
    document.getElementById('completionScreen').classList.add('hidden');
    document.getElementById('setupScreen').classList.remove('hidden');
}

// 播放节奏音
function playTick() {
    if (!audioContext) return;

    try {
        // 确保音频上下文处于运行状态
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(state.volume * 0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        console.log('播放节奏音失败:', e);
    }
}

// 播放完成音
function playCompletionSound() {
    if (!audioContext) return;

    try {
        // 确保音频上下文处于运行状态
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 523.25; // C5
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(state.volume * 0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('播放完成音失败:', e);
    }
}

// 背景音乐加载
async function loadBackgroundMusic() {
    if (!audioContext) return;
    if (backgroundBuffer) return backgroundBuffer;

    const response = await fetch(EMBEDDED_BACKGROUND_WAV);
    const arrayBuffer = await response.arrayBuffer();
    backgroundBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return backgroundBuffer;
}

// 开始播放背景音乐
async function startBackgroundMusic() {
    if (!state.enableBackgroundMusic) return;
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    if (!backgroundGainNode) {
        backgroundGainNode = audioContext.createGain();
        backgroundGainNode.gain.value = state.backgroundVolume;
        backgroundGainNode.connect(audioContext.destination);
    }

    await loadBackgroundMusic();

    stopBackgroundMusic();
    backgroundSource = audioContext.createBufferSource();
    backgroundSource.buffer = backgroundBuffer;
    backgroundSource.loop = true;
    backgroundSource.connect(backgroundGainNode);
    backgroundSource.start(0);
}

// 停止背景音乐
function stopBackgroundMusic() {
    if (backgroundSource) {
        try {
            backgroundSource.stop();
        } catch (e) {}
        backgroundSource.disconnect();
        backgroundSource = null;
    }
}

// 更新背景音乐音量
function updateBackgroundVolume() {
    if (backgroundGainNode && audioContext) {
        const now = audioContext.currentTime;
        backgroundGainNode.gain.cancelScheduledValues(now);
        backgroundGainNode.gain.setTargetAtTime(state.backgroundVolume, now, 0.05);
    }
}

// 语音播报时的背景音乐 ducking
function applyBackgroundDucking() {
    if (!backgroundGainNode || !audioContext) return;
    const now = audioContext.currentTime;
    backgroundGainNode.gain.cancelScheduledValues(now);
    backgroundGainNode.gain.setTargetAtTime(state.backgroundVolume * 0.4, now, 0.05);
}

function restoreBackgroundVolume() {
    if (!backgroundGainNode || !audioContext) return;
    const now = audioContext.currentTime;
    backgroundGainNode.gain.cancelScheduledValues(now);
    backgroundGainNode.gain.setTargetAtTime(state.backgroundVolume, now, 0.1);
}

// 语音合成
function speak(text) {
    if (!state.enableVoice) return;

    // 检查浏览器支持
    if (!('speechSynthesis' in window)) {
        console.log('浏览器不支持语音合成');
        return;
    }

    // 取消所有正在进行的语音
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.volume = state.volume;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    if (audioContext && backgroundGainNode && state.enableBackgroundMusic) {
        applyBackgroundDucking();
        utterance.addEventListener('end', restoreBackgroundVolume);
        utterance.addEventListener('error', restoreBackgroundVolume);
    }

    // 等待一小段时间再播放，确保音频系统就绪
    setTimeout(() => {
        speechSynthesis.speak(utterance);
    }, 100);
}

// 页面加载时初始化
window.addEventListener('DOMContentLoaded', init);

// 页面可见性变化时重新请求唤醒锁
document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

// 页面卸载时释放唤醒锁
window.addEventListener('beforeunload', () => {
    releaseWakeLock();
});
