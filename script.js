// script.js (HZ 사운드 품질 개선을 위한 전면 재검토 버전)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const i18n = window.i18next;
    const i18nextHttpBackend = window.i18nextHttpBackend;
    const i18nextBrowserLanguageDetector = window.i18nextBrowserLanguageDetector;

    // --- DOM 요소 가져오기 (이전과 동일) ---
    const goalSelect = document.getElementById('goal-select');
    const manualSettingsDiv = document.getElementById('manual-settings');
    const manualTypeSelect = document.getElementById('manual-type-select');
    const targetFreqLabel = document.getElementById('target-freq-label');
    const targetFreqInput = document.getElementById('target-freq-input');
    const baseToneGroup = document.getElementById('base-tone-group');
    const baseToneInput = document.getElementById('base-tone-input');
    const masterVolumeInput = document.getElementById('master-volume');
    const whiteNoiseToggle = document.getElementById('white-noise-toggle');
    const whiteNoiseVolumeInput = document.getElementById('white-noise-volume');
    const playPauseButton = document.getElementById('play-pause-button');
    const currentSoundInfo = document.getElementById('current-sound-info');
    const soundEffectInfo = document.getElementById('sound-effect-info');
    const scientificSourceDiv = document.getElementById('scientific-source');
    const tooltipTextSpan = scientificSourceDiv.querySelector('.tooltip-text');
    const langEnButton = document.getElementById('lang-en');
    const langKoButton = document.getElementById('lang-ko');
    const visualizerSection = document.querySelector('.visualizer-section');
    const visualizerCanvas = document.getElementById('audioVisualizer');
    let canvasCtx;
    let animationFrameId;
    let currentVisualizerFrequency = 0;
    let visualizerTime = 0;

    // --- 오디오 변수 및 프리셋 데이터 ---
    let audioCtx;
    let masterGain;
    let oscillatorLeft, oscillatorRight;
    let pannerLeft, pannerRight;
    let lowPassFilterLeft, lowPassFilterRight; // 필터 노드
    // let compressorNode; // 컴프레서 (선택적)

    let whiteNoiseNode, whiteNoiseGain;
    let isPlaying = false;

    // ★★★ 기본음 설정 변경: 낮은 주파수 바이노럴 비트에 적합하도록 기본값 조정 ★★★
    const DEFAULT_BINAURAL_BASE_TONE = 40; // 예: 델타, 세타파용 기본음 (30~60Hz 사이 추천)
    const DEFAULT_OTHER_BASE_TONE = 100; // 그 외 경우의 기본음 (기존 값 유지)

    const PRESETS_CONFIG = {
        manual: { categoryKey: "category_manual", typeKey: "preset.manual.type", effectKey: "preset.manual.effect", source: "" },
        // ★★★ 바이노럴 비트 프리셋의 baseTone을 낮춤 ★★★
        sleep_delta_3hz: { categoryKey: "category_brainwave_binaural", effectHz: 3, baseTone: DEFAULT_BINAURAL_BASE_TONE, typeKey: "preset.sleep_delta_3hz.type", effectKey: "preset.sleep_delta_3hz.effect", source: "frontiersin.org, choosemuse.com" },
        meditation_theta_6hz: { categoryKey: "category_brainwave_binaural", effectHz: 6, baseTone: DEFAULT_BINAURAL_BASE_TONE + 10, typeKey: "preset.meditation_theta_6hz.type", effectKey: "preset.meditation_theta_6hz.effect", source: "sleepfoundation.org, choosemuse.com" }, // 50Hz
        relax_alpha_10hz: { categoryKey: "category_brainwave_binaural", effectHz: 10, baseTone: 60, typeKey: "preset.relax_alpha_10hz.type", effectKey: "preset.relax_alpha_10hz.effect", source: "medicalnewstoday.com, choosemuse.com" }, // 알파파는 약간 높게
        focus_beta_15hz: { categoryKey: "category_brainwave_binaural", effectHz: 15, baseTone: 70, typeKey: "preset.focus_beta_15hz.type", effectKey: "preset.focus_beta_15hz.effect", source: "medicalnewstoday.com" },
        memory_beta_18hz: { categoryKey: "category_brainwave_binaural", effectHz: 18, baseTone: 75, typeKey: "preset.memory_beta_18hz.type", effectKey: "preset.memory_beta_18hz.effect", source: "medicalnewstoday.com" },
        peak_gamma_40hz: { categoryKey: "category_brainwave_binaural", effectHz: 40, baseTone: 80, typeKey: "preset.peak_gamma_40hz.type", effectKey: "preset.peak_gamma_40hz.effect", source: "choosemuse.com, news.mit.edu" },
        schumann_7_83hz: { categoryKey: "category_special_binaural", effectHz: 7.83, baseTone: DEFAULT_BINAURAL_BASE_TONE + 15, typeKey: "preset.schumann_7_83hz.type", effectKey: "preset.schumann_7_83hz.effect", source: "chiangmaiholistic.com" }, // 55Hz
        // 단일톤은 그대로 유지
        tuning_432hz: { categoryKey: "category_special_single_tone", singleHz: 432, typeKey: "preset.tuning_432hz.type", effectKey: "preset.tuning_432hz.effect", source: "pmc.ncbi.nlm.nih.gov (일부 연구)" },
        solfeggio_174hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 174, typeKey: "preset.solfeggio_174hz.type", effectKey: "preset.solfeggio_174hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_285hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 285, typeKey: "preset.solfeggio_285hz.type", effectKey: "preset.solfeggio_285hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_396hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 396, typeKey: "preset.solfeggio_396hz.type", effectKey: "preset.solfeggio_396hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_417hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 417, typeKey: "preset.solfeggio_417hz.type", effectKey: "preset.solfeggio_417hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_528hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 528, typeKey: "preset.solfeggio_528hz.type", effectKey: "preset.solfeggio_528hz.effect", source: "zenmix.io, scirp.org (일부 연구)" },
        solfeggio_639hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 639, typeKey: "preset.solfeggio_639hz.type", effectKey: "preset.solfeggio_639hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_741hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 741, typeKey: "preset.solfeggio_741hz.type", effectKey: "preset.solfeggio_741hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_852hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 852, typeKey: "preset.solfeggio_852hz.type", effectKey: "preset.solfeggio_852hz.effect", source: "zenmix.io (솔페지오 이론)" },
        solfeggio_963hz: { categoryKey: "category_solfeggio_single_tone", singleHz: 963, typeKey: "preset.solfeggio_963hz.type", effectKey: "preset.solfeggio_963hz.effect", source: "zenmix.io (솔페지오 이론)" },
    };

    function updateSliderTrackFill(sliderElement) { /* ... (이전과 동일) ... */ }
    async function initI18next() { /* ... (이전 "외국인 영어, 한국인 한국어 + 사용자 선택 유지" 버전 그대로 사용) ... */ }
    function setupVisualizer() { /* ... (이전과 동일) ... */ }
    function drawSimulatedWaveform() { /* ... (이전 시각화 함수 그대로 사용, 또는 필요시 미세조정) ... */ }
    function startVisualizer(frequency) { /* ... (이전과 동일) ... */ }
    function stopVisualizer() { /* ... (이전과 동일) ... */ }
    function updateAllTexts() { /* ... (이전과 동일) ... */ }
    function buildGoalSelectStructure() { /* ... (이전과 동일) ... */ }
    function updateGoalSelectTexts() { /* ... (이전과 동일) ... */ }
    function updateManualSettingsUI(type) { /* ... (이전과 동일) ... */ }


    // ===== 오디오 초기화 (필터, 패너 등 노드 생성) =====
    function initAudioNodes() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.error("Error resuming AudioContext:", e));
        }

        if (!masterGain) {
            masterGain = audioCtx.createGain();
            masterGain.gain.value = parseFloat(masterVolumeInput.value);
            masterGain.connect(audioCtx.destination);
        }

        // 패너 생성 (재생 시 마다 값 설정)
        if (!pannerLeft) pannerLeft = audioCtx.createStereoPanner();
        if (!pannerRight) pannerRight = audioCtx.createStereoPanner();

        // 저역 통과 필터 생성 (재생 시 마다 값 설정)
        if (!lowPassFilterLeft) {
            lowPassFilterLeft = audioCtx.createBiquadFilter();
            lowPassFilterLeft.type = "lowpass";
            lowPassFilterLeft.Q.value = 0.7071; // 일반적인 Q값
        }
        if (!lowPassFilterRight) {
            lowPassFilterRight = audioCtx.createBiquadFilter();
            lowPassFilterRight.type = "lowpass";
            lowPassFilterRight.Q.value = 0.7071;
        }

        // 컴프레서 (선택적, 매우 약하게 설정 또는 초기에는 제외)
        /*
        if (!compressorNode) {
            compressorNode = audioCtx.createDynamicsCompressor();
            // 약한 컴프레션 설정 (threshold, knee, ratio, attack, release 값 조절)
            compressorNode.threshold.value = -10; // 예시 값
            compressorNode.knee.value = 10;      // 예시 값
            compressorNode.ratio.value = 2;       // 예시 값 (2:1 압축)
            compressorNode.attack.value = 0.003;  // 빠른 어택
            compressorNode.release.value = 0.25; // 보통 릴리즈
            masterGain.disconnect(); // 기존 연결 해제
            masterGain.connect(compressorNode).connect(audioCtx.destination); // 컴프레서 거쳐서 최종 출력
        }
        */
    }


    // ===== 사운드 재생 함수 (대폭 수정) =====
    function playSound() {
        if (!audioCtx || audioCtx.state !== 'running') {
            initAudioNodes(); // 오디오 노드들 먼저 초기화
            if (!audioCtx || audioCtx.state !== 'running') {
                if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_audio_not_ready_retry');
                return;
            }
        }
        stopOscillators(); // 기존 오실레이터 정지

        // 페이드 아웃 후 새 소리 시작 (클릭 노이즈 방지)
        const now = audioCtx.currentTime;
        const fadeDuration = 0.01; // 10ms 페이드

        if (masterGain.gain.value > 0) { // 현재 소리가 나고 있었다면 페이드 아웃
             masterGain.gain.cancelScheduledValues(now);
             masterGain.gain.setValueAtTime(masterGain.gain.value, now);
             masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
        }

        // 페이드 아웃 시간 후 새 오실레이터 설정 및 페이드 인
        setTimeout(() => {
            let leftFreq, rightFreq, visualFreqToUse, baseToneToUse;
            const currentPresetKey = goalSelect.value;
            const preset = PRESETS_CONFIG[currentPresetKey];

            if (!preset) { /* ... (에러 처리 동일) ... */ return; }

            let displayInfoText, effectInfoKey, sourceInfo;
            let isBinaural = false;

            if (currentPresetKey === "manual") {
                const manualType = manualTypeSelect.value;
                const targetFreq = parseFloat(targetFreqInput.value);
                baseToneToUse = parseFloat(baseToneInput.value) || (manualType === "binaural" ? DEFAULT_BINAURAL_BASE_TONE : DEFAULT_OTHER_BASE_TONE);

                effectInfoKey = preset.effectKey; sourceInfo = preset.source;
                if (manualType === "binaural") {
                    isBinaural = true;
                    leftFreq = baseToneToUse;
                    rightFreq = baseToneToUse + targetFreq;
                    visualFreqToUse = baseToneToUse;
                    displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseToneToUse.toFixed(2) });
                } else { // single_tone
                    leftFreq = targetFreq;
                    rightFreq = targetFreq;
                    visualFreqToUse = targetFreq;
                    displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
                }
            } else { // 프리셋
                baseToneToUse = preset.baseTone || DEFAULT_OTHER_BASE_TONE; // 프리셋에 baseTone 없으면 기본값
                if (preset.effectHz !== undefined) { // 바이노럴 프리셋
                    isBinaural = true;
                    leftFreq = baseToneToUse;
                    rightFreq = baseToneToUse + preset.effectHz;
                    visualFreqToUse = baseToneToUse;
                } else if (preset.singleHz !== undefined) { // 단일톤 프리셋
                    leftFreq = preset.singleHz;
                    rightFreq = preset.singleHz;
                    visualFreqToUse = preset.singleHz;
                }
                displayInfoText = i18n.t(preset.typeKey);
                effectInfoKey = preset.effectKey;
                sourceInfo = preset.source;
            }

            if (isNaN(leftFreq) || isNaN(rightFreq) || leftFreq <= 0 || rightFreq <= 0 || isNaN(visualFreqToUse) || visualFreqToUse <=0 ) {
                /* ... (에러 처리 동일) ... */
                masterGain.gain.setValueAtTime(parseFloat(masterVolumeInput.value), audioCtx.currentTime); // 원래 볼륨 복구
                return;
            }

            oscillatorLeft = audioCtx.createOscillator();
            oscillatorLeft.type = 'sine';
            oscillatorLeft.frequency.setValueAtTime(leftFreq, audioCtx.currentTime);

            oscillatorRight = audioCtx.createOscillator();
            oscillatorRight.type = 'sine';
            oscillatorRight.frequency.setValueAtTime(rightFreq, audioCtx.currentTime);

            // 패너 값 설정 (약간 덜 극단적으로)
            pannerLeft.pan.setValueAtTime(isBinaural ? -0.9 : 0, audioCtx.currentTime); // 단일톤은 중앙
            pannerRight.pan.setValueAtTime(isBinaural ? 0.9 : 0, audioCtx.currentTime);

            // ★★★ 저역 통과 필터 주파수 설정 ★★★
            // 바이노럴 비트, 특히 낮은 기본음을 사용할 때 더 낮은 차단 주파수 적용
            // 단일톤은 해당 주파수에 따라 필터 조절 또는 비활성화
            let filterFreqLeft, filterFreqRight;
            if (isBinaural && baseToneToUse < 150) { // 낮은 기본음의 바이노럴
                filterFreqLeft = Math.max(baseToneToUse + 50, 100); // 기본음 + 여유, 최소 100Hz
                filterFreqRight = Math.max(baseToneToUse + preset.effectHz + 50, 100);
            } else if (!isBinaural && leftFreq < 500) { // 낮은 주파수의 단일톤
                 filterFreqLeft = filterFreqRight = Math.max(leftFreq + 100, 150);
            } else { // 그 외 (높은 주파수 단일톤 등) - 필터를 약하게 또는 높게 설정
                filterFreqLeft = filterFreqRight = 20000; // 거의 영향 없도록 (최대 가청 주파수)
            }
            lowPassFilterLeft.frequency.setValueAtTime(filterFreqLeft, audioCtx.currentTime);
            lowPassFilterRight.frequency.setValueAtTime(filterFreqRight, audioCtx.currentTime);


            // 연결: Oscillator -> Panner -> LowPassFilter -> MasterGain
            // (만약 컴프레서 사용 시: Oscillator -> Panner -> LowPassFilter -> Compressor -> MasterGain)
            oscillatorLeft.connect(pannerLeft).connect(lowPassFilterLeft).connect(masterGain);
            oscillatorRight.connect(pannerRight).connect(lowPassFilterRight).connect(masterGain);


            try {
                oscillatorLeft.start(audioCtx.currentTime);
                oscillatorRight.start(audioCtx.currentTime);

                // 새 소리 페이드 인
                const targetVolume = parseFloat(masterVolumeInput.value);
                masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
                masterGain.gain.setValueAtTime(0, audioCtx.currentTime); // 바로 0으로 시작
                masterGain.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + fadeDuration);

                isPlaying = true;
                if(playPauseButton && i18n && i18n.isInitialized) playPauseButton.textContent = i18n.t('button_pause');
                startVisualizer(visualFreqToUse);
            } catch (e) {
                console.error("Error starting new oscillators:", e);
                isPlaying = false;
                // ... (에러 시 UI 업데이트 동일) ...
                stopOscillators();
                stopVisualizer();
                masterGain.gain.setValueAtTime(parseFloat(masterVolumeInput.value), audioCtx.currentTime); // 원래 볼륨 복구
                return;
            }
            if (whiteNoiseToggle.checked) playWhiteNoise(); // 백색소음은 별도 처리
            if(displayInfoText) updateInfoDisplay(displayInfoText, effectInfoKey, sourceInfo);

        }, fadeDuration * 1000); // setTimeout은 밀리초 단위
    }

    // ===== 사운드 정지 함수 (페이드 아웃 적용) =====
    function stopSound() {
        if (!isPlaying) return;

        const now = audioCtx.currentTime;
        const fadeDuration = 0.015; // 15ms 페이드 아웃

        // 마스터 게인 페이드 아웃
        if (masterGain && masterGain.gain.value > 0) {
            masterGain.gain.cancelScheduledValues(now);
            masterGain.gain.setValueAtTime(masterGain.gain.value, now);
            masterGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
        }

        // 페이드 아웃 후 오실레이터 정지
        setTimeout(() => {
            stopOscillators();
            // masterGain.gain.value = parseFloat(masterVolumeInput.value); // 필요시 정지 후 볼륨 복구 (다음 재생을 위해)
                                                                     // 또는 playSound 시작 시 설정
        }, fadeDuration * 1000 + 5); // 약간의 여유 시간 후 정지

        stopWhiteNoise(); // 백색 소음은 즉시 정지
        isPlaying = false;
        if(playPauseButton && i18n && i18n.isInitialized) playPauseButton.textContent = i18n.t('button_play');
        if(goalSelect && i18n && i18n.isInitialized) updateInfoDisplayFromPreset(goalSelect.value);
        stopVisualizer();
    }


    function stopOscillators() {
        if (oscillatorLeft) {
            try { oscillatorLeft.stop(audioCtx.currentTime + 0.05); } catch (e) {} // 약간의 지연 후 정지
            oscillatorLeft.disconnect(); oscillatorLeft = null;
        }
        if (oscillatorRight) {
            try { oscillatorRight.stop(audioCtx.currentTime + 0.05); } catch (e) {}
            oscillatorRight.disconnect(); oscillatorRight = null;
        }
    }

    function playWhiteNoise() { /* ... (이전과 동일, 단 masterGain에 바로 연결) ... */ }
    function stopWhiteNoise() { /* ... (이전과 동일) ... */ }
    function updateInfoDisplay(currentSoundTextOrKey, effectKey, source) { /* ... (이전과 동일) ... */ }
    function updateInfoDisplayFromPreset(presetKey) { /* ... (이전과 동일) ... */ }
    function updateActiveLangButton() { /* ... (이전과 동일) ... */ }

    // --- 이벤트 리스너 ---
    if(playPauseButton) playPauseButton.addEventListener('click', () => {
        if (!audioCtx) initAudioNodes(); // 오디오 컨텍스트가 없으면 먼저 초기화
        if (isPlaying) {
            stopSound();
        } else {
            if (audioCtx && audioCtx.state === 'running') {
                playSound();
            } else if (currentSoundInfo && i18n && i18n.isInitialized) {
                currentSoundInfo.textContent = i18n.t('info_audio_activating');
                // initAudioNodes()를 여기서 한번 더 호출해볼 수 있음 (사용자 클릭 시 활성화 유도)
                initAudioNodes();
                setTimeout(() => { // 잠시 후 다시 재생 시도
                    if (audioCtx && audioCtx.state === 'running') playSound();
                }, 200);
            }
        }
    });
    // ... (나머지 이벤트 리스너들은 이전과 동일하게 유지) ...
    if(masterVolumeInput) { masterVolumeInput.addEventListener('input', (e) => { if (masterGain) masterGain.gain.linearRampToValueAtTime(parseFloat(e.target.value), audioCtx.currentTime + 0.01); updateSliderTrackFill(e.target); });} // 볼륨 변경 시 부드럽게
    if(whiteNoiseToggle) whiteNoiseToggle.addEventListener('change', (e) => { whiteNoiseVolumeInput.disabled = !e.target.checked; if (audioCtx && audioCtx.state === 'running') { if (e.target.checked && isPlaying) playWhiteNoise(); else stopWhiteNoise(); } });
    if(whiteNoiseVolumeInput) { whiteNoiseVolumeInput.addEventListener('input', (e) => { if (whiteNoiseGain) whiteNoiseGain.gain.value = parseFloat(e.target.value); updateSliderTrackFill(e.target); });}

    if(goalSelect) goalSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const preset = PRESETS_CONFIG[selectedValue];
        if (!preset) return;

        if (selectedValue === "manual") {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'block';
            if(manualTypeSelect) manualTypeSelect.value = "binaural";
            if(i18n && i18n.isInitialized) updateManualSettingsUI("binaural");
            if(targetFreqInput) targetFreqInput.value = 3; // 수동 바이노럴 기본 효과 3Hz
            if(baseToneInput) baseToneInput.value = DEFAULT_BINAURAL_BASE_TONE; // 수동 바이노럴 기본음
        } else {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'none';
            if (preset.effectHz !== undefined && targetFreqInput && baseToneInput) {
                targetFreqInput.value = preset.effectHz;
                baseToneInput.value = preset.baseTone || DEFAULT_BINAURAL_BASE_TONE;
            } else if (preset.singleHz !== undefined && targetFreqInput) {
                targetFreqInput.value = preset.singleHz;
            }
        }
        if (isPlaying) {
            if (audioCtx && audioCtx.state === 'running') playSound();
            else if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_setting_changed_play');
        } else {
            updateInfoDisplayFromPreset(selectedValue);
            stopVisualizer();
        }
    });

    if(manualTypeSelect) manualTypeSelect.addEventListener('change', (e) => {
        if(i18n && i18n.isInitialized) updateManualSettingsUI(e.target.value);
        // 수동 모드에서 타입 변경 시 기본음 자동 조정 (선택적)
        if (goalSelect && goalSelect.value === "manual" && baseToneInput) {
             baseToneInput.value = e.target.value === "binaural" ? DEFAULT_BINAURAL_BASE_TONE : DEFAULT_OTHER_BASE_TONE;
        }

        if (goalSelect && goalSelect.value === "manual") {
            if (isPlaying) {
                playSound();
            } else {
                updateInfoDisplayFromPreset("manual");
                stopVisualizer();
            }
        }
    });

    [targetFreqInput, baseToneInput].forEach(input => {
        if(input) input.addEventListener('input', () => {
            if (goalSelect && goalSelect.value === "manual") {
                if (isPlaying) {
                    playSound();
                } else {
                    updateInfoDisplayFromPreset("manual");
                    stopVisualizer();
                }
            }
        });
    });

    if(langEnButton) langEnButton.addEventListener('click', () => { if(i18n) i18n.changeLanguage('en'); });
    if(langKoButton) langKoButton.addEventListener('click', () => { if(i18n) i18n.changeLanguage('ko'); });


    // --- 초기화 실행 ---
    initI18next().then(() => {
        initAudioNodes(); // 오디오 노드 초기 생성
        setupVisualizer();
        if(masterVolumeInput) updateSliderTrackFill(masterVolumeInput);
        if(whiteNoiseVolumeInput) updateSliderTrackFill(whiteNoiseVolumeInput);
        if(goalSelect) goalSelect.dispatchEvent(new Event('change'));
        console.log("HZMindCare App initialized successfully.");
    }).catch(err => {
        console.error("Critical error during app initialization:", err);
        // ... (에러 시 최소 UI 구성 동일) ...
    });
});
