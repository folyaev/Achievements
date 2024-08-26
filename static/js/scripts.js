document.addEventListener('DOMContentLoaded', function () {
    const usernameSection = document.getElementById('username-section');
    const mainSection = document.getElementById('main-section');
    const usernameForm = document.getElementById('username-form');
    const achievementForm = document.getElementById('achievement-form');
    const achievementsList = document.getElementById('achievements-list');
    const welcomeMessage = document.getElementById('welcome-message');
    const emojiInput = document.getElementById('emoji-input');
    const emojiButtons = document.querySelectorAll('.emoji-picker button');
    let username = '';

    emojiButtons.forEach(button => {
        button.addEventListener('click', () => {
            emojiInput.value = button.textContent;
        });
    });

    usernameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        username = document.getElementById('username-input').value.trim();
        if (username) {
            loadAchievements();
            welcomeMessage.textContent = `Вот чем ты крут, ${username}:`;
            usernameSection.style.display = 'none';
            mainSection.style.display = 'block';
        }
    });

    achievementForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const achievementText = document.getElementById('achievement-input').value.trim();
        const achievementEmoji = emojiInput.value.trim();
        const achievementDate = document.getElementById('date-input').value ? formatDate(new Date(document.getElementById('date-input').value)) : formatDate(new Date());

        if (achievementText) {
            addAchievement(achievementText, achievementEmoji, achievementDate);
            document.getElementById('achievement-input').value = '';
            emojiInput.value = '';
            document.getElementById('date-input').value = '';
        }
    });

    function loadAchievements() {
        fetch(`/get_achievements?username=${encodeURIComponent(username)}`)
            .then(response => response.json())
            .then(data => {
                achievementsList.innerHTML = '';
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(function (achievement) {
                        appendAchievementToList(achievement);
                    });
                } else {
                    const noAchievementsItem = document.createElement('li');
                    noAchievementsItem.classList.add('list-group-item', 'text-center');
                    noAchievementsItem.textContent = 'У вас пока нет достижений. Добавьте новое!';
                    achievementsList.appendChild(noAchievementsItem);
                }
            })
            .catch(error => console.error('Ошибка при загрузке достижений:', error));
    }

    function addAchievement(achievementText, achievementEmoji, achievementDate) {
        fetch('/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, achievement: achievementText, emoji: achievementEmoji, date: achievementDate })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Ошибка при добавлении достижения:', data.error);
                } else {
                    if (achievementsList.firstChild && achievementsList.firstChild.textContent === 'У вас пока нет достижений. Добавьте новое!') {
                        achievementsList.removeChild(achievementsList.firstChild);
                    }
                    appendAchievementToList(data, true);
                }
            })
            .catch(error => console.error('Ошибка при добавлении достижения:', error));
    }

    function appendAchievementToList(achievement, highlight = false) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        if (highlight) {
            listItem.classList.add('list-group-item-success');
        }

        const emojiSpan = document.createElement('span');
        emojiSpan.textContent = achievement.emoji || '⭐️'; // Если эмодзи не выбрано, используется звездочка по умолчанию
        emojiSpan.classList.add('me-2');

        const textSpan = document.createElement('span');
        textSpan.classList.add('achievement-text');
        textSpan.textContent = achievement.text;

        const dateSpan = document.createElement('span');
        dateSpan.classList.add('achievement-date');
        dateSpan.textContent = achievement.date;

        listItem.appendChild(emojiSpan);
        listItem.appendChild(textSpan);
        listItem.appendChild(dateSpan);

        achievementsList.appendChild(listItem);
    }

    function formatDate(date) {
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('ru-RU', options);
    }
});
