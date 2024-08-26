from flask import Flask, render_template, request, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)

ACHIEVEMENTS_DIR = 'achievements'

# Создание директории для хранения достижений, если она не существует
if not os.path.exists(ACHIEVEMENTS_DIR):
    os.makedirs(ACHIEVEMENTS_DIR)

def get_user_file(username):
    """Создает безопасное имя файла на основе имени пользователя."""
    safe_username = "".join([c if c.isalnum() else "_" for c in username])
    return os.path.join(ACHIEVEMENTS_DIR, f"{safe_username}.json")

def load_achievements(username):
    """Загружает достижения пользователя из файла."""
    user_file = get_user_file(username)
    if os.path.exists(user_file):
        with open(user_file, 'r', encoding='utf-8') as file:
            return json.load(file)
    return []

def save_achievement(username, achievement_text, achievement_emoji, achievement_date):
    """Сохраняет новое достижение для пользователя."""
    achievements = load_achievements(username)
    new_achievement = {
        'id': len(achievements) + 1,
        'text': achievement_text,
        'emoji': achievement_emoji,
        'date': achievement_date
    }
    achievements.append(new_achievement)
    with open(get_user_file(username), 'w', encoding='utf-8') as file:
        json.dump(achievements, file, ensure_ascii=False, indent=4)
    return new_achievement

@app.route('/')
def index():
    """Отображает главную страницу приложения."""
    return render_template('index.html')

@app.route('/add', methods=['POST'])
def add_achievement():
    """Обрабатывает запрос на добавление нового достижения."""
    data = request.get_json()
    username = data.get('username')
    achievement_text = data.get('achievement')
    achievement_emoji = data.get('emoji', '⭐️')  # Эмодзи по умолчанию - звезда
    achievement_date = data.get('date') or datetime.now().strftime("%d.%m.%Y %H:%M")
    if not username or not achievement_text:
        return jsonify({'error': 'Invalid data'}), 400
    new_achievement = save_achievement(username, achievement_text, achievement_emoji, achievement_date)
    return jsonify(new_achievement), 201

@app.route('/get_achievements', methods=['GET'])
def get_achievements():
    """Возвращает достижения пользователя."""
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Username is required'}), 400
    achievements = load_achievements(username)
    return jsonify(achievements), 200

if __name__ == '__main__':
    app.run(debug=True)
