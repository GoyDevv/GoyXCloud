import { BxLogger } from "@/utils/bx-logger";
import { Toast } from "@/utils/toast";
import { NativeMkbHandler } from "./native-mkb-handler";
import { generateVirtualControllerMapping } from "@/utils/gamepad";

export type TouchKbmButtonMode = 'hold' | 'toggle';
export type TouchKbmCurveMode = 'linear' | 'dynamic';
export type TouchKbmInputProtocol = 'native-mkb' | 'hybrid-gamepad';

export interface TouchKbmButtonConfig {
    id: string;
    label: string;
    subLabel?: string;
    code: string;
    xPct: number;
    yPct: number;
    size: number;
    opacity: number;
    mode: TouchKbmButtonMode;
    swipeAim: boolean;
    shape?: 'circle' | 'pill' | 'stick';
    color?: string;
}

export interface TouchKbmProfile {
    id: string;
    name: string;
    updatedAt: number;
    enabled: boolean;
    protocol: TouchKbmInputProtocol;
    sensX: number;
    sensY: number;
    adsMultiplier: number;
    curve: TouchKbmCurveMode;
    touchpadStartXPct: number;
    showTouchpadZone: boolean;
    hapticFeedback: boolean;
    globalOpacity: number;
    buttons: TouchKbmButtonConfig[];
}

export interface TouchKbmStorageData {
    version: number;
    activeProfileId: string;
    profiles: Record<string, TouchKbmProfile>;
}

const STORAGE_KEY_LOCAL = 'BetterXcloud.TouchKbm.Forever.v1';
const IDB_NAME = 'BetterXcloudForeverKbmDB';
const IDB_STORE = 'touch_kbm_profiles';

const KEY_CODE_MAP: Record<string, { key: string; keyCode: number; location?: number }> = {
    Escape: { key: 'Escape', keyCode: 27 },
    F1: { key: 'F1', keyCode: 112 },
    F2: { key: 'F2', keyCode: 113 },
    F3: { key: 'F3', keyCode: 114 },
    F4: { key: 'F4', keyCode: 115 },
    F5: { key: 'F5', keyCode: 116 },
    F6: { key: 'F6', keyCode: 117 },
    F7: { key: 'F7', keyCode: 118 },
    F8: { key: 'F8', keyCode: 119 },
    F9: { key: 'F9', keyCode: 120 },
    F10: { key: 'F10', keyCode: 121 },
    F11: { key: 'F11', keyCode: 122 },
    F12: { key: 'F12', keyCode: 123 },
    Backquote: { key: '`', keyCode: 192 },
    Digit1: { key: '1', keyCode: 49 },
    Digit2: { key: '2', keyCode: 50 },
    Digit3: { key: '3', keyCode: 51 },
    Digit4: { key: '4', keyCode: 52 },
    Digit5: { key: '5', keyCode: 53 },
    Digit6: { key: '6', keyCode: 54 },
    Digit7: { key: '7', keyCode: 55 },
    Digit8: { key: '8', keyCode: 56 },
    Digit9: { key: '9', keyCode: 57 },
    Digit0: { key: '0', keyCode: 48 },
    Minus: { key: '-', keyCode: 189 },
    Equal: { key: '=', keyCode: 187 },
    Backspace: { key: 'Backspace', keyCode: 8 },
    Tab: { key: 'Tab', keyCode: 9 },
    KeyQ: { key: 'q', keyCode: 81 },
    KeyW: { key: 'w', keyCode: 87 },
    KeyE: { key: 'e', keyCode: 69 },
    KeyR: { key: 'r', keyCode: 82 },
    KeyT: { key: 't', keyCode: 84 },
    KeyY: { key: 'y', keyCode: 89 },
    KeyU: { key: 'u', keyCode: 85 },
    KeyI: { key: 'i', keyCode: 73 },
    KeyO: { key: 'o', keyCode: 79 },
    KeyP: { key: 'p', keyCode: 80 },
    BracketLeft: { key: '[', keyCode: 219 },
    BracketRight: { key: ']', keyCode: 221 },
    Backslash: { key: '\\', keyCode: 220 },
    CapsLock: { key: 'CapsLock', keyCode: 20 },
    KeyA: { key: 'a', keyCode: 65 },
    KeyS: { key: 's', keyCode: 83 },
    KeyD: { key: 'd', keyCode: 68 },
    KeyF: { key: 'f', keyCode: 70 },
    KeyG: { key: 'g', keyCode: 71 },
    KeyH: { key: 'h', keyCode: 72 },
    KeyJ: { key: 'j', keyCode: 74 },
    KeyK: { key: 'k', keyCode: 75 },
    KeyL: { key: 'l', keyCode: 76 },
    Semicolon: { key: ';', keyCode: 186 },
    Quote: { key: "'", keyCode: 222 },
    Enter: { key: 'Enter', keyCode: 13 },
    ShiftLeft: { key: 'Shift', keyCode: 16, location: 1 },
    ShiftRight: { key: 'Shift', keyCode: 16, location: 2 },
    KeyZ: { key: 'z', keyCode: 90 },
    KeyX: { key: 'x', keyCode: 88 },
    KeyC: { key: 'c', keyCode: 67 },
    KeyV: { key: 'v', keyCode: 86 },
    KeyB: { key: 'b', keyCode: 66 },
    KeyN: { key: 'n', keyCode: 78 },
    KeyM: { key: 'm', keyCode: 77 },
    Comma: { key: ',', keyCode: 188 },
    Period: { key: '.', keyCode: 190 },
    Slash: { key: '/', keyCode: 191 },
    ControlLeft: { key: 'Control', keyCode: 17, location: 1 },
    ControlRight: { key: 'Control', keyCode: 17, location: 2 },
    AltLeft: { key: 'Alt', keyCode: 18, location: 1 },
    AltRight: { key: 'Alt', keyCode: 18, location: 2 },
    Space: { key: ' ', keyCode: 32 },
    ArrowUp: { key: 'ArrowUp', keyCode: 38 },
    ArrowDown: { key: 'ArrowDown', keyCode: 40 },
    ArrowLeft: { key: 'ArrowLeft', keyCode: 37 },
    ArrowRight: { key: 'ArrowRight', keyCode: 39 },
    Insert: { key: 'Insert', keyCode: 45 },
    Delete: { key: 'Delete', keyCode: 46 },
    Home: { key: 'Home', keyCode: 36 },
    End: { key: 'End', keyCode: 35 },
    PageUp: { key: 'PageUp', keyCode: 33 },
    PageDown: { key: 'PageDown', keyCode: 34 },
};

const MOUSE_BUTTON_BITMASK: Record<string, number> = {
    Mouse0: 1,  // Left Click (Fire)
    Mouse2: 2,  // Right Click (ADS)
    Mouse1: 4,  // Middle Click (Ping)
    Mouse3: 8,  // Side Back (Melee / Mount)
    Mouse4: 16, // Side Forward (Lethal)
};

export function createDefaultWarzoneClawProfile(): TouchKbmProfile {
    return {
        id: 'warzone-pro-claw',
        name: 'Warzone Pro (Claw + Direct Delta)',
        updatedAt: Date.now(),
        enabled: true,
        protocol: 'native-mkb',
        sensX: 2.5,
        sensY: 2.1,
        adsMultiplier: 0.68,
        curve: 'linear',
        touchpadStartXPct: 42,
        showTouchpadZone: true,
        hapticFeedback: true,
        globalOpacity: 0.88,
        buttons: [
            { id: 'btn_wasd_stick', label: 'WASD', subLabel: 'SPRINT RING', code: 'WASD_STICK', xPct: 16, yPct: 68, size: 138, opacity: 0.85, mode: 'hold', swipeAim: false, shape: 'stick', color: '#10b981' },
            { id: 'btn_lmb_claw', label: 'FIRE', subLabel: 'LMB', code: 'Mouse0', xPct: 15, yPct: 24, size: 88, opacity: 0.92, mode: 'hold', swipeAim: true, shape: 'circle', color: '#ef4444' },
            { id: 'btn_rmb_ads', label: 'ADS', subLabel: 'RMB', code: 'Mouse2', xPct: 86, yPct: 25, size: 84, opacity: 0.92, mode: 'hold', swipeAim: true, shape: 'circle', color: '#f59e0b' },
            { id: 'btn_lmb_right', label: 'FIRE', subLabel: 'LMB', code: 'Mouse0', xPct: 78, yPct: 66, size: 78, opacity: 0.88, mode: 'hold', swipeAim: true, shape: 'circle', color: '#ef4444' },
            { id: 'btn_space', label: 'JUMP', subLabel: 'SPACE', code: 'Space', xPct: 91, yPct: 54, size: 66, opacity: 0.85, mode: 'hold', swipeAim: true, shape: 'circle', color: '#3b82f6' },
            { id: 'btn_crouch', label: 'SLIDE', subLabel: 'C', code: 'KeyC', xPct: 89, yPct: 76, size: 66, opacity: 0.85, mode: 'hold', swipeAim: true, shape: 'circle', color: '#3b82f6' },
            { id: 'btn_prone', label: 'PRONE', subLabel: 'CTRL', code: 'ControlLeft', xPct: 77, yPct: 86, size: 58, opacity: 0.82, mode: 'hold', swipeAim: true, shape: 'circle', color: '#6366f1' },
            { id: 'btn_sprint', label: 'TAC SPRINT', subLabel: 'SHIFT', code: 'ShiftLeft', xPct: 16, yPct: 43, size: 58, opacity: 0.82, mode: 'toggle', swipeAim: false, shape: 'pill', color: '#10b981' },
            { id: 'btn_reload', label: 'RELOAD', subLabel: 'R', code: 'KeyR', xPct: 68, yPct: 52, size: 58, opacity: 0.85, mode: 'hold', swipeAim: true, shape: 'circle', color: '#06b6d4' },
            { id: 'btn_interact', label: 'USE/LOOT', subLabel: 'F', code: 'KeyF', xPct: 66, yPct: 70, size: 60, opacity: 0.85, mode: 'hold', swipeAim: true, shape: 'circle', color: '#06b6d4' },
            { id: 'btn_armor', label: 'PLATE', subLabel: 'G', code: 'KeyG', xPct: 56, yPct: 84, size: 62, opacity: 0.90, mode: 'hold', swipeAim: true, shape: 'circle', color: '#eab308' },
            { id: 'btn_ping', label: 'PING', subLabel: 'MMB', code: 'Mouse1', xPct: 72, yPct: 24, size: 54, opacity: 0.85, mode: 'hold', swipeAim: true, shape: 'circle', color: '#f97316' },
            { id: 'btn_tactical', label: 'TACTICAL', subLabel: 'Q', code: 'KeyQ', xPct: 30, yPct: 34, size: 54, opacity: 0.82, mode: 'hold', swipeAim: false, shape: 'circle', color: '#8b5cf6' },
            { id: 'btn_lethal', label: 'LETHAL', subLabel: 'E', code: 'KeyE', xPct: 62, yPct: 34, size: 54, opacity: 0.82, mode: 'hold', swipeAim: true, shape: 'circle', color: '#ec4899' },
            { id: 'btn_melee', label: 'MELEE', subLabel: 'V', code: 'KeyV', xPct: 74, yPct: 38, size: 52, opacity: 0.80, mode: 'hold', swipeAim: true, shape: 'circle', color: '#a855f7' },
            { id: 'btn_weap1', label: 'WEAP 1', subLabel: '1', code: 'Digit1', xPct: 38, yPct: 86, size: 56, opacity: 0.85, mode: 'hold', swipeAim: false, shape: 'pill', color: '#64748b' },
            { id: 'btn_weap2', label: 'WEAP 2', subLabel: '2', code: 'Digit2', xPct: 47, yPct: 86, size: 56, opacity: 0.85, mode: 'hold', swipeAim: false, shape: 'pill', color: '#64748b' },
            { id: 'btn_wheel_up', label: 'NEXT WPN', subLabel: 'MWHEEL+', code: 'WheelUp', xPct: 30, yPct: 86, size: 50, opacity: 0.80, mode: 'hold', swipeAim: false, shape: 'circle', color: '#475569' },
            { id: 'btn_killstreak', label: 'STREAK', subLabel: '3', code: 'Digit3', xPct: 30, yPct: 50, size: 50, opacity: 0.80, mode: 'hold', swipeAim: false, shape: 'circle', color: '#eab308' },
            { id: 'btn_fieldupg', label: 'FIELD UP', subLabel: 'X', code: 'KeyX', xPct: 30, yPct: 66, size: 50, opacity: 0.80, mode: 'hold', swipeAim: false, shape: 'circle', color: '#14b8a6' },
            { id: 'btn_map', label: 'MAP', subLabel: 'M', code: 'KeyM', xPct: 28, yPct: 14, size: 50, opacity: 0.80, mode: 'hold', swipeAim: false, shape: 'pill', color: '#475569' },
            { id: 'btn_tab', label: 'BAG', subLabel: 'TAB', code: 'Tab', xPct: 36, yPct: 14, size: 50, opacity: 0.80, mode: 'hold', swipeAim: false, shape: 'pill', color: '#475569' },
            { id: 'btn_esc', label: 'ESC', subLabel: 'MENU', code: 'Escape', xPct: 6, yPct: 12, size: 46, opacity: 0.78, mode: 'hold', swipeAim: false, shape: 'pill', color: '#475569' },
        ],
    };
}

export function createDiscreteWasdProfile(): TouchKbmProfile {
    const base = createDefaultWarzoneClawProfile();
    base.id = 'warzone-discrete-wasd';
    base.name = 'Warzone Discrete Keys (W/A/S/D + Direct Delta)';
    base.buttons = base.buttons.filter(b => b.id !== 'btn_wasd_stick');
    base.buttons.unshift(
        { id: 'btn_key_w', label: 'W', subLabel: 'FWD', code: 'KeyW', xPct: 16, yPct: 56, size: 64, opacity: 0.88, mode: 'hold', swipeAim: false, shape: 'circle', color: '#10b981' },
        { id: 'btn_key_a', label: 'A', subLabel: 'LEFT', code: 'KeyA', xPct: 8, yPct: 70, size: 64, opacity: 0.88, mode: 'hold', swipeAim: false, shape: 'circle', color: '#10b981' },
        { id: 'btn_key_s', label: 'S', subLabel: 'BACK', code: 'KeyS', xPct: 16, yPct: 74, size: 64, opacity: 0.88, mode: 'hold', swipeAim: false, shape: 'circle', color: '#10b981' },
        { id: 'btn_key_d', label: 'D', subLabel: 'RIGHT', code: 'KeyD', xPct: 24, yPct: 70, size: 64, opacity: 0.88, mode: 'hold', swipeAim: false, shape: 'circle', color: '#10b981' },
    );
    return base;
}

export class TouchKbmOverlay {
    private static instance: TouchKbmOverlay;
    public static getInstance(): TouchKbmOverlay {
        return TouchKbmOverlay.instance ?? (TouchKbmOverlay.instance = new TouchKbmOverlay());
    }

    private readonly LOG_TAG = 'TouchKbmOverlay';
    private storageData!: TouchKbmStorageData;
    private activeProfile!: TouchKbmProfile;

    private $root!: HTMLElement;
    private $touchpadZone!: HTMLElement;
    private $buttonsLayer!: HTMLElement;
    private $fullKeyboardLayer!: HTMLElement;
    private $toolbar!: HTMLElement;
    private $editorPanel!: HTMLElement;
    private $deltaReadout!: HTMLElement;

    private isEditMode = false;
    private isFullKeyboardOpen = false;
    private selectedButtonId: string | null = null;

    // Direct mouse delta state (zero latency)
    private lookTouchId: number | null = null;
    private lastLookX = 0;
    private lastLookY = 0;
    private remainderX = 0;
    private remainderY = 0;
    private hybridLookResetTimer: number | null = null;

    // Active pressed keys & mouse buttons
    private pressedKeys = new Set<string>();
    private toggledButtons = new Set<string>();
    private activeMouseButtonsMask = 0;
    private hybridGamepad = generateVirtualControllerMapping(0, { Dirty: true });

    // Multi-touch tracking per button
    private buttonTouchMap = new Map<number, { btn: TouchKbmButtonConfig; $btn: HTMLElement; lastX: number; lastY: number }>();

    private constructor() {
        this.loadForeverStorage();
        this.injectStyles();
        this.buildDom();
        this.renderProfile();
    }

    private loadForeverStorage() {
        let parsed: TouchKbmStorageData | null = null;

        try {
            const androidBridge = window.AppInterface as any;
            if (androidBridge && typeof androidBridge.loadTouchKbmConfig === 'function') {
                const rawAndroid = androidBridge.loadTouchKbmConfig();
                if (rawAndroid && rawAndroid.length > 10) {
                    parsed = JSON.parse(rawAndroid);
                    BxLogger.info(this.LOG_TAG, 'Loaded forever config from Android native storage');
                }
            }
        } catch (e) {
            BxLogger.warning(this.LOG_TAG, 'Android storage read fallback', e);
        }

        if (!parsed) {
            try {
                const rawLocal = window.localStorage.getItem(STORAGE_KEY_LOCAL);
                if (rawLocal) {
                    parsed = JSON.parse(rawLocal);
                }
            } catch (e) {}
        }

        if (!parsed || !parsed.profiles || Object.keys(parsed.profiles).length === 0) {
            const claw = createDefaultWarzoneClawProfile();
            const discrete = createDiscreteWasdProfile();
            parsed = {
                version: 1,
                activeProfileId: claw.id,
                profiles: {
                    [claw.id]: claw,
                    [discrete.id]: discrete,
                },
            };
        }

        this.storageData = parsed;
        this.activeProfile = this.storageData.profiles[this.storageData.activeProfileId]
            || Object.values(this.storageData.profiles)[0];
        if (!this.activeProfile.protocol) {
            this.activeProfile.protocol = 'native-mkb';
        }

        this.readFromIndexedDb().then(idbData => {
            if (idbData && idbData.profiles) {
                const idbActive = idbData.profiles[idbData.activeProfileId];
                if (idbActive && (!this.activeProfile || idbActive.updatedAt > this.activeProfile.updatedAt)) {
                    this.storageData = idbData;
                    this.activeProfile = idbActive;
                    if (!this.activeProfile.protocol) {
                        this.activeProfile.protocol = 'native-mkb';
                    }
                    this.saveForeverStorage(false);
                    this.renderProfile();
                }
            }
        }).catch(() => {});
    }

    public saveForeverStorage(showToast = true) {
        this.activeProfile.updatedAt = Date.now();
        this.storageData.profiles[this.activeProfile.id] = this.activeProfile;
        this.storageData.activeProfileId = this.activeProfile.id;

        const serialized = JSON.stringify(this.storageData);

        try {
            window.localStorage.setItem(STORAGE_KEY_LOCAL, serialized);
        } catch (e) {}

        this.writeToIndexedDb(this.storageData).catch(() => {});

        try {
            const androidBridge = window.AppInterface as any;
            if (androidBridge && typeof androidBridge.saveTouchKbmConfig === 'function') {
                androidBridge.saveTouchKbmConfig(serialized);
            }
        } catch (e) {}

        if (showToast) {
            Toast.show('Touch KBM Layout', 'Saved forever ♾️');
        }
    }

    private readFromIndexedDb(): Promise<TouchKbmStorageData | null> {
        return new Promise((resolve) => {
            try {
                if (!('indexedDB' in window)) {
                    resolve(null);
                    return;
                }
                const req = window.indexedDB.open(IDB_NAME, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(IDB_STORE)) {
                        db.createObjectStore(IDB_STORE);
                    }
                };
                req.onsuccess = () => {
                    const db = req.result;
                    const tx = db.transaction(IDB_STORE, 'readonly');
                    const store = tx.objectStore(IDB_STORE);
                    const getReq = store.get('forever_state');
                    getReq.onsuccess = () => resolve(getReq.result || null);
                    getReq.onerror = () => resolve(null);
                };
                req.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    }

    private writeToIndexedDb(data: TouchKbmStorageData): Promise<void> {
        return new Promise((resolve) => {
            try {
                if (!('indexedDB' in window)) {
                    resolve();
                    return;
                }
                const req = window.indexedDB.open(IDB_NAME, 1);
                req.onupgradeneeded = () => {
                    const db = req.result;
                    if (!db.objectStoreNames.contains(IDB_STORE)) {
                        db.createObjectStore(IDB_STORE);
                    }
                };
                req.onsuccess = () => {
                    const db = req.result;
                    const tx = db.transaction(IDB_STORE, 'readwrite');
                    const store = tx.objectStore(IDB_STORE);
                    store.put(data, 'forever_state');
                    tx.oncomplete = () => resolve();
                    tx.onerror = () => resolve();
                };
                req.onerror = () => resolve();
            } catch (e) {
                resolve();
            }
        });
    }

    private triggerHaptic(durationMs = 8) {
        if (!this.activeProfile.hapticFeedback) {
            return;
        }
        try {
            if (window.navigator.vibrate) {
                window.navigator.vibrate(durationMs);
            }
        } catch (e) {}
    }

    public sendQuickXboxButton(field: 'A' | 'B' | 'Menu' | 'Nexus') {
        this.triggerHaptic(12);
        const streamSession = window.BX_EXPOSED?.streamSession;
        const inputChannel = window.BX_EXPOSED?.inputChannel;
        const pressed = generateVirtualControllerMapping(0, {
            [field]: 1,
            Dirty: true,
        });
        const released = generateVirtualControllerMapping(0, {
            Dirty: true,
        });

        if (streamSession && typeof streamSession.onVirtualGamepadInput === 'function') {
            streamSession.onVirtualGamepadInput('systemMenu', performance.now(), [pressed]);
            window.setTimeout(() => {
                streamSession.onVirtualGamepadInput('systemMenu', performance.now(), [released]);
            }, 90);
        } else if (inputChannel && typeof inputChannel.sendGamepadInput === 'function') {
            inputChannel.sendGamepadInput(performance.now(), [pressed]);
            window.setTimeout(() => {
                inputChannel.sendGamepadInput(performance.now(), [released]);
            }, 90);
        }
        Toast.show('Xbox Controller Prompt', `Sent ${field} press`);
    }

    /**
     * Sends raw relative mouse delta (X, Y) directly into xCloud's inputChannel with zero delay.
     * Also supports 1-tap Hybrid Gamepad Stick mode if a game/menu requires controller right-stick input.
     */
    private sendDirectMouseDelta(rawDx: number, rawDy: number) {
        if (rawDx === 0 && rawDy === 0) {
            return;
        }

        const isAdsHeld = (this.activeMouseButtonsMask & 2) !== 0;
        const adsMult = isAdsHeld ? this.activeProfile.adsMultiplier : 1.0;

        let scaleX = this.activeProfile.sensX * adsMult;
        let scaleY = this.activeProfile.sensY * adsMult;

        if (this.activeProfile.curve === 'dynamic') {
            const speed = Math.hypot(rawDx, rawDy);
            const accel = 1.0 + Math.min(1.35, Math.max(0, (speed - 2.5) * 0.055));
            scaleX *= accel;
            scaleY *= accel;
        }

        if (this.activeProfile.protocol === 'hybrid-gamepad') {
            const rx = Math.max(-1, Math.min(1, (rawDx * scaleX) / 18.0));
            const ry = Math.max(-1, Math.min(1, -(rawDy * scaleY) / 18.0));
            this.hybridGamepad.RightThumbXAxis = rx;
            this.hybridGamepad.RightThumbYAxis = ry;
            this.hybridGamepad.Dirty = true;
            window.BX_EXPOSED?.inputChannel?.sendGamepadInput(performance.now(), [this.hybridGamepad]);

            if (this.hybridLookResetTimer) {
                window.clearTimeout(this.hybridLookResetTimer);
            }
            this.hybridLookResetTimer = window.setTimeout(() => {
                this.hybridGamepad.RightThumbXAxis = 0;
                this.hybridGamepad.RightThumbYAxis = 0;
                window.BX_EXPOSED?.inputChannel?.sendGamepadInput(performance.now(), [this.hybridGamepad]);
            }, 40);

            if (this.$deltaReadout) {
                this.$deltaReadout.textContent = `STICK Δ: ${rx.toFixed(2)}, ${ry.toFixed(2)}`;
            }
            return;
        }

        const totalX = rawDx * scaleX + this.remainderX;
        const totalY = rawDy * scaleY + this.remainderY;

        const intDx = Math.trunc(totalX);
        const intDy = Math.trunc(totalY);

        this.remainderX = totalX - intDx;
        this.remainderY = totalY - intDy;

        if (intDx === 0 && intDy === 0) {
            return;
        }

        const nativeHandler = NativeMkbHandler.getInstance();
        if (nativeHandler) {
            nativeHandler.handleMouseMove({
                movementX: intDx,
                movementY: intDy,
            });
        } else if (window.BX_EXPOSED?.inputChannel) {
            window.BX_EXPOSED.inputChannel.queueMouseInput({
                X: intDx,
                Y: intDy,
                Buttons: this.activeMouseButtonsMask,
                WheelX: 0,
                WheelY: 0,
                Type: 0,
            });
        }

        if (this.$deltaReadout) {
            this.$deltaReadout.textContent = `ΔX: ${intDx > 0 ? '+' : ''}${intDx} | ΔY: ${intDx !== 0 || intDy !== 0 ? (intDy > 0 ? '+' : '') + intDy : '0'}${isAdsHeld ? ' [ADS]' : ''}`;
        }
    }

    private setMouseButtonState(code: string, pressed: boolean) {
        const mask = MOUSE_BUTTON_BITMASK[code];
        if (!mask) {
            return;
        }

        if (pressed) {
            this.activeMouseButtonsMask |= mask;
        } else {
            this.activeMouseButtonsMask &= ~mask;
        }

        if (this.activeProfile.protocol === 'hybrid-gamepad') {
            if (code === 'Mouse0') this.hybridGamepad.RightTrigger = pressed ? 1 : 0;
            if (code === 'Mouse2') this.hybridGamepad.LeftTrigger = pressed ? 1 : 0;
            if (code === 'Mouse1') this.hybridGamepad.DPadUp = pressed ? 1 : 0;
            this.hybridGamepad.Dirty = true;
            window.BX_EXPOSED?.inputChannel?.sendGamepadInput(performance.now(), [this.hybridGamepad]);
            return;
        }

        const nativeHandler = NativeMkbHandler.getInstance();
        if (nativeHandler) {
            nativeHandler.handleMouseClick({
                pointerButton: mask,
                pressed,
            });
        } else if (window.BX_EXPOSED?.inputChannel) {
            window.BX_EXPOSED.inputChannel.queueMouseInput({
                X: 0,
                Y: 0,
                Buttons: this.activeMouseButtonsMask,
                WheelX: 0,
                WheelY: 0,
                Type: 0,
            });
        }
    }

    private triggerMouseWheel(code: string) {
        const vertical = code === 'WheelUp' ? -120 : 120;
        const nativeHandler = NativeMkbHandler.getInstance();
        if (nativeHandler) {
            nativeHandler.handleMouseWheel({ vertical, horizontal: 0 });
        } else if (window.BX_EXPOSED?.inputChannel) {
            window.BX_EXPOSED.inputChannel.queueMouseInput({
                X: 0,
                Y: 0,
                Buttons: this.activeMouseButtonsMask,
                WheelX: 0,
                WheelY: vertical,
                Type: 0,
            });
        }
    }

    private setKeyboardKeyState(code: string, pressed: boolean) {
        if (pressed) {
            if (this.pressedKeys.has(code)) {
                return;
            }
            this.pressedKeys.add(code);
        } else {
            if (!this.pressedKeys.has(code)) {
                return;
            }
            this.pressedKeys.delete(code);
        }

        if (this.activeProfile.protocol === 'hybrid-gamepad') {
            const v = pressed ? 1 : 0;
            if (code === 'KeyW' || code === 'KeyS') {
                this.hybridGamepad.LeftThumbYAxis = this.pressedKeys.has('KeyW') ? 1 : (this.pressedKeys.has('KeyS') ? -1 : 0);
            } else if (code === 'KeyA' || code === 'KeyD') {
                this.hybridGamepad.LeftThumbXAxis = this.pressedKeys.has('KeyD') ? 1 : (this.pressedKeys.has('KeyA') ? -1 : 0);
            } else if (code === 'ShiftLeft') {
                this.hybridGamepad.LeftThumb = v;
            } else if (code === 'Space') {
                this.hybridGamepad.A = v;
            } else if (code === 'KeyC' || code === 'ControlLeft') {
                this.hybridGamepad.B = v;
            } else if (code === 'KeyR' || code === 'KeyF') {
                this.hybridGamepad.X = v;
            } else if (code === 'Digit1' || code === 'Digit2' || code === 'KeyG') {
                this.hybridGamepad.Y = v;
            } else if (code === 'KeyQ') {
                this.hybridGamepad.LeftShoulder = v;
            } else if (code === 'KeyE') {
                this.hybridGamepad.RightShoulder = v;
            } else if (code === 'KeyV') {
                this.hybridGamepad.RightThumb = v;
            } else if (code === 'Tab' || code === 'KeyM') {
                this.hybridGamepad.View = v;
            } else if (code === 'Escape') {
                this.hybridGamepad.Menu = v;
            }
            this.hybridGamepad.Dirty = true;
            window.BX_EXPOSED?.inputChannel?.sendGamepadInput(performance.now(), [this.hybridGamepad]);
            return;
        }

        const keyMeta = KEY_CODE_MAP[code] || {
            key: code.replace('Key', '').toLowerCase(),
            keyCode: code.charCodeAt(code.length - 1),
            location: 0,
        };

        // If running inside our Android app, dispatch native Android KeyEvent first so WebView produces an isTrusted=true KeyboardEvent
        let handledByAndroid = false;
        try {
            const androidBridge = window.AppInterface as any;
            if (androidBridge && typeof androidBridge.onVirtualKey === 'function') {
                handledByAndroid = !!androidBridge.onVirtualKey(code, keyMeta.keyCode, pressed);
            }
        } catch (e) {}

        if (!handledByAndroid) {
            const eventType = pressed ? 'keydown' : 'keyup';
            const eventInit: KeyboardEventInit = {
                key: keyMeta.key,
                code: code,
                location: keyMeta.location || 0,
                bubbles: true,
                cancelable: true,
                composed: true,
                shiftKey: this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight'),
                ctrlKey: this.pressedKeys.has('ControlLeft') || this.pressedKeys.has('ControlRight'),
                altKey: this.pressedKeys.has('AltLeft') || this.pressedKeys.has('AltRight'),
            };

            const kbEvent = new KeyboardEvent(eventType, eventInit);
            Object.defineProperty(kbEvent, 'keyCode', { get: () => keyMeta.keyCode });
            Object.defineProperty(kbEvent, 'which', { get: () => keyMeta.keyCode });

            window.dispatchEvent(kbEvent);
            document.dispatchEvent(kbEvent);
            document.documentElement?.dispatchEvent(kbEvent);
            document.body?.dispatchEvent(kbEvent);
        }
    }

    private dispatchCodeState(code: string, pressed: boolean) {
        if (code in MOUSE_BUTTON_BITMASK) {
            this.setMouseButtonState(code, pressed);
        } else if (code === 'WheelUp' || code === 'WheelDown') {
            if (pressed) {
                this.triggerMouseWheel(code);
            }
        } else {
            this.setKeyboardKeyState(code, pressed);
        }
    }

    public releaseAllInputs() {
        for (const key of Array.from(this.pressedKeys)) {
            this.setKeyboardKeyState(key, false);
        }
        this.pressedKeys.clear();
        this.toggledButtons.clear();

        if (this.activeMouseButtonsMask !== 0) {
            this.activeMouseButtonsMask = 0;
            const nativeHandler = NativeMkbHandler.getInstance();
            if (nativeHandler) {
                nativeHandler.handleMouseMove({ movementX: 0, movementY: 0 });
            }
        }
    }

    private injectStyles() {
        if (document.getElementById('bx-touch-kbm-styles')) {
            return;
        }
        const style = document.createElement('style');
        style.id = 'bx-touch-kbm-styles';
        style.textContent = `
#bx-touch-kbm-root {
    position: fixed;
    inset: 0;
    z-index: 9990;
    pointer-events: none;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
}
.bx-tkbm-touchpad {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    pointer-events: auto;
    touch-action: none;
    transition: background 0.15s ease, border-color 0.15s ease;
}
.bx-tkbm-touchpad.bx-tkbm-zone-visible {
    border-left: 1px dashed rgba(16, 185, 129, 0.35);
    background: radial-gradient(circle at 65% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
}
.bx-tkbm-touchpad.bx-tkbm-edit-highlight {
    border-left: 2px dashed #10b981;
    background: rgba(16, 185, 129, 0.12);
}
.bx-tkbm-pad-badge {
    position: absolute;
    bottom: 10px;
    right: 14px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: rgba(16, 185, 129, 0.65);
    background: rgba(9, 13, 22, 0.65);
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid rgba(16, 185, 129, 0.25);
    pointer-events: none;
}
.bx-tkbm-btn {
    position: absolute;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    touch-action: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.68);
    border: 1.5px solid rgba(255, 255, 255, 0.32);
    color: #f8fafc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    transition: transform 0.05s ease, background 0.08s ease, border-color 0.08s ease;
}
.bx-tkbm-btn[data-shape="pill"] {
    border-radius: 14px;
    padding: 0 10px;
}
.bx-tkbm-btn.bx-tkbm-active {
    background: rgba(16, 185, 129, 0.55) !important;
    border-color: #34d399 !important;
    transform: translate(-50%, -50%) scale(0.94);
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.65);
}
.bx-tkbm-btn.bx-tkbm-selected {
    outline: 2.5px solid #38bdf8;
    outline-offset: 3px;
    z-index: 20;
}
.bx-tkbm-btn-label {
    font-size: 11px;
    font-weight: 800;
    line-height: 1.1;
    text-align: center;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0,0,0,0.9);
}
.bx-tkbm-btn-sub {
    font-size: 8.5px;
    font-weight: 600;
    opacity: 0.78;
    margin-top: 1px;
    pointer-events: none;
}
.bx-tkbm-stick-nub {
    width: 42%;
    height: 42%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(52, 211, 153, 0.9), rgba(16, 185, 129, 0.55));
    border: 2px solid #fff;
    pointer-events: none;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
}
.bx-tkbm-toolbar {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(9, 13, 22, 0.88);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    padding: 4px 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
    z-index: 30;
}
.bx-tkbm-tool-btn {
    background: rgba(30, 41, 59, 0.9);
    color: #e2e8f0;
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 999px;
    padding: 4px 9px;
    font-size: 10.5px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
}
.bx-tkbm-tool-btn.bx-active {
    background: #10b981;
    color: #052e16;
    border-color: #34d399;
}
.bx-tkbm-editor {
    position: absolute;
    top: 48px;
    left: 50%;
    transform: translateX(-50%);
    width: min(560px, 94vw);
    max-height: 78vh;
    overflow-y: auto;
    pointer-events: auto;
    background: rgba(15, 23, 42, 0.96);
    border: 1px solid rgba(56, 189, 248, 0.4);
    border-radius: 16px;
    padding: 14px;
    color: #f8fafc;
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.8);
    z-index: 40;
}
.bx-tkbm-editor.bx-gone, .bx-tkbm-fullkb.bx-gone, .bx-gone {
    display: none !important;
}
.bx-tkbm-editor-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
    margin-top: 8px;
}
.bx-tkbm-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 11px;
    color: #cbd5e1;
}
.bx-tkbm-field input, .bx-tkbm-field select {
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 12px;
}
.bx-tkbm-fullkb {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: min(860px, 98vw);
    background: rgba(9, 13, 22, 0.94);
    border: 1px solid rgba(56, 189, 248, 0.35);
    border-radius: 14px;
    padding: 8px;
    pointer-events: auto;
    touch-action: none;
    z-index: 35;
    box-shadow: 0 14px 36px rgba(0, 0, 0, 0.85);
}
.bx-tkbm-kb-row {
    display: flex;
    gap: 4px;
    margin-bottom: 4px;
    justify-content: center;
}
.bx-tkbm-kb-key {
    flex: 1;
    min-width: 24px;
    height: 34px;
    border-radius: 6px;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.16);
    color: #f8fafc;
    font-size: 10.5px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    touch-action: none;
}
.bx-tkbm-kb-key.bx-tkbm-active {
    background: #10b981;
    color: #052e16;
    border-color: #34d399;
}
`;
        document.documentElement.appendChild(style);
    }

    private buildDom() {
        const existing = document.getElementById('bx-touch-kbm-root');
        if (existing) {
            existing.remove();
        }

        this.$root = document.createElement('div');
        this.$root.id = 'bx-touch-kbm-root';

        this.$touchpadZone = document.createElement('div');
        this.$touchpadZone.className = 'bx-tkbm-touchpad bx-tkbm-zone-visible';
        this.$deltaReadout = document.createElement('div');
        this.$deltaReadout.className = 'bx-tkbm-pad-badge';
        this.$deltaReadout.textContent = 'RIGHT THUMB: DIRECT XCLOUD MOUSE DELTA (0ms)';
        this.$touchpadZone.appendChild(this.$deltaReadout);

        this.bindRightThumbTouchpadEvents();

        this.$buttonsLayer = document.createElement('div');
        this.$buttonsLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

        this.$fullKeyboardLayer = document.createElement('div');
        this.$fullKeyboardLayer.className = 'bx-tkbm-fullkb bx-gone';
        this.buildFullPcKeyboard();

        this.$toolbar = document.createElement('div');
        this.$toolbar.className = 'bx-tkbm-toolbar';
        this.buildToolbar();

        this.$editorPanel = document.createElement('div');
        this.$editorPanel.className = 'bx-tkbm-editor bx-gone';

        this.$root.append(
            this.$touchpadZone,
            this.$buttonsLayer,
            this.$fullKeyboardLayer,
            this.$toolbar,
            this.$editorPanel
        );

        document.documentElement.appendChild(this.$root);
    }

    private bindRightThumbTouchpadEvents() {
        const onStart = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const nativeHandler = NativeMkbHandler.getInstance();
            if (nativeHandler && !nativeHandler.isEnabled()) {
                nativeHandler.start();
            }

            if (this.lookTouchId === null && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                this.lookTouchId = touch.identifier;
                this.lastLookX = touch.clientX;
                this.lastLookY = touch.clientY;
                this.remainderX = 0;
                this.remainderY = 0;
            }
        };

        const onMove = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.lookTouchId === null) {
                return;
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.lookTouchId) {
                    const dx = touch.clientX - this.lastLookX;
                    const dy = touch.clientY - this.lastLookY;
                    this.lastLookX = touch.clientX;
                    this.lastLookY = touch.clientY;
                    this.sendDirectMouseDelta(dx, dy);
                    break;
                }
            }
        };

        const onEnd = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.lookTouchId === null) {
                return;
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.lookTouchId) {
                    this.lookTouchId = null;
                    this.remainderX = 0;
                    this.remainderY = 0;
                    break;
                }
            }
        };

        this.$touchpadZone.addEventListener('touchstart', onStart, { passive: false });
        this.$touchpadZone.addEventListener('touchmove', onMove, { passive: false });
        this.$touchpadZone.addEventListener('touchend', onEnd, { passive: false });
        this.$touchpadZone.addEventListener('touchcancel', onEnd, { passive: false });
    }

    private buildToolbar() {
        this.$toolbar.innerHTML = '';

        const btnToggleHud = document.createElement('button');
        btnToggleHud.className = `bx-tkbm-tool-btn ${this.activeProfile.enabled ? 'bx-active' : ''}`;
        btnToggleHud.textContent = this.activeProfile.enabled ? '🎯 KBM HUD: ON' : '🎯 KBM HUD: OFF';
        btnToggleHud.addEventListener('click', () => {
            this.activeProfile.enabled = !this.activeProfile.enabled;
            if (!this.activeProfile.enabled) {
                this.releaseAllInputs();
            }
            this.saveForeverStorage(false);
            this.renderProfile();
            this.buildToolbar();
        });

        const btnProtocol = document.createElement('button');
        btnProtocol.className = 'bx-tkbm-tool-btn';
        btnProtocol.textContent = this.activeProfile.protocol === 'native-mkb' ? '⚡ Native Delta' : '🎮 Stick Delta';
        btnProtocol.addEventListener('click', () => {
            this.releaseAllInputs();
            this.activeProfile.protocol = this.activeProfile.protocol === 'native-mkb' ? 'hybrid-gamepad' : 'native-mkb';
            this.saveForeverStorage(false);
            Toast.show('Right-Thumb Protocol', this.activeProfile.protocol === 'native-mkb' ? 'Direct Native Mouse Delta (0ms)' : 'Hybrid Controller Right-Stick Delta');
            this.buildToolbar();
        });

        const btnXboxA = document.createElement('button');
        btnXboxA.className = 'bx-tkbm-tool-btn';
        btnXboxA.textContent = '🟢 Xbox A';
        btnXboxA.addEventListener('click', () => {
            this.sendQuickXboxButton('A');
        });

        const btnFullKb = document.createElement('button');
        btnFullKb.className = `bx-tkbm-tool-btn ${this.isFullKeyboardOpen ? 'bx-active' : ''}`;
        btnFullKb.textContent = '⌨️ Full KB';
        btnFullKb.addEventListener('click', () => {
            this.isFullKeyboardOpen = !this.isFullKeyboardOpen;
            this.$fullKeyboardLayer.classList.toggle('bx-gone', !this.isFullKeyboardOpen);
            this.buildToolbar();
        });

        const btnEdit = document.createElement('button');
        btnEdit.className = `bx-tkbm-tool-btn ${this.isEditMode ? 'bx-active' : ''}`;
        btnEdit.textContent = this.isEditMode ? '✅ Save ♾️' : '🛠️ Edit';
        btnEdit.addEventListener('click', () => {
            this.isEditMode = !this.isEditMode;
            this.$editorPanel.classList.toggle('bx-gone', !this.isEditMode);
            this.$touchpadZone.classList.toggle('bx-tkbm-edit-highlight', this.isEditMode);
            if (!this.isEditMode) {
                this.selectedButtonId = null;
                this.saveForeverStorage(true);
            } else {
                this.renderEditorPanel();
            }
            this.renderProfile();
            this.buildToolbar();
        });

        this.$toolbar.append(btnToggleHud, btnProtocol, btnXboxA, btnFullKb, btnEdit);
    }

    private buildFullPcKeyboard() {
        this.$fullKeyboardLayer.innerHTML = '';

        const rows: Array<Array<{ label: string; code: string; flex?: number }>> = [
            [
                { label: 'ESC', code: 'Escape' },
                { label: 'F1', code: 'F1' }, { label: 'F2', code: 'F2' }, { label: 'F3', code: 'F3' }, { label: 'F4', code: 'F4' },
                { label: 'F5', code: 'F5' }, { label: 'F6', code: 'F6' }, { label: 'F7', code: 'F7' }, { label: 'F8', code: 'F8' },
                { label: 'F9', code: 'F9' }, { label: 'F10', code: 'F10' }, { label: 'F11', code: 'F11' }, { label: 'F12', code: 'F12' },
                { label: 'DEL', code: 'Delete' },
            ],
            [
                { label: '`', code: 'Backquote' },
                { label: '1', code: 'Digit1' }, { label: '2', code: 'Digit2' }, { label: '3', code: 'Digit3' }, { label: '4', code: 'Digit4' },
                { label: '5', code: 'Digit5' }, { label: '6', code: 'Digit6' }, { label: '7', code: 'Digit7' }, { label: '8', code: 'Digit8' },
                { label: '9', code: 'Digit9' }, { label: '0', code: 'Digit0' }, { label: '-', code: 'Minus' }, { label: '=', code: 'Equal' },
                { label: 'BKSP', code: 'Backspace', flex: 1.6 },
            ],
            [
                { label: 'TAB', code: 'Tab', flex: 1.4 },
                { label: 'Q', code: 'KeyQ' }, { label: 'W', code: 'KeyW' }, { label: 'E', code: 'KeyE' }, { label: 'R', code: 'KeyR' },
                { label: 'T', code: 'KeyT' }, { label: 'Y', code: 'KeyY' }, { label: 'U', code: 'KeyU' }, { label: 'I', code: 'KeyI' },
                { label: 'O', code: 'KeyO' }, { label: 'P', code: 'KeyP' }, { label: '[', code: 'BracketLeft' }, { label: ']', code: 'BracketRight' },
                { label: '\\', code: 'Backslash' },
            ],
            [
                { label: 'CAPS', code: 'CapsLock', flex: 1.6 },
                { label: 'A', code: 'KeyA' }, { label: 'S', code: 'KeyS' }, { label: 'D', code: 'KeyD' }, { label: 'F', code: 'KeyF' },
                { label: 'G', code: 'KeyG' }, { label: 'H', code: 'KeyH' }, { label: 'J', code: 'KeyJ' }, { label: 'K', code: 'KeyK' },
                { label: 'L', code: 'KeyL' }, { label: ';', code: 'Semicolon' }, { label: "'", code: 'Quote' },
                { label: 'ENTER', code: 'Enter', flex: 1.8 },
            ],
            [
                { label: 'SHIFT', code: 'ShiftLeft', flex: 2.0 },
                { label: 'Z', code: 'KeyZ' }, { label: 'X', code: 'KeyX' }, { label: 'C', code: 'KeyC' }, { label: 'V', code: 'KeyV' },
                { label: 'B', code: 'KeyB' }, { label: 'N', code: 'KeyN' }, { label: 'M', code: 'KeyM' }, { label: ',', code: 'Comma' },
                { label: '.', code: 'Period' }, { label: '/', code: 'Slash' },
                { label: '↑', code: 'ArrowUp' },
                { label: 'R-SHIFT', code: 'ShiftRight', flex: 1.4 },
            ],
            [
                { label: 'CTRL', code: 'ControlLeft', flex: 1.3 },
                { label: 'ALT', code: 'AltLeft', flex: 1.3 },
                { label: 'LMB', code: 'Mouse0', flex: 1.4 },
                { label: 'SPACEBAR', code: 'Space', flex: 4.2 },
                { label: 'RMB', code: 'Mouse2', flex: 1.4 },
                { label: 'MMB', code: 'Mouse1', flex: 1.2 },
                { label: '←', code: 'ArrowLeft' },
                { label: '↓', code: 'ArrowDown' },
                { label: '→', code: 'ArrowRight' },
            ],
        ];

        for (const row of rows) {
            const $row = document.createElement('div');
            $row.className = 'bx-tkbm-kb-row';
            for (const keyDef of row) {
                const $key = document.createElement('div');
                $key.className = 'bx-tkbm-kb-key';
                if (keyDef.flex) {
                    $key.style.flex = String(keyDef.flex);
                }
                $key.textContent = keyDef.label;

                const onDown = (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    $key.classList.add('bx-tkbm-active');
                    this.triggerHaptic(6);
                    this.dispatchCodeState(keyDef.code, true);
                };
                const onUp = (e: Event) => {
                    e.preventDefault();
                    e.stopPropagation();
                    $key.classList.remove('bx-tkbm-active');
                    this.dispatchCodeState(keyDef.code, false);
                };

                $key.addEventListener('touchstart', onDown, { passive: false });
                $key.addEventListener('touchend', onUp, { passive: false });
                $key.addEventListener('touchcancel', onUp, { passive: false });
                $key.addEventListener('mousedown', onDown);
                $key.addEventListener('mouseup', onUp);
                $row.appendChild($key);
            }
            this.$fullKeyboardLayer.appendChild($row);
        }
    }

    public renderProfile() {
        if (!this.$touchpadZone || !this.$buttonsLayer) {
            return;
        }

        const isVisible = this.activeProfile.enabled;
        this.$touchpadZone.classList.toggle('bx-gone', !isVisible);
        this.$buttonsLayer.classList.toggle('bx-gone', !isVisible);

        this.$touchpadZone.style.left = `${this.activeProfile.touchpadStartXPct}%`;
        this.$touchpadZone.classList.toggle('bx-tkbm-zone-visible', this.activeProfile.showTouchpadZone);

        this.$buttonsLayer.innerHTML = '';

        for (const btn of this.activeProfile.buttons) {
            const $btn = document.createElement('div');
            $btn.className = 'bx-tkbm-btn';
            if (this.selectedButtonId === btn.id && this.isEditMode) {
                $btn.classList.add('bx-tkbm-selected');
            }
            $btn.dataset.id = btn.id;
            $btn.dataset.shape = btn.shape || 'circle';

            $btn.style.left = `${btn.xPct}%`;
            $btn.style.top = `${btn.yPct}%`;
            $btn.style.width = btn.shape === 'pill' ? `${Math.round(btn.size * 1.35)}px` : `${btn.size}px`;
            $btn.style.height = btn.shape === 'pill' ? `${Math.round(btn.size * 0.72)}px` : `${btn.size}px`;
            $btn.style.opacity = String(Math.min(1, btn.opacity * this.activeProfile.globalOpacity));
            if (btn.color) {
                $btn.style.borderColor = btn.color;
            }

            if (btn.code === 'WASD_STICK') {
                const $nub = document.createElement('div');
                $nub.className = 'bx-tkbm-stick-nub';
                const $lbl = document.createElement('div');
                $lbl.className = 'bx-tkbm-btn-label';
                $lbl.style.position = 'absolute';
                $lbl.style.top = '8px';
                $lbl.textContent = 'W';
                $btn.append($lbl, $nub);
                this.bindWasdStickEvents($btn, $nub, btn);
            } else {
                const $label = document.createElement('div');
                $label.className = 'bx-tkbm-btn-label';
                $label.textContent = btn.label;
                $btn.appendChild($label);

                if (btn.subLabel) {
                    const $sub = document.createElement('div');
                    $sub.className = 'bx-tkbm-btn-sub';
                    $sub.textContent = btn.subLabel;
                    $btn.appendChild($sub);
                }
                this.bindButtonEvents($btn, btn);
            }

            this.$buttonsLayer.appendChild($btn);
        }
    }

    private bindWasdStickEvents($btn: HTMLElement, $nub: HTMLElement, btn: TouchKbmButtonConfig) {
        let stickTouchId: number | null = null;
        const activeStickKeys = new Set<string>();

        const updateStickKeys = (newKeys: Set<string>) => {
            for (const oldKey of Array.from(activeStickKeys)) {
                if (!newKeys.has(oldKey)) {
                    this.setKeyboardKeyState(oldKey, false);
                    activeStickKeys.delete(oldKey);
                }
            }
            for (const nk of Array.from(newKeys)) {
                if (!activeStickKeys.has(nk)) {
                    this.setKeyboardKeyState(nk, true);
                    activeStickKeys.add(nk);
                }
            }
        };

        const handleStickMove = (clientX: number, clientY: number) => {
            const rect = $btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const maxR = rect.width / 2;

            const dx = clientX - cx;
            const dy = clientY - cy;
            const dist = Math.hypot(dx, dy);
            const clampedDist = Math.min(maxR, dist);
            const angle = Math.atan2(dy, dx);

            const nubX = Math.cos(angle) * clampedDist * 0.55;
            const nubY = Math.sin(angle) * clampedDist * 0.55;
            $nub.style.transform = `translate(calc(-50% + ${nubX}px), calc(-50% + ${nubY}px))`;

            const nextKeys = new Set<string>();
            const norm = dist / maxR;
            if (norm > 0.22) {
                const nx = dx / dist;
                const ny = dy / dist;
                if (ny < -0.38) nextKeys.add('KeyW');
                if (ny > 0.38) nextKeys.add('KeyS');
                if (nx < -0.38) nextKeys.add('KeyA');
                if (nx > 0.38) nextKeys.add('KeyD');

                if (norm > 0.85 && ny < -0.5) {
                    nextKeys.add('ShiftLeft');
                }
            }
            updateStickKeys(nextKeys);
        };

        $btn.addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isEditMode) {
                this.selectedButtonId = btn.id;
                this.renderProfile();
                this.renderEditorPanel();
                return;
            }

            if (stickTouchId === null && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                stickTouchId = t.identifier;
                $btn.classList.add('bx-tkbm-active');
                this.triggerHaptic(6);
                handleStickMove(t.clientX, t.clientY);
            }
        }, { passive: false });

        $btn.addEventListener('touchmove', (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isEditMode && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                btn.xPct = Math.max(4, Math.min(96, +(t.clientX / window.innerWidth * 100).toFixed(1)));
                btn.yPct = Math.max(4, Math.min(96, +(t.clientY / window.innerHeight * 100).toFixed(1)));
                $btn.style.left = `${btn.xPct}%`;
                $btn.style.top = `${btn.yPct}%`;
                return;
            }

            if (stickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (t.identifier === stickTouchId) {
                    handleStickMove(t.clientX, t.clientY);
                    break;
                }
            }
        }, { passive: false });

        const onEnd = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.isEditMode) {
                this.saveForeverStorage(false);
                this.renderEditorPanel();
                return;
            }
            if (stickTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === stickTouchId) {
                    stickTouchId = null;
                    $btn.classList.remove('bx-tkbm-active');
                    $nub.style.transform = 'translate(-50%, -50%)';
                    updateStickKeys(new Set());
                    break;
                }
            }
        };

        $btn.addEventListener('touchend', onEnd, { passive: false });
        $btn.addEventListener('touchcancel', onEnd, { passive: false });
    }

    private bindButtonEvents($btn: HTMLElement, btn: TouchKbmButtonConfig) {
        $btn.addEventListener('touchstart', (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isEditMode) {
                this.selectedButtonId = btn.id;
                this.renderProfile();
                this.renderEditorPanel();
                return;
            }

            const nativeHandler = NativeMkbHandler.getInstance();
            if (nativeHandler && !nativeHandler.isEnabled()) {
                nativeHandler.start();
            }

            const touch = e.changedTouches[0];
            if (!touch) return;

            this.triggerHaptic(7);
            this.buttonTouchMap.set(touch.identifier, {
                btn,
                $btn,
                lastX: touch.clientX,
                lastY: touch.clientY,
            });

            if (btn.mode === 'toggle') {
                const isNowActive = !this.toggledButtons.has(btn.id);
                if (isNowActive) {
                    this.toggledButtons.add(btn.id);
                    $btn.classList.add('bx-tkbm-active');
                    this.dispatchCodeState(btn.code, true);
                } else {
                    this.toggledButtons.delete(btn.id);
                    $btn.classList.remove('bx-tkbm-active');
                    this.dispatchCodeState(btn.code, false);
                }
            } else {
                $btn.classList.add('bx-tkbm-active');
                this.dispatchCodeState(btn.code, true);
            }
        }, { passive: false });

        $btn.addEventListener('touchmove', (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isEditMode && e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                btn.xPct = Math.max(3, Math.min(97, +(t.clientX / window.innerWidth * 100).toFixed(1)));
                btn.yPct = Math.max(3, Math.min(97, +(t.clientY / window.innerHeight * 100).toFixed(1)));
                $btn.style.left = `${btn.xPct}%`;
                $btn.style.top = `${btn.yPct}%`;
                return;
            }

            if (btn.swipeAim) {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const t = e.changedTouches[i];
                    const state = this.buttonTouchMap.get(t.identifier);
                    if (state) {
                        const dx = t.clientX - state.lastX;
                        const dy = t.clientY - state.lastY;
                        state.lastX = t.clientX;
                        state.lastY = t.clientY;
                        this.sendDirectMouseDelta(dx, dy);
                    }
                }
            }
        }, { passive: false });

        const onEnd = (e: TouchEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (this.isEditMode) {
                this.saveForeverStorage(false);
                this.renderEditorPanel();
                return;
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                if (this.buttonTouchMap.has(t.identifier)) {
                    this.buttonTouchMap.delete(t.identifier);
                    if (btn.mode !== 'toggle') {
                        $btn.classList.remove('bx-tkbm-active');
                        this.dispatchCodeState(btn.code, false);
                    }
                }
            }
        };

        $btn.addEventListener('touchend', onEnd, { passive: false });
        $btn.addEventListener('touchcancel', onEnd, { passive: false });
    }

    private renderEditorPanel() {
        this.$editorPanel.innerHTML = '';

        const selectedBtn = this.activeProfile.buttons.find(b => b.id === this.selectedButtonId) || null;

        const header = document.createElement('div');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;padding-bottom:8px;margin-bottom:8px;';
        header.innerHTML = `<div style="font-weight:800;font-size:13px;">🎯 Warzone Touch KBM & Direct Delta Editor (Saved Forever ♾️)</div>`;

        const profileRow = document.createElement('div');
        profileRow.className = 'bx-tkbm-editor-grid';

        const presetField = document.createElement('div');
        presetField.className = 'bx-tkbm-field';
        presetField.innerHTML = `<label>Active Preset Profile</label>`;
        const presetSelect = document.createElement('select');
        for (const prof of Object.values(this.storageData.profiles)) {
            const opt = document.createElement('option');
            opt.value = prof.id;
            opt.textContent = prof.name;
            if (prof.id === this.activeProfile.id) opt.selected = true;
            presetSelect.appendChild(opt);
        }
        presetSelect.addEventListener('change', () => {
            const next = this.storageData.profiles[presetSelect.value];
            if (next) {
                this.activeProfile = next;
                this.selectedButtonId = null;
                this.saveForeverStorage(true);
                this.renderProfile();
                this.renderEditorPanel();
            }
        });
        presetField.appendChild(presetSelect);

        const sensXField = document.createElement('div');
        sensXField.className = 'bx-tkbm-field';
        sensXField.innerHTML = `<label>Direct Delta X Sens (${this.activeProfile.sensX.toFixed(2)}x)</label>`;
        const sensXInput = document.createElement('input');
        sensXInput.type = 'range';
        sensXInput.min = '0.2';
        sensXInput.max = '8.0';
        sensXInput.step = '0.05';
        sensXInput.value = String(this.activeProfile.sensX);
        sensXInput.addEventListener('input', () => {
            this.activeProfile.sensX = parseFloat(sensXInput.value);
            sensXField.querySelector('label')!.textContent = `Direct Delta X Sens (${this.activeProfile.sensX.toFixed(2)}x)`;
            this.saveForeverStorage(false);
        });
        sensXField.appendChild(sensXInput);

        const sensYField = document.createElement('div');
        sensYField.className = 'bx-tkbm-field';
        sensYField.innerHTML = `<label>Direct Delta Y Sens (${this.activeProfile.sensY.toFixed(2)}x)</label>`;
        const sensYInput = document.createElement('input');
        sensYInput.type = 'range';
        sensYInput.min = '0.2';
        sensYInput.max = '8.0';
        sensYInput.step = '0.05';
        sensYInput.value = String(this.activeProfile.sensY);
        sensYInput.addEventListener('input', () => {
            this.activeProfile.sensY = parseFloat(sensYInput.value);
            sensYField.querySelector('label')!.textContent = `Direct Delta Y Sens (${this.activeProfile.sensY.toFixed(2)}x)`;
            this.saveForeverStorage(false);
        });
        sensYField.appendChild(sensYInput);

        const adsField = document.createElement('div');
        adsField.className = 'bx-tkbm-field';
        adsField.innerHTML = `<label>ADS (RMB) Sens Multiplier (${Math.round(this.activeProfile.adsMultiplier * 100)}%)</label>`;
        const adsInput = document.createElement('input');
        adsInput.type = 'range';
        adsInput.min = '0.2';
        adsInput.max = '1.5';
        adsInput.step = '0.02';
        adsInput.value = String(this.activeProfile.adsMultiplier);
        adsInput.addEventListener('input', () => {
            this.activeProfile.adsMultiplier = parseFloat(adsInput.value);
            adsField.querySelector('label')!.textContent = `ADS (RMB) Sens Multiplier (${Math.round(this.activeProfile.adsMultiplier * 100)}%)`;
            this.saveForeverStorage(false);
        });
        adsField.appendChild(adsInput);

        const padField = document.createElement('div');
        padField.className = 'bx-tkbm-field';
        padField.innerHTML = `<label>Right Thumb Pad Start (${this.activeProfile.touchpadStartXPct}%)</label>`;
        const padInput = document.createElement('input');
        padInput.type = 'range';
        padInput.min = '25';
        padInput.max = '70';
        padInput.step = '1';
        padInput.value = String(this.activeProfile.touchpadStartXPct);
        padInput.addEventListener('input', () => {
            this.activeProfile.touchpadStartXPct = parseInt(padInput.value);
            padField.querySelector('label')!.textContent = `Right Thumb Pad Start (${this.activeProfile.touchpadStartXPct}%)`;
            this.$touchpadZone.style.left = `${this.activeProfile.touchpadStartXPct}%`;
            this.saveForeverStorage(false);
        });
        padField.appendChild(padInput);

        profileRow.append(presetField, sensXField, sensYField, adsField, padField);

        const actionsRow = document.createElement('div');
        actionsRow.style.cssText = 'display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;';

        const btnAdd = document.createElement('button');
        btnAdd.className = 'bx-tkbm-tool-btn bx-active';
        btnAdd.textContent = '+ Add Custom Key / Mouse Button';
        btnAdd.addEventListener('click', () => {
            const newBtn: TouchKbmButtonConfig = {
                id: 'btn_custom_' + Date.now(),
                label: 'KEY',
                subLabel: 'B',
                code: 'KeyB',
                xPct: 50,
                yPct: 50,
                size: 60,
                opacity: 0.88,
                mode: 'hold',
                swipeAim: true,
                shape: 'circle',
                color: '#38bdf8',
            };
            this.activeProfile.buttons.push(newBtn);
            this.selectedButtonId = newBtn.id;
            this.saveForeverStorage(false);
            this.renderProfile();
            this.renderEditorPanel();
        });

        const btnReset = document.createElement('button');
        btnReset.className = 'bx-tkbm-tool-btn';
        btnReset.textContent = '↺ Reset to Warzone Default';
        btnReset.addEventListener('click', () => {
            const fresh = this.activeProfile.id === 'warzone-discrete-wasd'
                ? createDiscreteWasdProfile()
                : createDefaultWarzoneClawProfile();
            this.storageData.profiles[fresh.id] = fresh;
            this.activeProfile = fresh;
            this.selectedButtonId = null;
            this.saveForeverStorage(true);
            this.renderProfile();
            this.renderEditorPanel();
        });

        actionsRow.append(btnAdd, btnReset);
        this.$editorPanel.append(header, profileRow, actionsRow);

        if (selectedBtn) {
            const btnBox = document.createElement('div');
            btnBox.style.cssText = 'margin-top:12px;padding-top:10px;border-top:1px solid #334155;';
            btnBox.innerHTML = `<div style="font-weight:700;font-size:12px;color:#38bdf8;margin-bottom:6px;">Selected Control: ${selectedBtn.label} (${selectedBtn.code}) — Drag button on screen to move</div>`;

            const grid = document.createElement('div');
            grid.className = 'bx-tkbm-editor-grid';

            const lblField = document.createElement('div');
            lblField.className = 'bx-tkbm-field';
            lblField.innerHTML = `<label>Button Label</label>`;
            const lblInput = document.createElement('input');
            lblInput.type = 'text';
            lblInput.value = selectedBtn.label;
            lblInput.addEventListener('input', () => {
                selectedBtn.label = lblInput.value;
                this.saveForeverStorage(false);
                this.renderProfile();
            });
            lblField.appendChild(lblInput);

            const codeField = document.createElement('div');
            codeField.className = 'bx-tkbm-field';
            codeField.innerHTML = `<label>PC Key / Mouse Binding</label>`;
            const codeSelect = document.createElement('select');
            const allBindings = [
                ['Mouse0', 'Mouse Left Click (Fire)'],
                ['Mouse2', 'Mouse Right Click (ADS)'],
                ['Mouse1', 'Mouse Middle Click (Ping)'],
                ['Mouse3', 'Mouse4 Side Back'],
                ['Mouse4', 'Mouse5 Side Forward'],
                ['WheelUp', 'Mouse Wheel Up'],
                ['WheelDown', 'Mouse Wheel Down'],
                ['WASD_STICK', '8-Way WASD Stick + Sprint'],
                ...Object.keys(KEY_CODE_MAP).map(k => [k, `Keyboard: ${k}`]),
            ];
            for (const [val, text] of allBindings) {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = text;
                if (val === selectedBtn.code) opt.selected = true;
                codeSelect.appendChild(opt);
            }
            codeSelect.addEventListener('change', () => {
                selectedBtn.code = codeSelect.value;
                selectedBtn.subLabel = codeSelect.value.replace('Key', '').replace('Digit', '');
                this.saveForeverStorage(false);
                this.renderProfile();
            });
            codeField.appendChild(codeSelect);

            const sizeField = document.createElement('div');
            sizeField.className = 'bx-tkbm-field';
            sizeField.innerHTML = `<label>Size (${selectedBtn.size}px)</label>`;
            const sizeInput = document.createElement('input');
            sizeInput.type = 'range';
            sizeInput.min = '36';
            sizeInput.max = '170';
            sizeInput.value = String(selectedBtn.size);
            sizeInput.addEventListener('input', () => {
                selectedBtn.size = parseInt(sizeInput.value);
                sizeField.querySelector('label')!.textContent = `Size (${selectedBtn.size}px)`;
                this.saveForeverStorage(false);
                this.renderProfile();
            });
            sizeField.appendChild(sizeInput);

            const modeField = document.createElement('div');
            modeField.className = 'bx-tkbm-field';
            modeField.innerHTML = `<label>Press Mode & Swipe-Aim</label>`;
            const modeSelect = document.createElement('select');
            modeSelect.innerHTML = `
                <option value="hold-swipe" ${selectedBtn.mode === 'hold' && selectedBtn.swipeAim ? 'selected' : ''}>Hold + Swipe-Aim Delta</option>
                <option value="hold-noswipe" ${selectedBtn.mode === 'hold' && !selectedBtn.swipeAim ? 'selected' : ''}>Hold Only</option>
                <option value="toggle-swipe" ${selectedBtn.mode === 'toggle' && selectedBtn.swipeAim ? 'selected' : ''}>Toggle + Swipe-Aim Delta</option>
                <option value="toggle-noswipe" ${selectedBtn.mode === 'toggle' && !selectedBtn.swipeAim ? 'selected' : ''}>Toggle Only</option>
            `;
            modeSelect.addEventListener('change', () => {
                const v = modeSelect.value;
                selectedBtn.mode = v.startsWith('toggle') ? 'toggle' : 'hold';
                selectedBtn.swipeAim = v.endsWith('-swipe');
                this.saveForeverStorage(false);
                this.renderProfile();
            });
            modeField.appendChild(modeSelect);

            const delBtn = document.createElement('button');
            delBtn.className = 'bx-tkbm-tool-btn';
            delBtn.style.cssText = 'background:#7f1d1d;border-color:#ef4444;margin-top:8px;';
            delBtn.textContent = '🗑️ Delete Button';
            delBtn.addEventListener('click', () => {
                this.activeProfile.buttons = this.activeProfile.buttons.filter(b => b.id !== selectedBtn.id);
                this.selectedButtonId = null;
                this.saveForeverStorage(false);
                this.renderProfile();
                this.renderEditorPanel();
            });

            grid.append(lblField, codeField, sizeField, modeField);
            btnBox.append(grid, delBtn);
            this.$editorPanel.appendChild(btnBox);
        }
    }
}
