// データのキー
const STORAGE_KEY = 'pachislo_data';

// データを読み込み
function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {
        totalGames: 0,
        memo: '',
        comments: []
    };
}

// データを保存
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    updateLastSaved();
}

// 表示を更新
function updateDisplay() {
    const data = loadData();
    document.getElementById('totalGames').textContent = data.totalGames;
    document.getElementById('memo').value = data.memo;
    renderComments(data.comments);
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

// ゲーム数を加算
function addGames(count) {
    const data = loadData();
    data.totalGames += count;
    saveData(data);
    updateDisplay();
    animateChange();
}

// 数字アニメーション
function animateChange() {
    const countEl = document.getElementById('totalGames');
    countEl.style.transform = 'scale(1.2)';
    setTimeout(() => {
        countEl.style.transform = 'scale(1)';
    }, 200);
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

    // ゲーム数入力
    document.getElementById('addGames').addEventListener('click', () => {
        const input = document.getElementById('gameInput');
        const count = parseInt(input.value);
        if (!isNaN(count) && count > 0) {
            addGames(count);
            input.value = '';
        }
    });

    // BBボタン
    document.getElementById('bbBtn').addEventListener('click', () => {
        addGames(59);
    });

    // RBボタン
    document.getElementById('rbBtn').addEventListener('click', () => {
        addGames(24);
    });

    // メモ保存
    document.getElementById('saveMemo').addEventListener('click', () => {
        const data = loadData();
        data.memo = document.getElementById('memo').value;
        saveData(data);
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
            saveData(data);
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

    // Enterキーでゲーム数加算
    document.getElementById('gameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('addGames').click();
        }
    });

    // リセット
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm('本当にリセットしますか？すべてのデータが消去されます。')) {
            localStorage.removeItem(STORAGE_KEY);
            location.reload();
        }
    });
}

// 起動
document.addEventListener('DOMContentLoaded', init);
