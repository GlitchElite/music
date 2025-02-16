// Константы для VK API
const VK_CLIENT_ID = '53082919'; // Ваш client_id (замените на ваш)
const VK_REDIRECT_URI = 'https://glitchelite.github.io/music/callback.html'; // URL для перенаправления после авторизации

// Элементы интерфейса
const vkAuthBtn = document.getElementById('vkAuthBtn');
const playlistMenu = document.getElementById('playlistMenu');
const playlistList = document.getElementById('playlistList');
const trackName = document.getElementById('trackName');
const seekSlider = document.getElementById('seekSlider');
const prevBtn = document.getElementById('prevBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const playerContainer = document.getElementById('playerContainer');

let currentTrack = 0;

// Функция для авторизации через ВК
function vkAuthorize() {
    const authUrl = `https://oauth.vk.com/authorize?client_id=${VK_CLIENT_ID}&display=page&redirect_uri=${VK_REDIRECT_URI}&scope=audio,offline&response_type=token&v=5.131`;
    window.location.href = authUrl;
}

// Функция для получения access_token из URL
function getAccessTokenFromUrl() {
    const hashParams = {};
    window.location.hash
        .substr(1) // Убираем символ "#"
        .split('&') // Разделяем параметры
        .forEach((item) => {
            const parts = item.split('='); // Разделяем ключ и значение
            hashParams[parts[0]] = decodeURIComponent(parts[1]); // Добавляем в объект
        });
    return hashParams.access_token || null; // Возвращаем access_token или null
}

// Функция для получения плейлистов из ВК
async function fetchPlaylists(accessToken) {
    try {
        const response = await axios.get('https://api.vk.com/method/audio.get', {
            params: {
                v: '5.131',
                access_token: accessToken,
                count: 100
            }
        });

        const tracks = response.data.response.items;

        // Отображаем треки
        tracks.forEach((track, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            li.textContent = `${track.artist} - ${track.title}`;
            playlistList.appendChild(li);
        });

        // Показываем плеер
        playlistMenu.style.display = 'block';
        playerContainer.style.display = 'block';
    } catch (error) {
        console.error('Ошибка при загрузке плейлистов:', error);
    }
}

// Выбор трека
playlistList.addEventListener('click', (event) => {
    if (event.target.tagName === 'LI') {
        const trackIndex = event.target.dataset.index;
        loadTrack(trackIndex);
    }
});

// Функция для загрузки трека
async function loadTrack(trackIndex) {
    const accessToken = getAccessTokenFromUrl();
    try {
        const response = await axios.get('https://api.vk.com/method/audio.get', {
            params: {
                v: '5.131',
                access_token: accessToken,
                count: 100
            }
        });

        const tracks = response.data.response.items;
        const track = tracks[trackIndex];

        const audioPlayer = new Audio(track.url);
        audioPlayer.play();
        trackName.textContent = `${track.artist} - ${track.title}`;

        // Обработка окончания трека
        audioPlayer.addEventListener('ended', () => {
            nextTrack(tracks);
        });

        // Обновление ползунка
        audioPlayer.addEventListener('timeupdate', () => {
            const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            seekSlider.value = progress;
        });

        seekSlider.addEventListener('input', () => {
            const seekTime = (seekSlider.value / 100) * audioPlayer.duration;
            audioPlayer.currentTime = seekTime;
        });

        // Сохраняем текущий трек
        currentTrack = trackIndex;
    } catch (error) {
        console.error('Ошибка при загрузке трека:', error);
    }
}

// Функция для перехода к следующему треку
function nextTrack(tracks) {
    currentTrack++;
    if (currentTrack >= tracks.length) {
        currentTrack = 0; // Циклическое переключение
    }
    loadTrack(currentTrack);
}

// Кнопка "Назад"
prevBtn.addEventListener('click', async () => {
    currentTrack--;
    if (currentTrack < 0) {
        currentTrack = tracks.length - 1; // Циклическое переключение
    }
    loadTrack(currentTrack);
});

// Кнопка "Вперед"
nextBtn.addEventListener('click', () => {
    nextTrack();
});

// Кнопка "Стоп/Продолжить"
playPauseBtn.addEventListener('click', (event) => {
    const audioPlayer = document.querySelector('audio');
    if (audioPlayer.paused) {
        audioPlayer.play();
        playPauseBtn.textContent = '⏸';
    } else {
        audioPlayer.pause();
        playPauseBtn.textContent = '▶';
    }
});

// Кнопка авторизации через ВК
vkAuthBtn.addEventListener('click', vkAuthorize);

// Проверка наличия access_token при загрузке страницы
window.onload = () => {
    const accessToken = getAccessTokenFromUrl();
    if (accessToken) {
        fetchPlaylists(accessToken);
    }
};
