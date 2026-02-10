const STORAGE_KEY = 'pachislo_data_v2';

// 新しいデータ構造
// {
//   machines: [
//     {
//       id: "2025-02-11_1234",
//       name: "2025/02/11",
//       createdAt: "2025-02-11T12:34:56",
//       totalGames: 0,      // 累計有利区間
//       sessionHistory: [], // 今回のセッション履歴
//       allHistory: [],     // 全履歴
//       memo: "",
//       comments: []
//     }
//   ],
//   currentMachineId: null
// }

// データを読み込み
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        return {
            machines: [],
            currentMachineId: null
        };
    }
    return JSON.parse(data);
}

// データを保存
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateLastSaved();
}

// 現在の台を取得
function getCurrentMachine() {
    const data = loadData();
    if (!data.currentMachineId) return null;
    return data.machines.find(m => m.id === data.currentMachineId);
}

// 現在の台を更新
function updateCurrentMachine(updates) {
    const data = loadData();
    const index = data.machines.findIndex(m => m.id === data.currentMachineId);
    if (index !== -1) {
        data.machines[index] = { ...data.machines[index], ...updates };
        saveData(data);
        return data.machines[index];
    }
    return null;
}

// 新しい台を作成
function createMachine() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ja-JP').replace(/\//g, '/');
    const timeStr = now.toTimeString().slice(0, 5);
    const id = `${now.getTime()}`;

    return {
        id: id,
        name: `${dateStr} ${timeStr}`,
        createdAt: now.toISOString(),
        totalGames: 0,
        sessionHistory: [],
        allHistory: [],
        memo: '',
        comments: []
    };
}

// セッションのゲーム数を計算（履歴の全てのafter値を合計）
function calculateSessionGames() {
    const machine = getCurrentMachine();
    if (!machine || machine.sessionHistory.length === 0) return 0;
    return machine.sessionHistory.reduce((sum, item) => {
        return sum + item.after;
    }, 0);
}

// 表示を更新
function updateDisplay() {
    const data = loadData();
    const machine = getCurrentMachine();

    // 台セレクトボックス
    updateMachineSelect(data.machines, data.currentMachineId);

    // 有利区間表示
    if (machine) {
        document.getElementById('totalGames').textContent = machine.totalGames;
        document.getElementById('sessionGames').textContent = calculateSessionGames();
    } else {
        document.getElementById('totalGames').textContent = '0';
        document.getElementById('sessionGames').textContent = '0';
    }

    // メモ
    document.getElementById('memo').value = machine ? machine.memo : '';

    // 履歴
    if (machine) {
        renderHistory(machine.sessionHistory);
        renderComments(machine.comments);
    } else {
        document.getElementById('historyList').innerHTML = '<p class="empty">台を選択してください</p>';
        document.getElementById('commentHistory').innerHTML = '';
    }
}

// 台セレクトボックスを更新
function updateMachineSelect(machines, currentId) {
    const select = document.getElementById('machineSelect');
    select.innerHTML = '<option value="">-- 台を選択 --</option>';

    machines.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.id;
        option.textContent = `${machine.name} (${machine.totalGames}G)`;
        if (machine.id === currentId) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// 履歴を表示
function renderHistory(history) {
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<p class="empty">まだ履歴がありません</p>';
        return;
    }

    container.innerHTML = '';
    history.slice().reverse().forEach((item, revIndex) => {
        const actualIndex = history.length - 1 - revIndex;
        const div = document.createElement('div');
        div.className = `history-item ${item.type.toLowerCase()}`;
        div.innerHTML = `
            <span class="bonus-type">${item.type}</span>
            <div class="games">
                <span class="before">${item.before}</span>
                <span class="arrow">→</span>
                <span class="after">${item.after}</span>
            </div>
            <span class="time">${item.time}</span>
            <button class="delete-item" onclick="app.deleteHistoryItem(${actualIndex})">×</button>
        `;
        container.appendChild(div);
    });
}

// コメントを表示
function renderComments(comments) {
    const container = document.getElementById('commentHistory');
    container.innerHTML = '';

    comments.slice().reverse().forEach(comment => {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.innerHTML = `
            <span class="comment-time">${comment.time}</span>
            <span class="comment-text">${escapeHtml(comment.text)}</span>
        `;
        container.appendChild(div);
    });
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ボーナスを記録
function recordBonus(type, addGames) {
    const input = document.getElementById('gameInput');
    const beforeGames = parseInt(input.value);

    if (isNaN(beforeGames) || beforeGames < 0) {
        alert('ゲーム数を入力してください');
        input.focus();
        return;
    }

    const machine = getCurrentMachine();
    if (!machine) {
        alert('台を選択してください');
        return;
    }

    const afterGames = beforeGames + addGames;

    const historyItem = {
        type: type,
        before: beforeGames,
        after: afterGames,
        time: getTimestamp()
    };

    // セッション履歴と全履歴に追加
    const newSessionHistory = [...machine.sessionHistory, historyItem];
    const newAllHistory = [...machine.allHistory, historyItem];

    // 累計を更新（afterGamesを足す）
    const newTotal = machine.totalGames + afterGames;

    updateCurrentMachine({
        sessionHistory: newSessionHistory,
        allHistory: newAllHistory,
        totalGames: newTotal
    });

    updateDisplay();

    // 入力をクリア
    input.value = '';
    input.focus();
}

// 履歴を個別削除
function deleteHistoryItem(index) {
    const machine = getCurrentMachine();
    if (!machine || index < 0 || index >= machine.sessionHistory.length) {
        return;
    }

    const item = machine.sessionHistory[index];
    if (confirm(`この記録を削除しますか？\n${item.type}: ${item.before}G → ${item.after}G`)) {
        const newSessionHistory = [...machine.sessionHistory];
        const newAllHistory = [...machine.allHistory];

        // 削除対象のアイテムを削除
        newSessionHistory.splice(index, 1);
        // allHistoryからも削除（同じアイテムを探す）
        const allIndex = newAllHistory.findIndex(h =>
            h.type === item.type && h.before === item.before && h.after === item.after && h.time === item.time
        );
        if (allIndex !== -1) {
            newAllHistory.splice(allIndex, 1);
        }

        // 累計から差し引く
        const newTotal = Math.max(0, machine.totalGames - item.after);

        updateCurrentMachine({
            sessionHistory: newSessionHistory,
            allHistory: newAllHistory,
            totalGames: newTotal
        });

        updateDisplay();
        updateLastSaved();
    }
}

// 新しい台を作成
function newMachine() {
    const data = loadData();
    const newMachine = createMachine();
    data.machines.push(newMachine);
    data.currentMachineId = newMachine.id;
    saveData(data);
    updateDisplay();
    document.getElementById('gameInput').focus();
}

// 台を選択
function selectMachine(machineId) {
    if (!machineId) return;
    const data = loadData();
    data.currentMachineId = machineId;
    saveData(data);
    updateDisplay();
}

// 元に戻す（セッションの最後を削除）
function undoLast() {
    const machine = getCurrentMachine();
    if (!machine || machine.sessionHistory.length === 0) {
        alert('戻す履歴がありません');
        return;
    }

    const lastIndex = machine.sessionHistory.length - 1;
    deleteHistoryItem(lastIndex);
}

// セッションリセット（累計は保持）
function resetSession() {
    console.log('resetSession called');
    const machine = getCurrentMachine();
    if (!machine) {
        alert('台を選択してください');
        return;
    }

    if (confirm('セッションをリセットしますか？\n（この台の累計は保持されます）')) {
        updateCurrentMachine({
            sessionHistory: []
        });
        updateDisplay();
        updateLastSaved();
    }
}

// 台を削除
function deleteMachine() {
    console.log('deleteMachine called');
    const data = loadData();
    if (!data.currentMachineId) {
        alert('台を選択してください');
        return;
    }

    const machine = getCurrentMachine();
    if (confirm(`「${machine.name}」を削除しますか？\nこの操作は取り消せません。`)) {
        data.machines = data.machines.filter(m => m.id !== data.currentMachineId);
        data.currentMachineId = null;
        saveData(data);
        updateDisplay();
        updateLastSaved();
    }
}

// 最終保存日時を更新
function updateLastSaved() {
    const now = new Date();
    const timeStr = now.toLocaleString('ja-JP');
    document.getElementById('lastSaved').textContent = `最終保存: ${timeStr}`;
}

// タイムスタンプを取得
function getTimestamp() {
    const now = new Date();
    return now.toLocaleString('ja-JP', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 初期化
function init() {
    updateDisplay();
    updateLastSaved();

    // 新規台ボタン
    document.getElementById('newMachineBtn').addEventListener('click', newMachine);

    // 台選択
    document.getElementById('machineSelect').addEventListener('change', (e) => {
        selectMachine(e.target.value);
    });

    // BBボタン
    document.getElementById('bbBtn').addEventListener('click', () => {
        recordBonus('BB', 59);
    });

    // RBボタン
    document.getElementById('rbBtn').addEventListener('click', () => {
        recordBonus('RB', 24);
    });

    // EnterキーでBB/RB入力
    document.getElementById('gameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                recordBonus('RB', 24);
            } else {
                recordBonus('BB', 59);
            }
        }
    });

    // メモ保存
    document.getElementById('saveMemo').addEventListener('click', () => {
        const machine = getCurrentMachine();
        if (!machine) {
            alert('台を選択してください');
            return;
        }
        updateCurrentMachine({
            memo: document.getElementById('memo').value
        });
        alert('メモを保存しました');
    });

    // 一言記録
    document.getElementById('saveComment').addEventListener('click', () => {
        const machine = getCurrentMachine();
        if (!machine) {
            alert('台を選択してください');
            return;
        }

        const input = document.getElementById('comment');
        const text = input.value.trim();
        if (text) {
            const newComments = [...machine.comments, {
                text: text,
                time: getTimestamp()
            }];
            // 最大50件に制限
            if (newComments.length > 50) {
                newComments.splice(0, newComments.length - 50);
            }
            updateCurrentMachine({
                comments: newComments
            });
            updateDisplay();
            input.value = '';
        }
    });

    // Enterキーで一言記録
    document.getElementById('comment').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveComment').click();
        }
    });

    // 入力欄にフォーカス
    document.getElementById('gameInput').focus();
}

// 起動
document.addEventListener('DOMContentLoaded', init);

// グローバルに公開（onclick用）
const app = {
    undoLast: undoLast,
    saveMachine: () => alert('台は自動保存されています'),
    resetSession: resetSession,
    deleteMachine: deleteMachine,
    deleteHistoryItem: deleteHistoryItem
};
