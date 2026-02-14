document.addEventListener('DOMContentLoaded', function () {
    const EMPTY_STATE_TEXT = 'У вас пока нет достижений. Добавьте новое!';
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

    achievementsList.addEventListener('click', function (e) {
        const deleteButton = e.target.closest('.achievement-delete-btn');
        if (!deleteButton) {
            return;
        }

        const achievementId = Number(deleteButton.dataset.id);
        if (!Number.isInteger(achievementId)) {
            return;
        }

        deleteAchievement(achievementId, deleteButton);
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
                    renderEmptyState();
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
                    if (achievementsList.firstChild && achievementsList.firstChild.textContent === EMPTY_STATE_TEXT) {
                        achievementsList.removeChild(achievementsList.firstChild);
                    }
                    appendAchievementToList(data, true);
                }
            })
            .catch(error => console.error('Ошибка при добавлении достижения:', error));
    }

    function deleteAchievement(achievementId, deleteButton) {
        deleteButton.disabled = true;

        fetch('/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, id: achievementId })
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Ошибка при удалении достижения:', data.error);
                    deleteButton.disabled = false;
                    return;
                }

                const itemToRemove = achievementsList.querySelector(`li[data-id="${achievementId}"]`);
                if (itemToRemove) {
                    itemToRemove.remove();
                }

                if (!achievementsList.querySelector('.achievement-item')) {
                    renderEmptyState();
                }
            })
            .catch(error => {
                console.error('Ошибка при удалении достижения:', error);
                deleteButton.disabled = false;
            });
    }

    function appendAchievementToList(achievement, highlight = false) {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'achievement-item');
        listItem.dataset.id = achievement.id;
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

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-sm', 'btn-outline-danger', 'achievement-delete-btn');
        deleteButton.textContent = 'Удалить';
        deleteButton.dataset.id = achievement.id;
        deleteButton.title = 'Удалить достижение';

        listItem.appendChild(emojiSpan);
        listItem.appendChild(textSpan);
        listItem.appendChild(dateSpan);
        listItem.appendChild(deleteButton);

        achievementsList.appendChild(listItem);
    }

    function renderEmptyState() {
        const noAchievementsItem = document.createElement('li');
        noAchievementsItem.classList.add('list-group-item', 'text-center');
        noAchievementsItem.textContent = EMPTY_STATE_TEXT;
        achievementsList.appendChild(noAchievementsItem);
    }

    function formatDate(date) {
        const options = { year: 'numeric', month: 'long' };
        return date.toLocaleDateString('ru-RU', options);
    }
});
