// script.js
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    const i18n = window.i18next;
    const i18nextHttpBackend = window.i18nextHttpBackend;
    const i18nextBrowserLanguageDetector = window.i18nextBrowserLanguageDetector;

    // --- DOM 요소 가져오기 ---
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
    let currentVisualizerFrequency = 0; // 시각화에 사용될 현재 주파수
    let visualizerTime = 0; // 웨이브 애니메이션 시간 변수


    // --- 오디오 변수 및 프리셋 데이터 ---
    let audioCtx; let masterGain; let oscillatorLeft, oscillatorRight;
    let whiteNoiseNode, whiteNoiseGain; let isPlaying = false;
    const DEFAULT_BASE_TONE = 100;
    const PRESETS_CONFIG = {
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

    function updateSliderTrackFill(sliderElement) {
        if (!sliderElement) return;
        const value = parseFloat(sliderElement.value);
        const min = parseFloat(sliderElement.min);
        const max = parseFloat(sliderElement.max);
        const percentage = ((value - min) / (max - min)) * 100;
        sliderElement.style.background = `linear-gradient(to right, #bb86fc ${percentage}%, #444 ${percentage}%)`;
    }

    async function initI18next() {
        if (!i18n || !i18nextHttpBackend || !i18nextBrowserLanguageDetector) {
            console.error("i18next libraries not loaded! UI might not be localized.");
            buildGoalSelectStructure();
            updateAllTexts();
            return;
        }

        await i18n
            .use(i18nextHttpBackend)
            .use(i18nextBrowserLanguageDetector)
            .init({
                supportedLngs: ['ko', 'en'],
                fallbackLng: 'en',
                debug: false,
                detection: {
                    order: ['navigator', 'cookie', 'localStorage', 'querystring', 'htmlTag'],
                    caches: ['cookie', 'localStorage'],
                    lowerCaseLng: true,
                    load: 'languageOnly',
                },
                backend: {
                    loadPath: 'locales/{{lng}}/translation.json',
                },
                interpolation: {
                    escapeValue: false
                }
            });

        console.log("i18next initialized. Final language used by i18next:", i18n.language);
        document.documentElement.lang = i18n.language.split('-')[0];

        buildGoalSelectStructure();
        updateAllTexts();
        updateActiveLangButton();

        i18n.on('languageChanged', (lng) => {
            console.log("Language manually changed to:", lng);
            document.documentElement.lang = lng.split('-')[0];
            updateAllTexts();
            updateActiveLangButton();
        });
    }

    function setupVisualizer() {
        if (!visualizerCanvas) { console.error("Visualizer canvas not found!"); return; }
        canvasCtx = visualizerCanvas.getContext('2d');
        if (!canvasCtx) { console.error("Failed to get canvas context!"); return; }
        if (visualizerSection) visualizerSection.style.display = 'none';
    }

    // ===== 시각화 함수 (부드러운 곡선 스타일) =====
    function drawSimulatedWaveform() {
        if (!canvasCtx || !visualizerCanvas || !isPlaying) {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
            if (visualizerSection) visualizerSection.style.display = 'none';
            return;
        }
        if (visualizerSection) visualizerSection.style.display = 'block';

        animationFrameId = requestAnimationFrame(drawSimulatedWaveform);

        const canvasWidth = visualizerCanvas.width;
        const canvasHeight = visualizerCanvas.height;
        const centerY = canvasHeight / 2;

        let baseAmplitude = canvasHeight / 2.8;
        if (masterGain) { baseAmplitude *= masterGain.gain.value; }

        const envelopeFactor = 0.7 + ((Math.sin(visualizerTime * 0.08) + 1) / 2) * 0.3;
        const amplitude = baseAmplitude * envelopeFactor;

        canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = '#bb86fc';
        canvasCtx.beginPath();
        canvasCtx.moveTo(0, centerY);

        let waveLengthFactor;
        const freq = currentVisualizerFrequency;

        if (freq <= 0) {
            waveLengthFactor = canvasWidth / 2;
        } else if (freq < 5) {
            waveLengthFactor = canvasWidth / (freq * 0.25 + 0.5);
        } else if (freq < 20) {
            waveLengthFactor = canvasWidth / (freq * 0.4 + 1);
        } else if (freq < 100) {
            waveLengthFactor = canvasWidth / (freq * 0.7 + 3);
        } else if (freq < 300) {
            waveLengthFactor = canvasWidth / (freq * 0.9 + 15);
        } else {
            waveLengthFactor = Math.max(15, canvasWidth / (freq * 1.0 + 30));
        }
        waveLengthFactor = Math.max(15, Math.min(canvasWidth / 1.2, waveLengthFactor));

        visualizerTime += 0.04;

        for (let x = 0; x < canvasWidth; x++) {
            const y = centerY + amplitude * Math.sin((x / waveLengthFactor) * (Math.PI * 2) + visualizerTime);
            canvasCtx.lineTo(x, y);
        }
        canvasCtx.stroke();
    }
    // ===== 시각화 함수 끝 =====

    function startVisualizer(frequency) {
        currentVisualizerFrequency = frequency > 0 ? frequency : 1;
        console.log("Starting visualizer with frequency:", currentVisualizerFrequency);
        if (isPlaying && canvasCtx) {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            visualizerTime = 0;
            drawSimulatedWaveform();
        } else if (isPlaying && !canvasCtx) {
            console.warn("Canvas context not ready for visualizer.");
        }
    }

    function stopVisualizer() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (canvasCtx && visualizerCanvas) {
            canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
        }
        if (visualizerSection) {
            visualizerSection.style.display = 'none';
        }
        currentVisualizerFrequency = 0;
    }


    function updateAllTexts() {
        if (!i18n || !i18n.isInitialized) {
            console.warn("i18next not ready, cannot update texts.");
            return;
        }
        console.log("Updating all texts for language:", i18n.language);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (key && i18n.exists(key)) {
                const translation = i18n.t(key);
                if (el.tagName === 'TITLE') document.title = translation;
                else if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit') || el.tagName === 'BUTTON') el.textContent = translation;
                else if (el.tagName === 'SMALL' || el.tagName === 'P' || el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'LABEL' || el.tagName === 'SPAN') {
                     el.innerHTML = translation;
                }
                else el.textContent = translation;
            } else if (key) {
                 console.warn(`Translation key "${key}" not found for element:`, el);
            }
        });

        updateGoalSelectTexts();
        if(playPauseButton) playPauseButton.textContent = isPlaying ? i18n.t('button_pause') : i18n.t('button_play');
        if(manualTypeSelect) updateManualSettingsUI(manualTypeSelect.value);

        if (!isPlaying && goalSelect) {
            updateInfoDisplayFromPreset(goalSelect.value);
        } else if (isPlaying && goalSelect) {
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
            currentSoundInfo.textContent = i18n.t('info_waiting_selection');
            soundEffectInfo.textContent = '';
            if(scientificSourceDiv) scientificSourceDiv.style.display = 'none';
        }
    }

    function buildGoalSelectStructure() {
        if (!goalSelect || !PRESETS_CONFIG) { console.error("Cannot build goal select: missing element or PRESETS_CONFIG."); if(goalSelect) goalSelect.innerHTML = `<option value="">Error loading presets</option>`; return; }
        console.log("Building goal select structure...");
        goalSelect.innerHTML = '';
        const categories = {};
        for (const key in PRESETS_CONFIG) { const preset = PRESETS_CONFIG[key]; const categoryKey = preset.categoryKey; if (!categories[categoryKey]) { categories[categoryKey] = []; } categories[categoryKey].push({ key, preset }); }
        const categoryOrderKeys = ["category_manual", "category_brainwave_binaural", "category_solfeggio_single_tone", "category_special_binaural", "category_special_single_tone"];
        const sortedCategoryKeys = [...categoryOrderKeys, ...Object.keys(categories).filter(k => !categoryOrderKeys.includes(k))];
        sortedCategoryKeys.forEach(categoryKey => { if (categories[categoryKey]) { const optgroup = document.createElement('optgroup'); optgroup.setAttribute('data-i18n-label', categoryKey); categories[categoryKey].forEach(item => { const option = document.createElement('option'); option.value = item.key; option.setAttribute('data-i18n-text', item.preset.typeKey); optgroup.appendChild(option); }); goalSelect.appendChild(optgroup); } });
        goalSelect.value = "manual";
        console.log("Goal select structure built.");
    }

    function updateGoalSelectTexts() {
        if (!goalSelect || !i18n || !i18n.isInitialized) return;
        console.log("Updating goal select option texts...");
        Array.from(goalSelect.getElementsByTagName('optgroup')).forEach(optgroup => { const labelKey = optgroup.getAttribute('data-i18n-label'); if (labelKey && i18n.exists(labelKey)) optgroup.label = i18n.t(labelKey); });
        Array.from(goalSelect.options).forEach(option => { const textKey = option.getAttribute('data-i18n-text'); if (textKey && i18n.exists(textKey)) option.textContent = i18n.t(textKey); });
        console.log("Goal select texts updated.");
    }

    function updateManualSettingsUI(type) {
        if (!targetFreqLabel || !targetFreqInput || !baseToneGroup || !i18n || !i18n.isInitialized) return;
        const binauralLabelKey = targetFreqLabel.getAttribute('data-i18n-text-binaural') || 'label_target_freq_binaural';
        const singleToneLabelKey = targetFreqLabel.getAttribute('data-i18n-text-single') || 'label_target_freq_single_tone';
        const binauralPlaceholderKey = targetFreqLabel.getAttribute('data-i18n-placeholder-binaural') || 'placeholder_target_freq_binaural';
        const singleTonePlaceholderKey = targetFreqLabel.getAttribute('data-i18n-placeholder-single') || 'placeholder_target_freq_single_tone';

        if (type === "binaural") {
            targetFreqLabel.textContent = i18n.t(binauralLabelKey);
            if(i18n.exists(binauralPlaceholderKey)) targetFreqInput.placeholder = i18n.t(binauralPlaceholderKey); else targetFreqInput.placeholder = "e.g., 3";
            baseToneGroup.style.display = 'block';
        } else {
            targetFreqLabel.textContent = i18n.t(singleToneLabelKey);
            if(i18n.exists(singleTonePlaceholderKey)) targetFreqInput.placeholder = i18n.t(singleTonePlaceholderKey); else targetFreqInput.placeholder = "e.g., 432";
            baseToneGroup.style.display = 'none';
        }
    }

    function initAudio() { if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); masterGain = audioCtx.createGain(); masterGain.connect(audioCtx.destination); masterGain.gain.value = parseFloat(masterVolumeInput.value); } if (audioCtx.state === 'suspended') { audioCtx.resume().catch(e => console.error("Error resuming AudioContext:", e)); } }

    function playSound() {
        if (!audioCtx || audioCtx.state !== 'running') {
            initAudio();
            if (!audioCtx || audioCtx.state !== 'running') {
                 if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_audio_not_ready_retry');
                 return;
            }
        }
        stopOscillators();

        let leftFreq, rightFreq, visualFreqToUse;
        const currentPresetKey = goalSelect.value;
        const preset = PRESETS_CONFIG[currentPresetKey];
        if (!preset) { console.error("Selected preset not found:", currentPresetKey); if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_waiting_selection'); return; }

        let displayInfoText, effectInfoKey, sourceInfo;

        if (currentPresetKey === "manual") {
            const manualType = manualTypeSelect.value;
            const targetFreq = parseFloat(targetFreqInput.value);
            const baseToneVal = parseFloat(baseToneInput.value) || DEFAULT_BASE_TONE;
            effectInfoKey = preset.effectKey; sourceInfo = preset.source;
            if (manualType === "binaural") {
                leftFreq = baseToneVal; rightFreq = baseToneVal + targetFreq;
                visualFreqToUse = baseToneVal;
                displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseToneVal.toFixed(2) });
            } else {
                leftFreq = targetFreq; rightFreq = targetFreq;
                visualFreqToUse = targetFreq;
                displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
            }
        } else {
            if (preset.effectHz !== undefined) {
                leftFreq = preset.baseTone; rightFreq = preset.baseTone + preset.effectHz;
                visualFreqToUse = preset.baseTone;
            } else if (preset.singleHz !== undefined) {
                leftFreq = preset.singleHz; rightFreq = preset.singleHz;
                visualFreqToUse = preset.singleHz;
            }
            displayInfoText = i18n.t(preset.typeKey);
            effectInfoKey = preset.effectKey;
            sourceInfo = preset.source;
        }

        if (isNaN(leftFreq) || isNaN(rightFreq) || leftFreq <= 0 || rightFreq <= 0 || isNaN(visualFreqToUse) || visualFreqToUse <=0 ) {
            if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_invalid_frequency');
            stopVisualizer();
            return;
        }

        oscillatorLeft = audioCtx.createOscillator(); oscillatorLeft.type = 'sine'; oscillatorLeft.frequency.value = leftFreq;
        oscillatorRight = audioCtx.createOscillator(); oscillatorRight.type = 'sine'; oscillatorRight.frequency.value = rightFreq;
        const pannerLeft = audioCtx.createStereoPanner(); pannerLeft.pan.value = -1;
        const pannerRight = audioCtx.createStereoPanner(); pannerRight.pan.value = 1;
        oscillatorLeft.connect(pannerLeft).connect(masterGain);
        oscillatorRight.connect(pannerRight).connect(masterGain);

        try {
            oscillatorLeft.start(audioCtx.currentTime);
            oscillatorRight.start(audioCtx.currentTime);
            isPlaying = true;
            if(playPauseButton && i18n && i18n.isInitialized) playPauseButton.textContent = i18n.t('button_pause');
            startVisualizer(visualFreqToUse);
        } catch (e) {
            console.error("Error starting oscillators:", e);
            isPlaying = false;
            if(playPauseButton && i18n && i18n.isInitialized) playPauseButton.textContent = i18n.t('button_play');
            if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_audio_error_starting');
            stopOscillators();
            stopVisualizer();
            return;
        }
        if (whiteNoiseToggle.checked) playWhiteNoise();
        if(displayInfoText) updateInfoDisplay(displayInfoText, effectInfoKey, sourceInfo);
    }

    function stopSound() {
        stopOscillators();
        stopWhiteNoise();
        isPlaying = false;
        if(playPauseButton && i18n && i18n.isInitialized) playPauseButton.textContent = i18n.t('button_play');
        if(goalSelect && i18n && i18n.isInitialized) updateInfoDisplayFromPreset(goalSelect.value);
        stopVisualizer();
    }

    function stopOscillators() { if (oscillatorLeft) { try { oscillatorLeft.stop(audioCtx.currentTime); } catch (e) {} oscillatorLeft.disconnect(); oscillatorLeft = null; } if (oscillatorRight) { try { oscillatorRight.stop(audioCtx.currentTime); } catch (e) {} oscillatorRight.disconnect(); oscillatorRight = null; } }
    function playWhiteNoise() { if (!audioCtx || audioCtx.state !== 'running') return; if (whiteNoiseNode) { try { whiteNoiseNode.stop(); } catch(e) {} whiteNoiseNode.disconnect(); } const bufferSize = audioCtx.sampleRate * 2; const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); const output = noiseBuffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { output[i] = Math.random() * 2 - 1; } whiteNoiseNode = audioCtx.createBufferSource(); whiteNoiseNode.buffer = noiseBuffer; whiteNoiseNode.loop = true; if (!whiteNoiseGain) whiteNoiseGain = audioCtx.createGain(); whiteNoiseGain.gain.value = parseFloat(whiteNoiseVolumeInput.value); whiteNoiseNode.connect(whiteNoiseGain).connect(masterGain); try { whiteNoiseNode.start(audioCtx.currentTime); } catch (e) { console.error("Error starting white noise:", e); } }
    function stopWhiteNoise() { if (whiteNoiseNode) { try { whiteNoiseNode.stop(audioCtx.currentTime); } catch(e) {} whiteNoiseNode.disconnect(); whiteNoiseNode = null; } }

    function updateInfoDisplay(currentSoundTextOrKey, effectKey, source) {
        if (!currentSoundInfo || !soundEffectInfo || !scientificSourceDiv || !tooltipTextSpan || !i18n || !i18n.isInitialized) return;

        let finalCurrentSoundText = currentSoundTextOrKey;
        if (typeof currentSoundTextOrKey === 'string' && currentSoundTextOrKey.includes('.') && i18n.exists(currentSoundTextOrKey)) {
            finalCurrentSoundText = (isPlaying ? i18n.t('info_playing_prefix') + " " : "") + i18n.t(currentSoundTextOrKey);
        } else if (typeof currentSoundTextOrKey === 'string' && (currentSoundTextOrKey.startsWith(i18n.t('info_manual_binaural_format',{targetFreq:'',baseTone:''}).substring(0,5)) || currentSoundTextOrKey.startsWith(i18n.t('info_manual_single_tone_format',{targetFreq:''}).substring(0,5)) )) {
            if (isPlaying) {
                 finalCurrentSoundText = i18n.t('info_playing_prefix') + " " + currentSoundTextOrKey;
            } else {
                finalCurrentSoundText = currentSoundTextOrKey;
            }
        } else if (typeof currentSoundTextOrKey === 'string') {
             if (isPlaying && !currentSoundTextOrKey.startsWith(i18n.t('info_playing_prefix'))) {
                finalCurrentSoundText = i18n.t('info_playing_prefix') + " " + currentSoundTextOrKey;
             } else if (!isPlaying && currentSoundTextOrKey.startsWith(i18n.t('info_playing_prefix'))) {
                finalCurrentSoundText = currentSoundTextOrKey.substring(i18n.t('info_playing_prefix').length).trim();
             }
        }


        currentSoundInfo.textContent = finalCurrentSoundText;
        soundEffectInfo.textContent = i18n.t('info_effect_prefix') + " " + (effectKey && i18n.exists(effectKey) ? i18n.t(effectKey) : i18n.t('info_no_effect'));

        if (source && source.trim() !== "") {
            tooltipTextSpan.textContent = i18n.t('tooltip_source_prefix') + " " + source;
            scientificSourceDiv.style.display = 'inline-block';
        } else {
            scientificSourceDiv.style.display = 'none';
        }
    }

    function updateInfoDisplayFromPreset(presetKey) {
        if (!PRESETS_CONFIG || !i18n || !i18n.isInitialized) return;
        const preset = PRESETS_CONFIG[presetKey];
        if (!preset) {
            if(currentSoundInfo) currentSoundInfo.textContent = i18n.t('info_waiting_selection');
            if(soundEffectInfo) soundEffectInfo.textContent = '';
            if(scientificSourceDiv) scientificSourceDiv.style.display = 'none';
            return;
        }
        let displayInfoText;
        if (presetKey === "manual") {
            const manualType = manualTypeSelect.value;
            const targetFreq = parseFloat(targetFreqInput.value);
            const baseTone = parseFloat(baseToneInput.value) || DEFAULT_BASE_TONE;
            if (manualType === "binaural") {
                displayInfoText = i18n.t('info_manual_binaural_format', { targetFreq: targetFreq.toFixed(2), baseTone: baseTone.toFixed(2) });
            } else {
                displayInfoText = i18n.t('info_manual_single_tone_format', { targetFreq: targetFreq.toFixed(2) });
            }
        } else {
            displayInfoText = preset.typeKey; // 키 자체를 전달 (updateInfoDisplay에서 t() 호출)
        }
        updateInfoDisplay(displayInfoText, preset.effectKey, preset.source);
    }

    function updateActiveLangButton() {
        if (!langEnButton || !langKoButton || !i18n || !i18n.isInitialized) return;
        const currentLang = i18n.language.startsWith('ko') ? 'ko' : (i18n.language.startsWith('en') ? 'en' : 'en');
        langEnButton.classList.toggle('active', currentLang === 'en');
        langKoButton.classList.toggle('active', currentLang === 'ko');
    }

    // --- 이벤트 리스너 ---
    if(playPauseButton) playPauseButton.addEventListener('click', () => { initAudio(); if (isPlaying) stopSound(); else if (audioCtx && audioCtx.state === 'running') playSound(); else if(currentSoundInfo && i18n && i18n.isInitialized) currentSoundInfo.textContent = i18n.t('info_audio_activating'); });
    if(masterVolumeInput) { masterVolumeInput.addEventListener('input', (e) => { if (masterGain) masterGain.gain.value = parseFloat(e.target.value); updateSliderTrackFill(e.target); });}
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
            if(targetFreqInput) targetFreqInput.value = 3;
            if(baseToneInput) baseToneInput.value = DEFAULT_BASE_TONE;
        } else {
            if(manualSettingsDiv) manualSettingsDiv.style.display = 'none';
            if (preset.effectHz !== undefined && targetFreqInput && baseToneInput) {
                targetFreqInput.value = preset.effectHz;
                baseToneInput.value = preset.baseTone;
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
        setupVisualizer();
        if(masterVolumeInput) updateSliderTrackFill(masterVolumeInput);
        if(whiteNoiseVolumeInput) updateSliderTrackFill(whiteNoiseVolumeInput);
        if(goalSelect) goalSelect.dispatchEvent(new Event('change'));
        console.log("HZMindCare App initialized successfully.");
    }).catch(err => {
        console.error("Critical error during app initialization:", err);
        setupVisualizer();
        buildGoalSelectStructure();
        updateGoalSelectTexts();
        if(masterVolumeInput) updateSliderTrackFill(masterVolumeInput);
        if(whiteNoiseVolumeInput) updateSliderTrackFill(whiteNoiseVolumeInput);
        if(goalSelect) goalSelect.dispatchEvent(new Event('change'));
        if(currentSoundInfo) currentSoundInfo.textContent = "Error initializing app. Please refresh.";
    });
});