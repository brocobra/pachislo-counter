# 🎰 パチスロ 有利区間カウンター

パチスロの有利区間ゲーム数を管理するWebアプリケーション。

## 機能

- ✅ ゲーム数の手動入力・加算
- ✅ BB（+59G）・RB（+24G）のワンボタン入力
- ✅ 有利区間ゲーム数の表示・保存
- ✅ メモ機能
- ✅ 一言入力機能（履歴保存）
- ✅ データはブラウザに保存（localStorage）

## 使い方

1. 「ゲーム数を入力」で数字を入れて「加算」ボタン
2. BB/RBボタンでワンタップ加算
3. メモ・一言は自動保存

## GitHub Pages で公開する手順

```bash
# リポジトリ作成
cd pachislo-counter
git init
git add .
git commit -m "Initial commit"

# GitHub リポジトリ作成後
git branch -M main
git remote add origin https://github.com/ユーザー名/pachislo-counter.git
git push -u origin main
```

GitHub の Settings > Pages で「main」ブランチを選択して有効化。
