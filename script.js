document.addEventListener("DOMContentLoaded", () => {
    // --- State Management ---
    let state;

    const getInitialState = () => ({
        player: { hp: 20, cost: 1, maxCost: 1, charge: 0, ultimateUsed: false, zeroCostUsed: false },
        opponent: { hp: 20, cost: 0, maxCost: 0, charge: 0, ultimateUsed: false, zeroCostUsed: false },
        isPlayerTurn: true,
    });

    // --- DOM Element Cache ---
    const dom = {
        player: {
            panel: document.getElementById('player-area'),
            hp: document.getElementById('player-hp'),
            costStars: document.getElementById('player-cost-stars'),
            chargeStars: document.getElementById('player-charge-stars'),
            ultimateBtn: document.getElementById('player-ultimate'),
            skillBtn: document.getElementById('player-skill'),
            zeroCostFlag: document.getElementById('player-zero-cost'),
        },
        opponent: {
            panel: document.getElementById('opponent-area'),
            hp: document.getElementById('opponent-hp'),
            costStars: document.getElementById('opponent-cost-stars'),
            chargeStars: document.getElementById('opponent-charge-stars'),
            ultimateBtn: document.getElementById('opponent-ultimate'),
            skillBtn: document.getElementById('opponent-skill'),
            zeroCostFlag: document.getElementById('opponent-zero-cost'),
        },
        logModal: document.getElementById('log-modal'),
        logArea: document.getElementById('log-area'),
        showLogBtn: document.getElementById('show-log'),
        closeLogBtn: document.getElementById('close-log'),
        nextTurnBtn: document.getElementById('next-turn'),
        resetBtn: document.getElementById('reset-game'),
        notificationContainer: document.getElementById('notification-container'),
    };

    // --- Logger & Notifications ---
    const log = (message) => {
        const entry = document.createElement("div");
        entry.className = "log-entry";
        entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        dom.logArea.prepend(entry);
    };

    const showNotification = (message) => {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        dom.notificationContainer.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    // --- UI Update Function ---
    const renderStars = (container, current, max, isCharge = false) => {
        container.innerHTML = '';
        const limit = isCharge ? current : max;

        for (let i = 0; i < limit; i++) {
            let colorClass = '';
            // For both cost and charge, apply color based on index
            if (i >= 8) { // 9th star onwards (index 8)
                colorClass = 'red';
            } else if (i >= 4) { // 5th star onwards (index 4)
                colorClass = 'orange';
            }

            const star = document.createElement('span');
            const activityClass = i < current ? 'active' : 'inactive';
            star.className = `star ${activityClass} ${colorClass}`;
            star.textContent = '★';
            container.appendChild(star);
        }
    };

    const updateUI = () => {
        ['player', 'opponent'].forEach(playerKey => {
            dom[playerKey].hp.textContent = state[playerKey].hp;
            renderStars(dom[playerKey].costStars, state[playerKey].cost, state[playerKey].maxCost, false);
            renderStars(dom[playerKey].chargeStars, state[playerKey].charge, state[playerKey].charge, true);
            dom[playerKey].ultimateBtn.classList.toggle('used', state[playerKey].ultimateUsed);
            dom[playerKey].zeroCostFlag.classList.toggle('used', state[playerKey].zeroCostUsed);
        });
        
        const currentPlayerKey = state.isPlayerTurn ? 'player' : 'opponent';
        const opponentPlayerKey = state.isPlayerTurn ? 'opponent' : 'player';
        
        dom[currentPlayerKey].panel.classList.add('active-panel');
        dom[opponentPlayerKey].panel.classList.remove('active-panel');
    };

    // --- Game Actions ---
    const setupGame = (isReset = false) => {
        if (isReset) {
            if (!confirm("本当にゲームをリセットしますか？")) return;
            state = getInitialState();
            dom.logArea.innerHTML = '';
            log("ゲームがリセットされました。");
        } else {
            state = getInitialState();
            log("ゲーム開始！");
        }
        updateUI();
    };

    const handleNextTurn = () => {
        const previousPlayerKey = state.isPlayerTurn ? 'player' : 'opponent';
        state[previousPlayerKey].zeroCostUsed = false;

        state.isPlayerTurn = !state.isPlayerTurn;
        const currentPlayerKey = state.isPlayerTurn ? 'player' : 'opponent';
        const currentPlayerName = state.isPlayerTurn ? '先攻' : '後攻';

        if (state[currentPlayerKey].maxCost < 10) {
            state[currentPlayerKey].maxCost++;
        }
        state[currentPlayerKey].cost = state[currentPlayerKey].maxCost;

        log(`${currentPlayerName}のターンです。`);
        log(`最大コストが ${state[currentPlayerKey].maxCost} になりました。`);
        updateUI();
    };

    // --- Event Listener Setup ---
    const addEventListeners = () => {
        // Game Management
        dom.nextTurnBtn.addEventListener('click', handleNextTurn);
        dom.resetBtn.addEventListener('click', () => setupGame(true));

        // Log Modal
        dom.showLogBtn.addEventListener('click', () => dom.logModal.style.display = 'flex');
        dom.closeLogBtn.addEventListener('click', () => dom.logModal.style.display = 'none');
        dom.logModal.addEventListener('click', (e) => {
            if (e.target === dom.logModal) dom.logModal.style.display = 'none';
        });

        // Player Controls
        ['player', 'opponent'].forEach(playerKey => {
            const name = playerKey === 'player' ? '先攻' : '後攻';
            
            // --- Resource Item Click ---
            const resourceItems = dom[playerKey].panel.querySelectorAll('.resource-item');
            resourceItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    const rect = item.getBoundingClientRect();
                    const isTopHalf = e.clientY < rect.top + rect.height / 2;
                    const controlId = item.querySelector('[id]').id;

                    if (controlId.includes('hp')) {
                        if (isTopHalf) state[playerKey].hp++;
                        else state[playerKey].hp--;
                    } else if (controlId.includes('cost')) {
                        if (isTopHalf) {
                            if (state[playerKey].cost < state[playerKey].maxCost) state[playerKey].cost++;
                        } else {
                            if (state[playerKey].cost > 0) state[playerKey].cost--;
                        }
                    } else if (controlId.includes('charge')) {
                        if (isTopHalf) state[playerKey].charge++;
                        else {
                            if (state[playerKey].charge > 0) state[playerKey].charge--;
                        }
                    }
                    updateUI();
                });
            });

            // --- Button Clicks ---
            dom[playerKey].ultimateBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent resource-item click
                if (!state[playerKey].ultimateUsed) {
                    state[playerKey].ultimateUsed = true;
                    showNotification("奥義発動！");
                    log(`${name}が奥義を使用しました。`);
                    updateUI();
                } else {
                    if (confirm("奥義の使用をキャンセルしますか？")) {
                        state[playerKey].ultimateUsed = false;
                        log(`${name}が奥義の使用をキャンセルしました。`);
                        updateUI();
                    }
                }
            });

            dom[playerKey].skillBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (state[playerKey].charge > 0) {
                    showNotification("リーダースキル発動！");
                    log(`${name}がリーダースキルを使用 (チャージ: ${state[playerKey].charge} → 0)`);
                    state[playerKey].charge = 0;
                    updateUI();
                } else {
                    log(`${name}はチャージが足りずスキルを発動できません。`);
                }
            });

            dom[playerKey].zeroCostFlag.addEventListener('click', (e) => {
                e.stopPropagation();
                state[playerKey].zeroCostUsed = !state[playerKey].zeroCostUsed;
                log(`${name}の0コスト使用フラグが${state[playerKey].zeroCostUsed ? 'ON' : 'OFF'}になりました。`);
                updateUI();
            });
        });
    };

    // --- Initialization ---
    setupGame();
    addEventListeners();
});