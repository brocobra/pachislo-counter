const STORAGE_KEY = 'pachislo_data';

// データを読み込み
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
        history: [],      // { type: 'BB'|'RB', before: number, after: number, time: string }
        memo: '',
        comments: []
    };
}

// データを保存
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, data);
    updateLastSaved();
}

// 有利区間の合計ゲーム数を計算
function calculateTotal() {
    const data = loadData();
    if (data.history.length === 0) return 0;
    return data.history[data.history.length - 1].after;
}

// 表示を更新
function updateDisplay() {
    const data = loadData();
    const total = calculateTotal();

    // 有利区間表示
    document.getElementById('totalGames').textContent = total;

    // メモ
    document.getElementById('memo').value = data.memo;

    // 履歴
    renderHistory(data.history);

    // コメント
    renderComments(data.comments);
}

// 履歴を表示
function renderHistory(history) {
    const container = document.getElementById('historyList');

    if (history.length === 0) {
        container.innerHTML = '<p class="empty">まだ履歴がありません</p>';
        return;
    }

    container.innerHTML = '';
    history.slice().reverse().forEach((item, index) => {
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

    const data = loadData();
    const prevTotal = calculateTotal();
    const afterGames = beforeGames + addGames;

    // 履歴に追加
    data.history.push({
        type: type,
        before: beforeGames,
        after: afterGames,
        time: getTimestamp()
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    updateDisplay();
    updateLastSaved();

    // 入力をクリアして次の入力準備
    input.value = '';
    input.focus();

    // 終了後ゲーム数を次回の入力値にセット（オプション）
    // input.value = afterGames;
}

// 元に戻す
function undoLast() {
    const data = loadData();
    if (data.history.length === 0) {
        alert('戻す履歴がありません');
        return;
    }

    if (confirm('最後の記録を削除しますか？')) {
        data.history.pop();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

    // BBボタン
    document.getElementById('bbBtn').addEventListener('click', () => {
        recordBonus('BB', 59);
    });

    // RBボタン
    document.getElementById('rbBtn').addEventListener('click', () => {
        recordBonus('RB', 24);
    });

    // EnterキーでBB/RB入力（Shift+EnterでRB、EnterだけでBB）
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
        const data = loadData();
        data.memo = document.getElementById('memo').value;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        updateLastSaved();
        alert('メモを保存しました');
    });

    // 一言記録
    document.getElementById('saveComment').addEventListener('click', () => {
        const input = document.getElementById('comment');
        const text = input.value.trim();
        if (text) {
            const data = loadData();
            data.comments.push({
                text: text,
                time: getTimestamp()
            });
            // 最大50件に制限
            if (data.comments.length > 50) {
                data.comments = data.comments.slice(-50);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            updateDisplay();
            updateLastSaved();
            input.value = '';
        }
    });

    // Enterキーで一言記録
    document.getElementById('comment').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('saveComment').click();
        }
    });

    // 元に戻す
    document.getElementById('undoBtn').addEventListener('click', undoLast);

    // リセット
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('本当にリセットしますか？すべてのデータが消去されます。')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });

    // 入力欄にフォーカス
    document.getElementById('gameInput').focus();
}

// 起動
document.addEventListener('DOMContentLoaded', init);
