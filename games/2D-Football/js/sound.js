// Sound manager
console.log('[ProStrker] sound.js loaded');
const SoundManager = {
    sounds: {},
    musicEnabled: true,
    sfxEnabled: true,
    isMusicPlaying: false,
    currentMusic: null,
    initialized: false,
    crowdPlaying: false,

    init() {
        if (this.initialized) return;
        this.initialized = true;

        const files = {
            menuMusic: 'sounds/Game music.mp3',
            crowd: 'sounds/When game is in play crowd sound.mp3',
            victory: 'sounds/Victory music.mp3',
            defeat: 'sounds/Defeat music.mp3',
            kick: 'sounds/kick sound.mp3',
            goalCheer: 'sounds/Goal scored cheering.mp3',
            goalNet: 'sounds/Goal strike the net sound.mp3',
            whistleStart: 'sounds/Referee whistle game starting.mp3',
            whistleStop: 'sounds/Referee whistle at halftime or end of match.mp3',
            menuClick: 'sounds/Cinematic click sound.mp3',
            confirm: 'sounds/confirm selection sound.mp3',
        };

        const extToMime = (p) => {
            if (p.match(/\.mp3(\?|$)/i)) return 'audio/mpeg';
            if (p.match(/\.wav(\?|$)/i)) return 'audio/wav';
            if (p.match(/\.ogg(\?|$)/i)) return 'audio/ogg';
            return '';
        };

        for (let [name, path] of Object.entries(files)) {
            try {
                const audio = new Audio();
                audio.preload = 'auto';
                const mime = extToMime(path);
                // If browser can't play the mime type, skip adding to pool
                if (mime && typeof audio.canPlayType === 'function' && audio.canPlayType(mime) === '') {
                    // do not log repeatedly - use debug
                    console.debug(`[ProStrker] audio not supported by browser: ${path}`);
                    continue;
                }
                audio.src = path;
                if (name === 'menuMusic' || name === 'crowd' || name === 'victory' || name === 'defeat') {
                    audio.loop = true;
                }
                this.sounds[name] = audio;
                console.log(`✅ Loaded: ${name} from ${path}`);
            } catch (e) {
                console.debug(`[ProStrker] could not create Audio for ${name}:`, e);
            }
        }

        if (this.sounds.menuMusic) this.sounds.menuMusic.volume = 0.7;
        if (this.sounds.crowd) this.sounds.crowd.volume = 0.35;
        if (this.sounds.victory) this.sounds.victory.volume = 0.7;
        if (this.sounds.defeat) this.sounds.defeat.volume = 0.7;

        this.updateMusicForState(currentState);
    },

    playMusic(name) {
        if (!this.musicEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;

        if (this.currentMusic && this.currentMusic !== sound) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
        }

        if (sound.paused || sound.currentTime === 0) {
            if (name === 'crowd') sound.volume = 0.35;
            else if (name === 'menuMusic' || name === 'victory' || name === 'defeat') sound.volume = 0.7;
            sound.play().catch(e => console.debug('Music play blocked:', e));
            this.currentMusic = sound;
            this.isMusicPlaying = true;
            this.crowdPlaying = (name === 'crowd');
        }
    },

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.isMusicPlaying = false;
        }
        this.crowdPlaying = false;
    },

    playSFX(name, volume = 0.6) {
        if (!this.sfxEnabled) return;
        const sound = this.sounds[name];
        if (!sound) return;
        try {
            const clone = sound.cloneNode();
            clone.volume = volume;
            clone.play().catch(e => console.debug('SFX play blocked:', e));
        } catch (e) {
            if (sound.paused) {
                sound.volume = volume; sound.currentTime = 0; sound.play().catch(e => {});
            }
        }
    },

    playGoalSounds() {
        this.playSFX('goalCheer', 0.7);
        this.playSFX('goalNet', 0.6);
        this.stopCrowd();
    },

    stopCrowd() {
        if (this.sounds.crowd) {
            this.sounds.crowd.pause();
            this.sounds.crowd.currentTime = 0;
            this.crowdPlaying = false;
        }
    },

    resumeCrowd() {
        if (this.musicEnabled && this.sounds.crowd && !this.crowdPlaying) {
            this.sounds.crowd.volume = 0.35;
            this.sounds.crowd.play().catch(e => console.debug('Crowd resume blocked:', e));
            this.crowdPlaying = true;
            this.currentMusic = this.sounds.crowd;
            this.isMusicPlaying = true;
        }
    },

    toggleMusic() { this.musicEnabled = !this.musicEnabled; if (!this.musicEnabled) this.stopMusic(); else this.updateMusicForState(currentState); return this.musicEnabled; },
    toggleSFX() { this.sfxEnabled = !this.sfxEnabled; return this.sfxEnabled; },

    updateMusicForState(state) {
        if (!this.musicEnabled) { this.stopMusic(); return; }
        switch (state) {
            case 'MENU': case 'SETTINGS': case 'INSTRUCTIONS': case 'DIFFICULTY_SELECT':
                this.playMusic('menuMusic'); break;
            case 'PLAY':
                if (!this.crowdPlaying && currentState !== 'GOAL_SCORED') this.playMusic('crowd');
                break;
            case 'MATCH_END':
                const isVSComputer = gameMode === 'pve';
                const winner = lastScorer || '';
                if (isVSComputer) {
                    if (winner.includes('RED')) this.playMusic('victory'); else this.playMusic('defeat');
                } else this.playMusic('victory');
                break;
            default: this.stopMusic();
        }
    }
};

// Do not auto-init sounds to avoid autoplay and missing-file errors before user interaction.
// SoundManager will initialize on first user interaction via `initSoundOnInteraction()` handlers below.
// setTimeout(() => { SoundManager.init(); }, 100);

function initSoundOnInteraction() {
    if (!SoundManager.initialized) SoundManager.init();
    SoundManager.updateMusicForState(currentState);
}

document.addEventListener('click', initSoundOnInteraction);
document.addEventListener('keydown', initSoundOnInteraction);
document.addEventListener('touchstart', initSoundOnInteraction);
