const state = {
  data: [], collection: 'anki', book: 'all', query: '', unit: null,
  words: [], index: 0, flipped: false, starredOnly: false,
  direction: 'en-vi', mode: 'learn', practiceType: 'essay'
};

const STAR_KEY = 'tutu-static-stars';
const LAST_LESSON_KEY = 'tutu-static-last-lesson';
const stars = new Set(JSON.parse(localStorage.getItem(STAR_KEY) || '[]').map(String));
let lastLessonId = localStorage.getItem(LAST_LESSON_KEY) || '';
const $ = (selector) => document.querySelector(selector);
const audioPlayer = new Audio();
audioPlayer.preload = 'none';
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const displayWord = (word) => `${word.english}${word.partOfSpeech ? ` (${word.partOfSpeech})` : ''}`;
const normalized = (value) => value.trim().toLocaleLowerCase('vi').replace(/[.,!?;:()]/g, '').replace(/\s+/g, ' ');
const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const plusMeaning = (value, english) => english.toLowerCase() === 'mean'
  ? 'có nghĩa là; có ý định; trung bình; keo kiệt'
  : value.replaceAll('t rả', 'trả').replaceAll('kẻo bạo ngược', 'kẻ bạo ngược')
    .replaceAll('chân biếm', 'châm biếm').replace(/\s*[,/]\s*/g, '; ')
    .replace(/\s*;\s*/g, '; ').trim();
const saveStars = () => localStorage.setItem(STAR_KEY, JSON.stringify([...stars]));
const saveLastLesson = (id) => { lastLessonId = id; localStorage.setItem(LAST_LESSON_KEY, id); };
const sourceId = (word) => word.lessonId || state.unit?.id || '';

function filteredUnits() {
  const query = state.query.toLocaleLowerCase('vi');
  return state.data.filter((item) => item.number > 12
    && (state.book === 'all' || Math.floor((item.number - 13) / 30) + 1 === Number(state.book))
    && `${item.title} ${item.subtitle || ''} unit ${item.number} ${item.words.map((word) => `${word.english} ${word.vietnamese}`).join(' ')}`
      .toLocaleLowerCase('vi').includes(query));
}

function renderFilters() {
  $('#filters').innerHTML = ['all', 1, 2, 3, 4, 5, 6].map((book) =>
    `<button class="${state.book === String(book) ? 'active' : ''}" data-book="${book}">${book === 'all' ? 'Tất cả' : `Sách ${book}`}</button>`).join('');
}

function renderHome() {
  const plus = state.collection === 'plus';
  $('#eyebrow').textContent = plus ? 'ANKI PLUS · TOEIC' : 'ANKI · FLASHCARD';
  $('#title').textContent = plus ? 'Học nghĩa sát ngữ cảnh.' : 'Học theo từng unit.';
  $('#description').textContent = plus
    ? 'Giữ nguyên bộ thẻ Anki, ưu tiên nghĩa tiếng Việt phù hợp với ngữ cảnh TOEIC.'
    : 'Ôn 6 bộ sách Anki theo đúng thứ tự và nghe phát âm ngay trên trình duyệt.';
  const units = filteredUnits();
  $('#unitTitle').textContent = plus ? 'Anki Plus · Danh sách unit' : 'Anki · Danh sách unit';
  $('#unitCount').textContent = `${units.length} unit · ${stars.size} từ đã đánh dấu`;
  $('#unitGrid').innerHTML = units.map((item) => {
    const book = Math.floor((item.number - 13) / 30) + 1;
    const unit = (item.number - 13) % 30 + 1;
    const isCurrentLesson = item.id === lastLessonId;
    return `<article class="unit ${isCurrentLesson ? 'current-unit-card' : ''}"><div class="unit-meta"><span class="unit-label">SÁCH ${book} · UNIT ${unit}</span>${isCurrentLesson ? '<span class="current-unit">ĐANG HỌC</span>' : ''}</div><h3>${escapeHtml(item.title)}</h3><p>${item.words.length} từ · ${plus ? 'nghĩa TOEIC' : 'audio gốc'}</p><button data-unit="${escapeHtml(item.id)}">${isCurrentLesson ? 'Tiếp tục học →' : 'Bắt đầu học →'}</button></article>`;
  }).join('') || '<p>Không tìm thấy unit phù hợp.</p>';
}

function prepareWords(units) {
  return units.flatMap((unit) => unit.words.map((word) => ({
    ...word,
    id: `${unit.id}-${word.position}`,
    lessonId: unit.id,
    lessonTitle: unit.title,
    vietnamese: state.collection === 'plus' ? plusMeaning(word.vietnamese, word.english) : word.vietnamese,
    audioUrl: `audio/${unit.id}/${word.position}.mp3`
  })));
}

function openUnit(id) {
  state.unit = state.data.find((item) => item.id === id);
  saveLastLesson(state.unit.id);
  state.words = prepareWords([state.unit]);
  state.index = 0; state.flipped = false; state.starredOnly = false; state.mode = 'learn';
  showStudy(`${state.collection === 'plus' ? 'ANKI PLUS' : 'ANKI'} · ĐANG HỌC`, state.unit.title);
}

function openStarred() {
  const words = prepareWords(state.data.filter((unit) => unit.number > 12)).filter((word) => stars.has(word.id));
  if (!words.length) { showMessage('Bạn chưa đánh dấu từ nào.'); return; }
  state.unit = { title: 'Từ đã đánh dấu', id: 'starred' };
  state.words = words; state.index = 0; state.flipped = false; state.starredOnly = false; state.mode = 'learn';
  showStudy(`${state.collection === 'plus' ? 'ANKI PLUS' : 'ANKI'} · ÔN TẬP`, 'Từ đã đánh dấu');
}

function showStudy(label, title) {
  $('#homeView').classList.add('hidden'); $('#studyView').classList.remove('hidden');
  $('#studyLabel').textContent = label; $('#studyTitle').textContent = title; renderCard();
}

function activeWords() { return state.starredOnly ? state.words.filter((word) => stars.has(word.id)) : state.words; }
function currentWord() { return activeWords()[state.index]; }

function renderCard() {
  const words = activeWords(); const word = currentWord();
  if (!word) {
    $('#front').innerHTML = '<h2>Chưa có từ được đánh dấu</h2><p class="hint">Tắt bộ lọc để xem toàn bộ unit.</p>';
    $('#backFace').innerHTML = ''; $('#counter').textContent = '0 / 0'; $('#progress').style.width = '0%'; return;
  }
  const englishSide = state.direction === 'en-vi';
  const prompt = state.direction === 'en-vi' ? displayWord(word) : word.vietnamese;
  const answer = state.direction === 'en-vi' ? word.vietnamese : displayWord(word);
  $('#card').classList.toggle('flipped', state.flipped);
  $('#front').innerHTML = `<button class="star ${stars.has(word.id) ? 'saved' : ''}" data-star="${escapeHtml(word.id)}" type="button" aria-label="Đánh dấu từ">★</button><p class="card-label">${englishSide ? 'TIẾNG ANH' : 'TIẾNG VIỆT'}</p><h2>${escapeHtml(prompt)}</h2>${englishSide ? `<p class="ipa">${escapeHtml(word.ipa || 'Chưa có phiên âm')}</p><p class="approx">${escapeHtml(word.nearReading || '')}</p>${renderAudioButton(word)}` : ''}<p class="hint">Nhấn thẻ để xem nghĩa</p>`;
  $('#backFace').innerHTML = `<p class="card-label">${englishSide ? 'TIẾNG VIỆT' : 'TIẾNG ANH'}</p><h2>${escapeHtml(answer)}</h2>${!englishSide ? renderAudioButton(word) : ''}${word.example ? `<p class="example">${escapeHtml(word.example)}</p>` : ''}<p class="hint">Nhấn thẻ để quay lại</p>`;
  $('#counter').textContent = `${state.index + 1} / ${words.length}`; $('#progress').style.width = `${(state.index + 1) / words.length * 100}%`;
  renderPractice(word);
}

function move(delta) { const words = activeWords(); if (!words.length) return; state.index = (state.index + delta + words.length) % words.length; state.flipped = false; renderCard(); }
function toggleStar(id) { stars.has(id) ? stars.delete(id) : stars.add(id); saveStars(); renderCard(); }
function renderAudioButton(word) {
  return `<button class="speak" data-audio="${escapeHtml(word.id)}" type="button" aria-label="Nghe phát âm ${escapeHtml(word.english)}">🔊 Nghe phát âm</button>`;
}
function playAudio(word) {
  if (!word?.audioUrl) { showMessage('Không tìm thấy đường dẫn audio cho thẻ này.'); return; }
  audioPlayer.pause();
  audioPlayer.dataset.path = word.audioUrl;
  audioPlayer.src = word.audioUrl;
  const playback = audioPlayer.play();
  if (playback) playback.catch(() => showMessage('Không phát được audio. Hãy mở trang bằng Live Server hoặc HTTP server.'));
}
audioPlayer.addEventListener('error', () => {
  if (audioPlayer.dataset.path) showMessage(`Thiếu hoặc không mở được file audio: ${audioPlayer.dataset.path}`);
});

function renderPractice(word) {
  const panel = $('#practicePanel');
  if (state.mode !== 'practice') { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden'); const prompt = state.direction === 'en-vi' ? displayWord(word) : word.vietnamese;
  if (state.practiceType === 'multiple') {
    const options = shuffle([word, ...shuffle(state.words.filter((item) => item.id !== word.id)).slice(0, 3)]);
    panel.innerHTML = `<h3>Chọn đáp án đúng</h3><p><strong>${escapeHtml(prompt)}</strong></p><div class="choices">${options.map((item, index) => `<button data-choice="${escapeHtml(item.id)}" type="button">${String.fromCharCode(65 + index)}. ${escapeHtml(state.direction === 'en-vi' ? item.vietnamese : displayWord(item))}</button>`).join('')}</div><p id="feedback"></p>`;
  } else {
    panel.innerHTML = `<h3>Dịch từ này</h3><p><strong>${escapeHtml(prompt)}</strong></p><form class="practice-form"><input autofocus placeholder="Nhập đáp án..."><button>Kiểm tra</button></form><p id="feedback"></p>`;
  }
}

document.addEventListener('click', (event) => {
  let target = event.target.closest('[data-collection]');
  if (target) { state.collection = target.dataset.collection; state.book = 'all'; document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab === target)); renderFilters(); renderHome(); return; }
  target = event.target.closest('[data-book]'); if (target) { state.book = target.dataset.book; renderFilters(); renderHome(); return; }
  target = event.target.closest('[data-unit]'); if (target) { openUnit(target.dataset.unit); return; }
  if (event.target.closest('#back')) { $('#studyView').classList.add('hidden'); $('#homeView').classList.remove('hidden'); return; }
  if (event.target.closest('#card') && !event.target.closest('[data-star],[data-audio]')) {
    state.flipped = !state.flipped;
    $('#card').classList.toggle('flipped', state.flipped);
    playAudio(currentWord());
    return;
  }
  target = event.target.closest('[data-star]'); if (target) { toggleStar(target.dataset.star); return; }
  target = event.target.closest('[data-audio]'); if (target) { playAudio(state.words.find((word) => word.id === target.dataset.audio)); return; }
  if (event.target.closest('#prev')) move(-1); if (event.target.closest('#next')) move(1);
  target = event.target.closest('#starFilter'); if (target) { state.starredOnly = !state.starredOnly; target.classList.toggle('active', state.starredOnly); state.index = 0; renderCard(); }
  if (event.target.closest('#direction')) { state.direction = state.direction === 'en-vi' ? 'vi-en' : 'en-vi'; event.target.textContent = state.direction === 'en-vi' ? 'Anh → Việt' : 'Việt → Anh'; state.flipped = false; renderCard(); }
  if (event.target.closest('#practice')) { state.mode = state.mode === 'learn' ? 'practice' : 'learn'; event.target.textContent = state.mode === 'practice' ? 'Học thẻ' : 'Luyện tập'; renderCard(); }
  target = event.target.closest('[data-choice]'); if (target) { const correct = target.dataset.choice === currentWord().id; $('#feedback').textContent = correct ? 'Chính xác!' : 'Chưa đúng, hãy thử lại.'; $('#feedback').className = correct ? 'correct' : 'wrong'; if (correct) setTimeout(() => move(1), 550); }
  if (event.target.closest('#openStarred')) openStarred();
});

document.addEventListener('submit', (event) => {
  if (!event.target.matches('.practice-form')) return; event.preventDefault();
  const word = currentWord(); const expected = state.direction === 'en-vi' ? word.vietnamese : word.english;
  const correct = normalized(event.target.querySelector('input').value) === normalized(expected);
  const feedback = $('#feedback'); feedback.textContent = correct ? 'Chính xác!' : 'Chưa đúng, hãy thử lại.'; feedback.className = correct ? 'correct' : 'wrong';
  if (correct) setTimeout(() => move(1), 550);
});

$('#search').addEventListener('input', (event) => { state.query = event.target.value; renderHome(); });
$('#practiceType').addEventListener('change', (event) => { state.practiceType = event.target.value; if (state.mode === 'practice') renderCard(); });
document.addEventListener('keydown', (event) => { if ($('#studyView').classList.contains('hidden') || event.target.matches('input')) return; if (event.key === 'ArrowLeft') move(-1); if (event.key === 'ArrowRight') move(1); if (event.key === 'ArrowDown') { event.preventDefault(); state.flipped = !state.flipped; $('#card').classList.toggle('flipped', state.flipped); playAudio(currentWord()); } if (event.key === 'ArrowUp') { const word = currentWord(); if (word) toggleStar(word.id); } });
function showMessage(text) { const message = $('#message'); message.textContent = text; message.classList.remove('hidden'); setTimeout(() => message.classList.add('hidden'), 2200); }
Promise.resolve(window.VOCABULARY_DATA).then((data) => {
  state.data = data;
  renderFilters();
  renderHome();
}).catch(() => { $('#unitGrid').innerHTML = '<p>Không tải được dữ liệu từ vựng.</p>'; });
