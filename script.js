// script.js (UI 표시 문제 해결을 위한 최종 점검 및 수정 버전)
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed (script.js:3)");

    const i18n = window.i18next;
    const i18nextHttpBackend = window.i18nextHttpBackend;
    const i18nextBrowserLanguageDetector = window.i18nextBrowserLanguageDetector;

    // --- DOM 요소 가져오기 ---
    // (이전과 동일하게 모든 DOM 요소들을 여기에 선언해주세요)
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
    const tooltipTextSpan = scientificSourceDiv && scientificSourceDiv.querySelector('.tooltip-text'); // null 체크 추가
    const langEnButton = document.getElementById('lang-en');
    const langKoButton = document.getElementById('lang-ko');
    const visualizerSection = document.querySelector('.visualizer-section');
    const visualizerCanvas = document.getElementById('audioVisualizer');
    let canvasCtx;
    let animationFrameId;
    let currentVisualizerFrequency = 0;
    let visualizerTime = 0;

    // --- 오디오 변수 및 프리셋 데이터 ---
    let audioCtx; let masterGain; let oscillatorLeft, oscillatorRight;
    let whiteNoiseNode, whiteNoiseGain; let isPlaying = false;
    const DEFAULT_BASE_TONE = 100;
    const PRESETS_CONFIG = { /* ... (이전 답변의 PRESETS_CONFIG 내용 전체) ... */
        manual: { categoryKey: "category_manual", typeKey: "preset.manual.type", effectKey: "preset.manual.effect", source: "" },
        sleep_delta_3hz: { categoryKey: "category_brainwave_binaural", effectHz: 3, baseTone: 90, typeKey: "preset.sleep_delta_3hz.type", effectKey: "preset.sleep_delta_3hz.effect", source: "frontiersin.org, choosemuse.com" },
        meditation_theta_6hz: { categoryKey: "category_brainwave_binaural", effectHz: 6, baseTone: 100, typeKey: "preset.meditation_theta_6hz.type", effectKey: "preset.meditation_theta_6hz.effect", source: "sleepfoundation.org, choosemuse.com" },
        relax_alpha_10hz: { categoryKey: "category_brainwave_binaural", effectHz: 10, baseTone: 100, typeKey: "preset.relax_alpha_10hz.type", effectKey: "preset.relax_alpha_10hz.effect", source: "medicalnewstoday.com, choosemuse.com" },
        focus_beta_15hz: { categoryKey: "category_brainwave_binaural", effectHz: 15, baseTone: 120, typeKey: "preset.focus_beta_15hz.type", effectKey: "preset.focus_beta_15hz.effect", source: "medicalnewstoday.com" },
        memory_beta_18hz: { categoryKey: "category_brainwave_binaural", effectHz: 18, baseTone: 120, typeKey: "preset.memory_beta_18hz.type", effectKey: "preset.memory_beta_18hz.effect", source: "medicalnewstoday.com" },
        peak_gamma_40hz: { categoryKey: "category_brainwave_binaural", effectHz: 40, baseTone: 150, typeKey: "preset.peak_gamma_40hz.type", effectKey: "preset.peak_gamma_40hz.effect", source: "choosemuse.com, news.mit.edu" },
        schumann_7_83hz: { categoryKey: "category_special_binaural", effectHz: 7.83, baseTone: 90, typeKey: "preset.schumann_7_83hz.type", effectKey: "preset.schumann_7_83hz.effect", source: "chiangmaiholistic.com" },
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

    async function initI18next() {
        // i18next 라이브러리 로드 확인
        if (typeof window.i18next === 'undefined' ||
            typeof window.i18nextHttpBackend === 'undefined' ||
            typeof window.i18nextBrowserLanguageDetector === 'undefined') {
            console.error("One or more i18next libraries are not loaded. Localization will not work.");
            // 라이브러리 없이 UI 구성 시도 (번역 불가)
            initializeUI(false); // isI18nReady = false
            return;
        }

        try {
            await i18n
                .use(i18nextHttpBackend)
                .use(i18nextBrowserLanguageDetector)
                .init({
                    supportedLngs: ['ko', 'en'],
                    fallbackLng: 'en', // 기본 영어
                    debug: true,
                    detection: {
                        order: ['cookie', 'localStorage', 'navigator', 'htmlTag', 'querystring'],
                        caches: ['cookie', 'localStorage'],
                        lookupCookie: 'i18next_lng',
                        lookupLocalStorage: 'i18nextLng',
                        lowerCaseLng: true,
                        load: 'languageOnly'
                    },
                    backend: {
                        loadPath: 'locales/{{lng}}/translation.json', // ★★★ 경로 확인! GitHub Pages에서는 상대 경로 주의 ★★★
                                                                    // 만약 프로젝트가 github.io/repo-name/ 이런 식이면,
                                                                    // loadPath: './locales/{{lng}}/translation.json' 또는
                                                                    // 절대 경로를 사용해야 할 수도 있습니다.
                                                                    // 지금은 루트 기준 상대 경로로 가정.
                    },
                    interpolation: {
                        escapeValue: false
                    }
                });

            console.log("i18next initialized. Final language used by i18next:", i18n.language, "(script.js:98)");
            initializeUI(true); // isI18nReady = true

            i18n.on('languageChanged', (lng) => {
                console.log("Language manually changed to:", lng, "(script.js:106)");
                document.documentElement.lang = lng.split('-')[0];
                updateAllTexts(); // UI 텍스트 전체 업데이트
                updateActiveLangButton();
            });

        } catch (error) {
            console.error("Error initializing i18next:", error);
            initializeUI(false); // i18next 초기화 실패 시에도 UI 구성 시도
        }
    }

    // UI 초기화 및 업데이트를 위한 통합 함수
    function initializeUI(isI18nReady) {
        if (isI18nReady) {
            document.documentElement.lang = i18n.language.split('-')[0];
        }
        buildGoalSelectStructure(); // i18n 준비 여부와 관계없이 구조는 만듦
        updateAllTexts();           // i18n 준비됐으면 번역, 아니면 기본 텍스트
        updateActiveLangButton();   // i18n 준비 여부에 따라 버튼 상태 업데이트

        // 나머지 UI 초기 설정 (i18n과 직접 관련 없는 부분)
        setupVisualizer();
        if(masterVolumeInput) updateSliderTrackFill(masterVolumeInput);
        if(whiteNoiseVolumeInput) updateSliderTrackFill(whiteNoiseVolumeInput);
        if(goalSelect) goalSelect.dispatchEvent(new Event('change')); // 초기 정보 표시
    }


    function setupVisualizer() { /* ... (이전과 동일) ... */ }
    function drawSimulatedWaveform() { /* ... (가장 최근 시각화 함수 그대로 사용) ... */ }
    function startVisualizer(frequency) { /* ... (이전과 동일) ... */ }
    function stopVisualizer() { /* ... (이전과 동일) ... */ }

    function updateAllTexts() {
        console.log("Updating all texts for language:", i18n && i18n.isInitialized ? i18n.language : "N/A", "(script.js:220)");
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key) {
                let translation = `[${key}]`; // 기본적으로 키 값을 보여줌 (번역 실패 대비)
                if (i18n && i18n.isInitialized && i18n.exists(key)) {
                    translation = i18n.t(key);
                } else if (i18n && i18n.isInitialized) {
                     console.warn(`Translation key "${key}" not found for language "${i18n.language}". Element:`, el);
                }

                if (el.tagName === 'TITLE') document.title = translation;
                else if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') || el.tagName === 'BUTTON') el.textContent = translation;
                else if (el.tagName === 'SMALL' || el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'LABEL' || el.tagName === 'SPAN') {
                     el.innerHTML = translation; // HTML 태그 포함 가능성
                }
                else el.textContent = translation;
            }
        });

        updateGoalSelectTexts();
        if(playPauseButton && i18n && i18n.isInitialized) playPauseButton.textContent = isPlaying ? i18n.t('button_pause') : i18n.t('button_play');
        else if(playPauseButton) playPauseButton.textContent = isPlaying ? "[button_pause]" : "[button_play]"; // 번역 안될 시

        if(manualTypeSelect && i18n && i18n.isInitialized) updateManualSettingsUI(manualTypeSelect.value);
        else if(manualTypeSelect) updateManualSettingsUI(manualTypeSelect.value); // 번역 안돼도 UI는 변경 시도

        // 현재 재생 정보 업데이트
        if (!isPlaying && goalSelect) {
            updateInfoDisplayFromPreset(goalSelect.value);
        } else if (isPlaying && goalSelect && i18n && i18n.isInitialized) {
            // ... (이전과 동일한 재생 중 정보 업데이트 로직, i18n.t 사용)
            const currentPresetKey = goalSelect.value;
            const preset = PRESETS_CONFIG[currentPresetKey];
            let displayInfoText, effectInfoKey, sourceInfo;
             if (currentPresetKey === "manual") {
                const manualType = manualTypeSelect.value;
                const targetFreq = parseFloat(targetFreqInput.value);
                const baseTone = parseFloat(baseToneInput.value) || DEFAULT_BASE_TONE;
                effectInfoKey = PRESETS_CONFIG.manual.effectKey;
                sourceInfo = PRESETS_CONFIG.manual.source;
                if (manualType === "binaural") {
                    displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseTone.toFixed(2) });
                } else {
                    displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
                }
            } else if (preset) {
                displayInfoText = i18n.t(preset.typeKey);
                effectInfoKey = preset.effectKey;
                sourceInfo = preset.source;
            } else {
                displayInfoText = i18n.t('info_waiting_selection');
            }
            if (displayInfoText) updateInfoDisplay(displayInfoText, effectInfoKey, sourceInfo);

        } else if (!isPlaying && currentSoundInfo) {
            currentSoundInfo.textContent = (i18n && i18n.isInitialized) ? i18n.t('info_waiting_selection') : "[info_waiting_selection]";
            if (soundEffectInfo) soundEffectInfo.textContent = '';
            if(scientificSourceDiv) scientificSourceDiv.style.display = 'none';
        }
    }

    function buildGoalSelectStructure() {
        console.log("Building goal select structure...", "(script.js:275)");
        if (!goalSelect) { console.error("goalSelect element not found!"); return; }
        if (!PRESETS_CONFIG || Object.keys(PRESETS_CONFIG).length === 0) {
            console.error("PRESETS_CONFIG is not defined or empty!");
            goalSelect.innerHTML = `<option value="">Error: Presets not loaded</option>`;
            return;
        }

        goalSelect.innerHTML = ''; // 기존 옵션 초기화
        const categories = {};
        for (const key in PRESETS_CONFIG) {
            const preset = PRESETS_CONFIG[key];
            if (!preset || !preset.categoryKey || !preset.typeKey) {
                console.warn("Invalid preset object in PRESETS_CONFIG:", key, preset);
                continue;
            }
            const categoryKey = preset.categoryKey;
            if (!categories[categoryKey]) {
                categories[categoryKey] = [];
            }
            categories[categoryKey].push({ key, preset });
        }

        const categoryOrderKeys = ["category_manual", "category_brainwave_binaural", "category_solfeggio_single_tone", "category_special_binaural", "category_special_single_tone"];
        const sortedCategoryKeys = [...categoryOrderKeys, ...Object.keys(categories).filter(k => !categoryOrderKeys.includes(k))];

        sortedCategoryKeys.forEach(categoryKey => {
            if (categories[categoryKey] && categories[categoryKey].length > 0) {
                const optgroup = document.createElement('optgroup');
                // optgroup 레이블은 updateGoalSelectTexts에서 번역
                optgroup.setAttribute('data-i18n-label', categoryKey);
                optgroup.label = (i18n && i18n.isInitialized && i18n.exists(categoryKey)) ? i18n.t(categoryKey) : `[${categoryKey}]`;


                categories[categoryKey].forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.key;
                    // option 텍스트는 updateGoalSelectTexts에서 번역
                    option.setAttribute('data-i18n-text', item.preset.typeKey);
                    option.textContent = (i18n && i18n.isInitialized && i18n.exists(item.preset.typeKey)) ? i18n.t(item.preset.typeKey) : `[${item.preset.typeKey}]`;
                    optgroup.appendChild(option);
                });
                goalSelect.appendChild(optgroup);
            }
        });
        goalSelect.value = "manual"; // 기본 선택
        console.log("Goal select structure built.", "(script.js:283)");
    }

    function updateGoalSelectTexts() {
        console.log("Updating goal select option texts...", "(script.js:288)");
        if (!goalSelect || !(i18n && i18n.isInitialized)) {
             // i18next 준비 안됐으면 이미 buildGoalSelectStructure에서 기본 텍스트 설정됨
            return;
        }
        Array.from(goalSelect.getElementsByTagName('optgroup')).forEach(optgroup => {
            const labelKey = optgroup.getAttribute('data-i18n-label');
            if (labelKey && i18n.exists(labelKey)) optgroup.label = i18n.t(labelKey);
        });
        Array.from(goalSelect.options).forEach(option => {
            const textKey = option.getAttribute('data-i18n-text');
            if (textKey && i18n.exists(textKey)) option.textContent = i18n.t(textKey);
        });
        console.log("Goal select texts updated.", "(script.js:291)");
    }

    function updateManualSettingsUI(type) { /* ... (이전과 동일, 단 i18n.exists 및 i18n.t 사용 전에 i18n 준비됐는지 체크 강화) ... */ }
    function initAudioNodes() { /* ... (이전 답변의 initAudioNodes 함수 그대로 사용) ... */ } // AudioContext 생성 및 노드 초기화
    function playSound() { /* ... (이전 답변의 사운드 품질 개선 버전 playSound 함수 그대로 사용) ... */ }
    function stopSound() { /* ... (이전 답변의 사운드 품질 개선 버전 stopSound 함수 그대로 사용) ... */ }
    function stopOscillators() { /* ... (이전과 동일) ... */ }
    function playWhiteNoise() { /* ... (이전과 동일) ... */ }
    function stopWhiteNoise() { /* ... (이전과 동일) ... */ }
    function updateInfoDisplay(currentSoundTextOrKey, effectKey, source) { /* ... (이전과 동일, 단 i18n 준비됐는지 체크 강화) ... */ }
    function updateInfoDisplayFromPreset(presetKey) { /* ... (이전과 동일, 단 i18n 준비됐는지 체크 강화) ... */ }
    function updateActiveLangButton() { /* ... (이전과 동일, 단 i18n 준비됐는지 체크 강화) ... */ }


    // --- 이벤트 리스너 ---
    if (playPauseButton) {
        playPauseButton.addEventListener('click', () => {
            if (!audioCtx || audioCtx.state === 'suspended') {
                console.log("AudioContext not ready or suspended, attempting to resume/initialize...");
                initAudioNodes(); // AudioContext 생성 또는 resume 시도
                // AudioContext는 사용자 제스처 후 활성화되므로, 바로 재생이 안 될 수 있음
                // 잠시 후 상태를 보고 다시 시도하거나, 사용자에게 버튼을 다시 누르도록 안내할 수 있음
                if (audioCtx && audioCtx.state === 'running') {
                     console.log("AudioContext is now running.");
                } else {
                    console.warn("AudioContext could not be started. Please click again or check browser permissions.");
                    if (currentSoundInfo) currentSoundInfo.textContent = (i18n && i18n.isInitialized) ? i18n.t('info_audio_activating') : "[info_audio_activating]";
                    return; // 바로 재생하지 않고 반환
                }
            }

            if (isPlaying) {
                stopSound();
            } else {
                playSound();
            }
        });
    }
    // ... (나머지 이벤트 리스너들은 이전과 동일하게 유지) ...
    if(masterVolumeInput) { masterVolumeInput.addEventListener('input', (e) => { if (masterGain) masterGain.gain.linearRampToValueAtTime(parseFloat(e.target.value), audioCtx.currentTime + 0.01); updateSliderTrackFill(e.target); });}
    if(whiteNoiseToggle) whiteNoiseToggle.addEventListener('change', (e) => { whiteNoiseVolumeInput.disabled = !e.target.checked; if (audioCtx && audioCtx.state === 'running') { if (e.target.checked && isPlaying) playWhiteNoise(); else stopWhiteNoise(); } });
    if(whiteNoiseVolumeInput) { whiteNoiseVolumeInput.addEventListener('input', (e) => { if (whiteNoiseGain) whiteNoiseGain.gain.value = parseFloat(e.target.value); updateSliderTrackFill(e.target); });}

    if(goalSelect) goalSelect.addEventListener('change', (e) => {
        const selectedValue = e.target.value;
        const preset = PRESETS_CONFIG[selectedValue];
        if (!preset) return;

        if (selectedValue === "manual") {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'block';
            if(manualTypeSelect) manualTypeSelect.value = "binaural";
            if(i18n && i18n.isInitialized) updateManualSettingsUI("binaural"); else updateManualSettingsUI("binaural");
            if(targetFreqInput) targetFreqInput.value = 3;
            if(baseToneInput) baseToneInput.value = DEFAULT_BASE_TONE; // 또는 적절한 바이노럴용 기본음
        } else {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'none';
            if (preset.effectHz !== undefined && targetFreqInput && baseToneInput) {
                targetFreqInput.value = preset.effectHz;
                baseToneInput.value = preset.baseTone || DEFAULT_BASE_TONE;
            } else if (preset.singleHz !== undefined && targetFreqInput) {
                targetFreqInput.value = preset.singleHz;
            }
        }
        if (isPlaying) {
            if (audioCtx && audioCtx.state === 'running') playSound();
            else if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_setting_changed_play');
            else if(currentSoundInfo) currentSoundInfo.textContent = "[info_setting_changed_play]";
        } else {
            updateInfoDisplayFromPreset(selectedValue);
            stopVisualizer();
        }
    });

    if(manualTypeSelect) manualTypeSelect.addEventListener('change', (e) => {
        if(i18n && i18n.isInitialized) updateManualSettingsUI(e.target.value); else updateManualSettingsUI(e.target.value);
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

    if(langEnButton) langEnButton.addEventListener('click', () => { if(i18n && i18n.isInitialized) i18n.changeLanguage('en'); });
    if(langKoButton) langKoButton.addEventListener('click', () => { if(i18n && i18n.isInitialized) i18n.changeLanguage('ko'); });


    // --- 초기화 실행 ---
    initI18next().then(() => {
        // initI18next 내부에서 initializeUI가 호출되므로, 여기서는 특별히 할 일 없음
        // 단, initI18next가 실패했을 경우를 대비한 처리는 initI18next 내부 또는 catch 블록에서.
        console.log("HZMindCare App initialized successfully (or with i18n issues). (script.js:406)");
    }).catch(err => {
        console.error("Critical error during app initialization promise:", err);
        // i18next 초기화 약속이 reject된 경우 (거의 발생 안 함, initI18next 내부에서 에러 처리)
        initializeUI(false); // 최후의 UI 구성 시도
        if(currentSoundInfo) currentSoundInfo.textContent = "Error initializing app. Please refresh.";
    });
});
