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

def save_achievements(username, achievements):
    """Сохраняет список достижений пользователя в файл."""
    with open(get_user_file(username), 'w', encoding='utf-8') as file:
        json.dump(achievements, file, ensure_ascii=False, indent=4)

def parse_achievement_id(value):
    """Преобразует id достижения в число или возвращает None."""
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def save_achievement(username, achievement_text, achievement_emoji, achievement_date):
    """Сохраняет новое достижение для пользователя."""
    achievements = load_achievements(username)
    existing_ids = [
        parsed_id
        for parsed_id in (parse_achievement_id(achievement.get('id')) for achievement in achievements)
        if parsed_id is not None
    ]
    next_id = max(existing_ids, default=0) + 1
    new_achievement = {
        'id': next_id,
        'text': achievement_text,
        'emoji': achievement_emoji,
        'date': achievement_date
    }
    achievements.append(new_achievement)
    save_achievements(username, achievements)
    return new_achievement

def delete_achievement(username, achievement_id):
    """Удаляет достижение пользователя по id."""
    achievements = load_achievements(username)
    filtered_achievements = [
        achievement
        for achievement in achievements
        if parse_achievement_id(achievement.get('id')) != achievement_id
    ]
    if len(filtered_achievements) == len(achievements):
        return False
    save_achievements(username, filtered_achievements)
    return True

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

@app.route('/delete', methods=['DELETE'])
def delete_achievement_route():
    """Удаляет достижение пользователя."""
    data = request.get_json()
    username = data.get('username') if data else None
    achievement_id = data.get('id') if data else None
    if not username or achievement_id is None:
        return jsonify({'error': 'Invalid data'}), 400
    achievement_id = parse_achievement_id(achievement_id)
    if achievement_id is None:
        return jsonify({'error': 'Invalid achievement id'}), 400
    deleted = delete_achievement(username, achievement_id)
    if not deleted:
        return jsonify({'error': 'Achievement not found'}), 404
    return jsonify({'success': True}), 200

if __name__ == '__main__':
    app.run(debug=True)
